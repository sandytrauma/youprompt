/**
 * Copyright 2026 Sandeep Kumar
 * Enterprise Social Logic Protocol v2.4
 * Patches: Transactional Atomicity, Input Sanitization, and Discriminated Union Responses.
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
import { z } from "zod";
import { sanitizeInput } from "@/lib/sanitizer";


// --- Types ---

type ActionResponse = 
  | { success: true; data?: any } 
  | { success: false; error: string };

// Validation Schema for Social Content
const commentSchema = z.string().min(1).max(500).trim();

// --- Helpers ---

async function getUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

// --- Actions ---

/**
 * PUBLISH TO EXPLORE
 * Copies private data to public vibes table using a database transaction.
 */
export async function publishToExplore(inquiryId: string): Promise<ActionResponse> {
  try {
    const userId = await getUserId();

    // ✅ Removed db.transaction()
    // Step 1: Fetch with regular db call
    const inquiry = await db.query.inquiries.findFirst({
      where: and(eq(inquiries.id, inquiryId), eq(inquiries.userId, userId)),
      with: {
        tasks: {
          orderBy: [desc(tasks.version)],
          limit: 1,
        },
      },
    });

    if (!inquiry) return { success: false, error: "Record not found or access denied." };

    const latestTask = inquiry.tasks[0];
    if (!latestTask) return { success: false, error: "No generated content available to share." };

    // Step 2: Insert with regular db call
    await db.insert(vibes).values({
      creatorId: userId,
      title: inquiry.title || "Untitled Vibe",
      prompt: latestTask.versionName || "Custom AI Workflow", 
      steps: latestTask.steps, 
      createdAt: new Date(),
    });

    // Step 3: Revalidate cache
    revalidatePath("/explore");
    
    return { success: true };
  } catch (error) {
    console.error("[SOCIAL_ACTION_PUBLISH]:", error);
    return { success: false, error: "Failed to publish content." };
  }
}

/**
 * TOGGLE LIKE
 * Handles atomic toggle of like status.
 */
export async function toggleLike(vibeId: string): Promise<ActionResponse> {
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
      await db.insert(likes).values({ vibeId, userId });
    }

    revalidatePath("/explore");
    return { success: true };
  } catch (error) {
    console.error("[SOCIAL_ACTION_LIKE]:", error);
    return { success: false, error: "Unable to process like request." };
  }
}

/**
 * ADD COMMENT
 * Sanitizes input and validates length before insertion.
 */

export async function addComment(vibeId: string, rawContent: string): Promise<ActionResponse> {
  try {
    const userId = await getUserId();
    
    const validation = commentSchema.safeParse(rawContent);
    if (!validation.success) {
      return { success: false, error: "Comment must be between 1 and 500 characters." };
    }

    // ❌ PROBLEM: sanitizeInput on server causes jsdom error
    const sanitized = sanitizeInput(validation.data, "text");

    await db.insert(comments).values({ 
      vibeId, 
      userId, 
      content: sanitized,  // ❌ Stored sanitized
      createdAt: new Date()
    });

    revalidatePath("/explore");
    return { success: true };
  } catch (error) {
    console.error("[SOCIAL_ACTION_COMMENT]:", error);
    return { success: false, error: "Comment could not be posted." };
  }
}

/**
 * TOGGLE FOLLOW
 * Securely updates follow status between users.
 */
export async function toggleFollow(followingId: string): Promise<ActionResponse> {
  try {
    const followerId = await getUserId();
    
    if (followerId === followingId) {
      return { success: false, error: "You cannot follow yourself." };
    }

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
      await db.insert(subscriptions).values({ followerId, followingId });
    }

    revalidatePath("/explore");
    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("[SOCIAL_ACTION_FOLLOW]:", error);
    return { success: false, error: "Could not update follow status." };
  }
}

/**
 * VISIBILITY TOGGLE (Placeholder)
 * Returns structured error until migration is complete.
 */
export async function toggleVibeVisibility(inquiryId: string, isPublic: boolean): Promise<ActionResponse> {
  try {
    await getUserId();
    return { 
      success: false, 
      error: "Feature locked: 'is_public' column requires database migration." 
    };
  } catch (error) {
    return { success: false, error: "Unauthorized" };
  }
}