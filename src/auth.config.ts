import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log("[NextAuth Callback jwt] token:", token, "user:", user);
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      console.log("[NextAuth Callback session] session:", session, "token:", token);
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
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
