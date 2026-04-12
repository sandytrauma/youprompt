import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // 1. Define Route Protections
    const isAdminRoute = pathname.startsWith("/admin");

    // 2. Role-Based Access Control (RBAC)
    // If accessing an admin route but the role is not admin, redirect to playground
    if (isAdminRoute && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/playground", req.url));
    }

    // 3. Fallthrough
    return NextResponse.next();
  },
  {
    callbacks: {
      /**
       * Ensure authorized only checks for a token presence.
       * withAuth handles the redirect to /login automatically if this returns false.
       */
      authorized: ({ token }) => !!token,
    },
    // Adding pages config here ensures middleware knows where to send unauthenticated users
    pages: {
      signIn: "/login",
    },
  }
);

/**
 * Configure which paths the middleware should run on.
 */
export const config = {
  matcher: [
    /*
     * Match all protected routes:
     * - /playground and subpaths
     * - /admin and subpaths
     * * IMPORTANT: Ensure /api/auth is NOT matched. 
     * Your current specific matching is good, but if you use a wider matcher, 
     * use a negative lookahead to exclude NextAuth internals.
     */
    "/playground/:path*", 
    "/admin/:path*",
  ],
};