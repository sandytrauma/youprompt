/**
 * Copyright 2026 Sandeep Kumar
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use server";

import { db } from "@/db";
import { 
  likes, 
  comments, 
  subscriptions, 
  inquiries,
  vibes,
  tasks
} from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

/**
 * Helper to get the current session user ID
 */
async function getUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

/**
 * PUBLISH TO EXPLORE
 * This copies a private inquiry/task into the public 'vibes' table.
 * Use this to fill your Explore page!
 */
export async function publishToExplore(inquiryId: string) {
  try {
    // 1. Get the authenticated User ID (must be a UUID string)
    const userId = await getUserId();

    // 2. Fetch the inquiry and its latest task
    const inquiry = await db.query.inquiries.findFirst({
      where: eq(inquiries.id, inquiryId),
      with: {
        tasks: {
          orderBy: [desc(tasks.version)],
          limit: 1,
        },
      },
    });

    // Check ownership and existence
    if (!inquiry || inquiry.userId !== userId) {
      return { success: false, error: "Record not found or unauthorized" };
    }

    const latestTask = inquiry.tasks[0];
    if (!latestTask) {
      return { success: false, error: "No generated content found to share" };
    }

    // 3. Insert into the vibes table
    // latestTask.steps is your jsonb column containing the 7 steps
    await db.insert(vibes).values({
      creatorId: userId,
      title: inquiry.title || "Untitled Vibe",
      // We use the versionName as the 'prompt' summary for the explore feed
      prompt: latestTask.versionName || "Custom AI Workflow", 
      // This maps the task roadmap directly to the vibe roadmap
      steps: latestTask.steps, 
      createdAt: new Date(),
    });

    // 4. Refresh the Explore page
    revalidatePath("/explore");
    
    return { success: true };
  } catch (error) {
    console.error("Error in publishToExplore:", error);
    return { success: false, error: "Failed to publish to Explore" };
  }
}

/**
 * Toggle Vibe Visibility
 * NOTE: Currently returns a safe message because 'is_public' 
 * does not exist in your physical database schema.
 */
export async function toggleVibeVisibility(inquiryId: string, isPublic: boolean) {
  try {
    const userId = await getUserId();
    console.warn("Visibility toggle ignored: 'is_public' column not found in schema.");
    
    // We return false because the schema hasn't been migrated to include this column
    return { success: false, error: "Database column 'is_public' does not exist." };
  } catch (error) {
    console.error("Error in toggleVibeVisibility:", error);
    return { success: false, error: "Failed to update visibility" };
  }
}

/**
 * Toggle Like for a Vibe
 */
export async function toggleLike(vibeId: string) {
  try {
    const userId = await getUserId();
    const existing = await db.query.likes.findFirst({
      where: and(eq(likes.vibeId, vibeId), eq(likes.userId, userId)),
    });

    if (existing) {
      await db.delete(likes).where(
        and(eq(likes.vibeId, vibeId), eq(likes.userId, userId))
      );
    } else {
      await db.insert(likes).values({ 
        vibeId, 
        userId 
      });
    }

    revalidatePath("/explore");
    return { success: true };
  } catch (error) {
    console.error("Error in toggleLike:", error);
    return { success: false };
  }
}

/**
 * Add a comment to a Vibe
 */
export async function addComment(vibeId: string, content: string) {
  try {
    const userId = await getUserId();
    if (!content.trim()) return { success: false, error: "Content is empty" };

    await db.insert(comments).values({ 
      vibeId, 
      userId, 
      content,
      createdAt: new Date()
    });

    revalidatePath("/explore");
    return { success: true };
  } catch (error) {
    console.error("Error in addComment:", error);
    return { success: false };
  }
}

/**
 * Follow or Unfollow a user
 */
export async function toggleFollow(followingId: string) {
  try {
    const followerId = await getUserId();
    if (followerId === followingId) return { success: false, error: "Cannot follow yourself" };

    const existing = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.followerId, followerId),
        eq(subscriptions.followingId, followingId)
      ),
    });

    if (existing) {
      await db.delete(subscriptions).where(
        and(
          eq(subscriptions.followerId, followerId), 
          eq(subscriptions.followingId, followingId)
        )
      );
    } else {
      await db.insert(subscriptions).values({ 
        followerId, 
        followingId 
      });
    }

    revalidatePath("/explore");
    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Error in toggleFollow:", error);
    return { success: false };
  }
}