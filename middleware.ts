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
       * The 'authorized' callback determines if the middleware function even runs.
       * If it returns false, the user is redirected to the sign-in page automatically.
       */
      authorized: ({ token }) => !!token,
    },
  }
);

/**
 * Configure which paths the middleware should run on.
 * This prevents middleware from running on static assets, images, and public routes.
 */
export const config = {
  matcher: [
    "/playground/:path*", 
    "/admin/:path*",
    // Add other protected routes here
  ],
};