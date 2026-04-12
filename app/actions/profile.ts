"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs"; // Switched to bcryptjs

/**
 * Updates user profile details including name, avatar, and password.
 */
export async function updateProfile(data: { 
  name?: string; 
  image?: string; 
  currentPassword?: string; 
  newPassword?: string 
}) {
  // 1. Authenticate the user session
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized: Please log in to update your profile.");
  }

  const userId = session.user.id;

  // 2. Handle Password Change Logic
  let hashedNewPassword = undefined;

  if (data.newPassword) {
    if (!data.currentPassword) {
      throw new Error("Current password is required to set a new password.");
    }

    // Fetch the current user from DB to verify the old password
    const [currentUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!currentUser || !currentUser.password) {
      throw new Error("User account not found or local password not set (Social login user).");
    }

    // Verify current password (bcryptjs.compare)
    const isPasswordMatch = await bcrypt.compare(data.currentPassword, currentUser.password);
    if (!isPasswordMatch) {
      throw new Error("The current password you entered is incorrect.");
    }

    // Hash the new password (bcryptjs.hash)
    const salt = await bcrypt.genSalt(10);
    hashedNewPassword = await bcrypt.hash(data.newPassword, salt);
  }

  try {
    // 3. Update the database
    // Only update fields that are provided to avoid overwriting with undefined
    const updatePayload: Partial<typeof users.$inferInsert> = {};
    
    if (data.name) updatePayload.name = data.name;
    if (data.image) updatePayload.image = data.image;
    if (hashedNewPassword) updatePayload.password = hashedNewPassword;

    if (Object.keys(updatePayload).length === 0) {
      return { success: false, message: "No changes provided." };
    }

    await db.update(users)
      .set(updatePayload)
      .where(eq(users.id, userId));

    // 4. Refresh the data for the client
    revalidatePath("/profile");
    revalidatePath("/admin");

    return { 
      success: true, 
      message: "Profile updated successfully." 
    };

  } catch (error) {
    console.error("Profile Update Error:", error);
    throw new Error("Failed to update profile. Please try again.");
  }
}