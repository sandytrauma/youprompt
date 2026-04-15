import { NextAuthOptions, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// 1. Module Augmentation to include SaaS fields in the Session object
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "user" | "admin";
      credits: number;
      plan: "free" | "builder" | "agency";
    } & DefaultSession["user"];
  }

  // Extend the User interface returned by authorize
  interface User {
    id: string;
    role: "user" | "admin";
    credits: number;
    plan: "free" | "builder" | "agency";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "user" | "admin";
    credits: number;
    plan: "free" | "builder" | "agency";
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 Days
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        // Search for user in Neon DB
        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email.toLowerCase().trim()),
        });

        if (!user || !user.password) {
          throw new Error("No user found with this email");
        }

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordCorrect) {
          throw new Error("Incorrect password");
        }

        // Return the user object with SaaS fields
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image, 
          role: (user.role as "user" | "admin") || "user",
          credits: user.credits ?? 0,
          plan: (user.plan as "free" | "builder" | "agency") || "free",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // INITIAL SIGN IN
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image; 
        token.role = user.role;
        token.credits = user.credits;
        token.plan = user.plan;
      }

      // HANDLE SESSION UPDATE (Sync with Neon DB)
      // This is triggered when update() is called on the client
      if (trigger === "update") {
        // We use token.id to fetch the absolute latest data from the database
        const freshUser = await db.query.users.findFirst({
          where: eq(users.id, token.id),
        });

        if (freshUser) {
          token.name = freshUser.name;
          token.picture = freshUser.image;
          token.credits = freshUser.credits ?? 0;
          token.plan = (freshUser.plan as "free" | "builder" | "agency") || "free";
          token.role = (freshUser.role as "user" | "admin") || "user";
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture as string; 
        session.user.role = token.role;
        session.user.credits = token.credits;
        session.user.plan = token.plan;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};