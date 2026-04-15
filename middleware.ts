/**
 * Copyright 2026 Sandeep Kumar
 * YouPrompt Secure Middleware v1.2
 * Patches: Redirect Loop Prevention, Edge-Optimized RBAC, and Token Integrity.
 */

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;
    const url = req.nextUrl.clone();

    // 1. Path Identification
    const isAdminRoute = pathname.startsWith("/admin");
    const isPlaygroundRoute = pathname.startsWith("/playground");
    const isProfileRoute = pathname.startsWith("/profile");
    const isRefillRoute = pathname.startsWith("/refill");

    // 2. Role-Based Access Control (RBAC)
    // If a non-admin tries to access admin routes, redirect to playground
    if (isAdminRoute && token?.role !== "admin") {
      url.pathname = "/playground";
      return NextResponse.redirect(url);
    }

    // 3. Extra Security Layer (Fail-safe)
    // Ensure that if a user is NOT logged in but somehow hits these protected routes,
    // they are sent to login. withAuth handles the majority of this, but this
    // explicit check prevents edge-case bypasses in the Edge Runtime.
    const isProtectedRoute = isPlaygroundRoute || isProfileRoute || isAdminRoute || isRefillRoute;
    
    if (isProtectedRoute && !token?.sub) {
      url.pathname = "/login";
      // Prevent redirect loops if the user is already on the login page
      if (pathname === "/login") return NextResponse.next();
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      /**
       * authorized Callback
       * @param token The decrypted JWT token
       * @param req The incoming request object
       * @returns boolean - true to allow access, false to redirect to signIn page
       */
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Publicly accessible routes that still run through middleware
        // for "Logged In" UI states (e.g., Explore Feed)
        if (pathname.startsWith("/explore")) {
          return true; 
        }
        
        // Require a valid session token for all other matched routes
        // We check for .sub to ensure the token is a valid NextAuth identity
        return !!token?.sub;
      },
    },
    pages: {
      // Custom sign-in page location
      signIn: "/login",
      // Custom error page for auth failures
      error: "/login", 
    },
  }
);

/**
 * Middleware Configuration Matcher
 * Optimized to exclude static assets and public landing pages.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public folder assets)
     */
    "/playground/:path*", 
    "/admin/:path*",
    "/profile/:path*",
    "/explore/:path*",
    "/refill/:path*",
    "/dashboard/:path*",
  ],
};