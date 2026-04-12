"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

/**
 * Production-ready Server Action for User Registration
 * Includes initial credit grant for SaaS onboarding.
 */
export async function signUpUser(formData: FormData) {
  const name = formData.get("name") as string;
  const rawEmail = formData.get("email") as string;
  const password = formData.get("password") as string;

  // 1. Basic Validation & Sanitization
  if (!name?.trim() || !rawEmail?.trim() || !password) {
    return { error: "All fields are required." };
  }

  const email = rawEmail.toLowerCase().trim();

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters for better security." };
  }

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  try {
    // 2. Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return { error: "An account with this email already exists." };
    }

    // 3. Secure Password Hashing
    const hashedPassword = await bcrypt.hash(password, 12);

    // 4. Create User with Initial SaaS State
    // We explicitly set the welcome credits here
    await db.insert(users).values({
      name: name.trim(),
      email: email,
      password: hashedPassword,
      role: "user",        // Explicitly set default role
      credits: 5,         // GRANT 5 FREE VIBES ON SIGNUP
      plan: "free",       // Initialize plan status
    });

    return { success: true };
  } catch (error: any) {
    // Log the error for internal tracking but keep the user message generic
    console.error("PROD_SIGNUP_ERROR:", error);
    return { 
      error: "An unexpected error occurred during registration. Please try again later." 
    };
  }
}