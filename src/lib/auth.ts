import NextAuth, { type NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { authConfig } from "@/auth.config";
import { supabaseAdmin } from "@/lib/supabase";

const providers: NextAuthConfig["providers"] = [
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null;
      }

      const email = String(credentials.email).toLowerCase().trim();
      const password = String(credentials.password);

      const { data: user, error } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

      if (error || !user || !user.password) {
        return null;
      }

      if (user.is_active === false) {
        console.warn("[NextAuth authorize] User account is deactivated:", email);
        return null;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return null;
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.avatar_url,
      };
    },
  }),
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID || "google-client-id-placeholder",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "google-client-secret-placeholder",
    allowDangerousEmailAccountLinking: true,
  }),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;
        const email = user.email.toLowerCase().trim();

        try {
          // 1. Check if user already exists in DB
          const { data: existingUser } = await supabaseAdmin
            .from("users")
            .select("*")
            .eq("email", email)
            .maybeSingle();

          if (existingUser) {
            if (existingUser.is_active === false) {
              console.warn("[NextAuth Google signIn] Account deactivated:", email);
              return false;
            }

            // Update avatar if avatar_url is null
            if (!existingUser.avatar_url && user.image) {
              await supabaseAdmin
                .from("users")
                .update({ avatar_url: user.image })
                .eq("id", existingUser.id);
            }

            // Bind DB user id and role to NextAuth user object
            user.id = existingUser.id;
            user.role = existingUser.role;
            user.image = existingUser.avatar_url || user.image;
            console.log("[NextAuth Google signIn] Linked to existing account:", existingUser.id);
            return true;
          }

          // 2. Create new DB user record if not exists
          const newUserId = crypto.randomUUID();
          const dummyPassword = await bcrypt.hash(crypto.randomUUID(), 10);
          const { data: newUser, error: createErr } = await supabaseAdmin
            .from("users")
            .insert({
              id: newUserId,
              email: email,
              name: user.name || "Google User",
              password: dummyPassword,
              avatar_url: user.image || null,
              role: "USER",
              is_active: true,
            })
            .select("*")
            .single();

          if (createErr || !newUser) {
            console.error("[NextAuth Google signIn] Error creating user in DB:", createErr);
            return false;
          }

          // Create default cart for new user
          try {
            await supabaseAdmin.from("carts").insert({
              id: crypto.randomUUID(),
              user_id: newUser.id,
            });
          } catch (cartErr) {
            console.warn("[NextAuth Google signIn] Skipping cart pre-insert:", cartErr);
          }

          user.id = newUser.id;
          user.role = newUser.role;
          user.image = newUser.avatar_url || user.image;
          console.log("[NextAuth Google signIn] Created new DB user account:", newUser.id);
          return true;
        } catch (err) {
          console.error("[NextAuth Google signIn] Exception:", err);
          return false;
        }
      }
      return true;
    },
  },
});
