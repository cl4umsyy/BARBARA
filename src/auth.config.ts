import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      console.log("[NextAuth Callback jwt] token:", token, "user:", user, "trigger:", trigger, "session:", session);
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.picture = user.image;
      }
      if (trigger === "update" && session) {
        if (session.name !== undefined) token.name = session.name;
        if (session.image !== undefined) token.picture = session.image;
        if (session.user) {
          if (session.user.name !== undefined) token.name = session.user.name;
          if (session.user.image !== undefined) token.picture = session.user.image;
        }
      }
      return token;
    },
    async session({ session, token }) {
      console.log("[NextAuth Callback session] session:", session, "token:", token);
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        session.user.image = token.picture as string | null;
      }
      return session;
    },
  },
  providers: [],
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;
