"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Admin-only action to manually adjust user credits.
 * Implements a 2FA-style passkey check for high-sensitivity mutations.
 */
export async function updateUserDetails(userId: string, amount: number, passkey: string) {
  // 1. Authentication & Role Authorization
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "admin") {
    console.error(`Unauthorized access attempt by: ${session?.user?.email || "Unknown"}`);
    throw new Error("Unauthorized: Admin privileges required.");
  }

  // 2. Input Validation
  if (!userId || isNaN(amount)) {
    throw new Error("Invalid request parameters.");
  }

  // 3. Security "2FA" Gate
  const masterPasskey = process.env.ADMIN_MUTATION_PASSKEY;

  // Ensure the env variable exists to prevent logic bypass
  if (!masterPasskey) {
    console.error("CRITICAL: ADMIN_MUTATION_PASSKEY is not defined in environment variables.");
    throw new Error("System configuration error. Action aborted.");
  }

  if (passkey !== masterPasskey) {
    console.warn(`FAILED PASSKEY ATTEMPT: Admin ${session.user.email} attempted mutation on User ${userId}`);
    throw new Error("Invalid Admin Passkey. This incident has been logged.");
  }

  try {
    // 4. Database Mutation
    // Using sql template to ensure atomic increment/decrement
    await db.update(users)
      .set({ 
        credits: sql`${users.credits} + ${amount}`,
      })
      .where(eq(users.id, userId));

    // 5. Audit Logging
    console.log(`SUCCESSFUL MUTATION: Admin ${session.user.email} added ${amount} credits to User ${userId}`);

    // 6. Cache Invalidation
    // Forces the Admin Dashboard and any relevant pages to show fresh data
    revalidatePath("/admin");
    
    return { success: true, message: `Successfully updated ${amount} credits.` };

  } catch (error) {
    console.error("Database Error during updateUserDetails:", error);
    throw new Error("Failed to update user records in the database.");
  }
}