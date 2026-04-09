"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

/**
 * Server Action to handle new user registration
 */
export async function signUpUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // 1. Basic Validation
  if (!email || !password || !name) {
    return { error: "Please fill in all fields." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters long." };
  }

  try {
    // 2. Check if user already exists in your Neon database
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return { error: "An account with this email already exists." };
    }

    // 3. Hash the password securely
    // We use 12 salt rounds for a good balance of security and speed
    const hashedPassword = await bcrypt.hash(password, 12);

    // 4. Insert the new user into the database
    // The 'role' defaults to 'user' as defined in your schema
    await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
    });

    return { success: true };
  } catch (error: any) {
    console.error("SIGNUP_ERROR:", error);
    return { error: "Could not create account. Please try again." };
  }
}