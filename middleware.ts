import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    const isAdminRoute = pathname.startsWith("/admin");
    const isPlaygroundRoute = pathname.startsWith("/playground");
    const isProfileRoute = pathname.startsWith("/profile");
    const isRefillRoute = pathname.startsWith("/refill");

    // 1. Role-Based Access Control (RBAC)
    if (isAdminRoute && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/playground", req.url));
    }

    // 2. Extra Security Layer
    // Ensure that if a user is NOT logged in but somehow hits these routes, 
    // they are sent to login (withAuth usually handles this, but this is a fail-safe).
    if ((isPlaygroundRoute || isProfileRoute || isAdminRoute || isRefillRoute) && !token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Publicly accessible route
        if (pathname.startsWith("/explore")) {
          return true;
        }
        
        // Require authentication for all other matched routes
        return !!token;
      },
    },
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
     * Include /refill in the protected list so users 
     * must be logged in to purchase credits.
     */
    "/playground/:path*", 
    "/admin/:path*",
    "/profile/:path*",
    "/explore/:path*",
    "/refill/:path*",
  ],
};