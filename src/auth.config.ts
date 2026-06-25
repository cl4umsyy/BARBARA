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
    async redirect({ url, baseUrl }) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
      
      if (url.startsWith("/")) {
        const base = (process.env.NODE_ENV === "production" && appUrl) ? appUrl : baseUrl;
        return `${base.endsWith("/") ? base.slice(0, -1) : base}${url}`;
      }
      
      try {
        const targetUrl = new URL(url);
        const baseUrlObj = new URL(baseUrl);
        
        if (targetUrl.hostname === "localhost" && process.env.NODE_ENV === "production" && appUrl) {
          const appUrlObj = new URL(appUrl);
          targetUrl.protocol = appUrlObj.protocol;
          targetUrl.host = appUrlObj.host;
          return targetUrl.toString();
        }
        
        if (
          targetUrl.origin === baseUrlObj.origin ||
          (appUrl && targetUrl.origin === new URL(appUrl).origin) ||
          targetUrl.hostname.endsWith(".vercel.app") ||
          targetUrl.hostname === "localhost"
        ) {
          return url;
        }
      } catch (e) {
        // Ignored
      }
      
      return (process.env.NODE_ENV === "production" && appUrl) ? appUrl : baseUrl;
    },
  },
  providers: [],
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;
