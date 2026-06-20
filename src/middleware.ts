import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isAccountRoute = nextUrl.pathname.startsWith("/account");
  const isCheckoutRoute = nextUrl.pathname.startsWith("/checkout");
  const isProfileRoute = nextUrl.pathname.startsWith("/profile");
  const isOrdersRoute = nextUrl.pathname.startsWith("/orders");
  const isWishlistRoute = nextUrl.pathname.startsWith("/wishlist");
  const isAuthRoute = nextUrl.pathname.startsWith("/auth");

  // ── Admin: must be logged in as ADMIN ────────────────────────────────
  if (isAdminRoute) {
    if (!isLoggedIn) {
      const callbackUrl = nextUrl.pathname + nextUrl.search;
      const redirectUrl = new URL("/", nextUrl);
      redirectUrl.searchParams.set("openAuth", "login");
      redirectUrl.searchParams.set("callbackUrl", callbackUrl);
      return NextResponse.redirect(redirectUrl);
    }
    if (userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }

  // ── Protected routes: redirect to home with modal trigger ─────────────
  // We use /?openAuth=login&callbackUrl=<path> so the AuthModal opens
  // automatically rather than sending users to a separate auth page.
  const isProtectedRoute =
    isAccountRoute ||
    isCheckoutRoute ||
    isProfileRoute ||
    isOrdersRoute ||
    isWishlistRoute;

  if (isProtectedRoute && !isLoggedIn) {
    const callbackUrl = nextUrl.pathname + nextUrl.search;
    const redirectUrl = new URL("/", nextUrl);
    redirectUrl.searchParams.set("openAuth", "login");
    redirectUrl.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(redirectUrl);
  }

  // ── Auth pages: redirect logged-in users away ─────────────────────────
  if (isAuthRoute && isLoggedIn) {
    if (userRole === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", nextUrl));
    }
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/account/:path*",
    "/checkout/:path*",
    "/profile/:path*",
    "/orders/:path*",
    "/wishlist/:path*",
    "/auth/:path*",
  ],
};
