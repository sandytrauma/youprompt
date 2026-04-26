/**
 * Copyright 2026 Sandeep Kumar
 * YouPrompt Workflow Engine v3.4 - Production Hardened
 */

"use server";

import { db } from "@/db";
import { documents, inquiries, tasks, users, vibes } from "@/db/schema";
import { generateVibeWorkflow } from "./ai-engine"; 
import { authOptions } from "@/lib/auth"; 
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { desc, eq, and, sql, gt } from "drizzle-orm";
import { isSuspiciousContent } from "@/lib/sanitizer";


// --- TYPE DEFINITIONS ---
export type Step = {
  objective: string;
  procedures: string[];
  precisePrompt: string;
  id?: number;
};

export type ActionResponse = {
  success: boolean;
  steps?: Step[];
  inquiryId?: string;
  version?: number;
  error?: string;
  emergentContent?: string;
  newCreditBalance?: number;
};

const VIBE_COST = 1;

/**
 * 1. RAG: TECHNICAL CONTEXT RETRIEVAL
 */
export async function getRelevantContext(userId: string) {
  try {
    const relatedDocs = await db.query.documents.findMany({
      where: and(
        eq(documents.userId, userId),
        eq(documents.category, "technical")
      ),
      limit: 3,
    });

    return relatedDocs.length > 0
      ? relatedDocs.map((d) => d.content).join("\n\n")
      : "";
  } catch (error) {
    console.error("[WORKFLOW] Context Fetch Error:", error);
    return "";
  }
}

/**
 * 2. FETCH USER HISTORY
 */
export async function getAllUserInquiries() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  try {
    return await db
      .select({
        id: inquiries.id,
        title: inquiries.title,
        createdAt: inquiries.createdAt,
      })
      .from(inquiries)
      .where(eq(inquiries.userId, session.user.id))
      .orderBy(desc(inquiries.createdAt))
      .limit(50);
  } catch (error) {
    console.error("Failed to fetch user history:", error);
    return [];
  }
}

/**
 * 3. CREATE NEW VIBE
 */
export async function createNewVibe(prompt: string): Promise<ActionResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Authentication required." };

  // Validate input length and suspicious patterns
  if (!prompt || prompt.length > 5000) {
    return { success: false, error: "Prompt too long or empty" };
  }

  if (isSuspiciousContent(prompt)) {
    return { success: false, error: "Prompt contains invalid characters" };
  }

  try {
    const context = await getRelevantContext(session.user.id);
    const augmentedPrompt = context 
      ? `CONTEXT:\n${context}\n\nUSER_REQUEST:\n${prompt}`  // ✅ Use raw prompt
      : prompt;

    const aiResponse = await generateVibeWorkflow(augmentedPrompt);

    const [updatedUser] = await db
      .update(users)
      .set({ credits: sql`${users.credits} - ${VIBE_COST}` })
      .where(and(eq(users.id, session.user.id), gt(users.credits, 0)))
      .returning({ credits: users.credits });

    if (!updatedUser) {
      return { success: false, error: "Insufficient Credits." };
    }

    const [newInquiry] = await db.insert(inquiries).values({
      userId: session.user.id,
      title: prompt.substring(0, 50) || "New Vibe",
    }).returning();

    await db.insert(tasks).values({
      inquiryId: newInquiry.id,
      versionName: "V1: Initial Synthesis",
      steps: aiResponse.steps, 
      emergentContent: aiResponse.emergentContent, 
      version: 1,
    });

    revalidatePath("/playground");
    
    return { 
      success: true, 
      steps: aiResponse.steps as Step[], 
      emergentContent: aiResponse.emergentContent,
      inquiryId: newInquiry.id,
      newCreditBalance: updatedUser.credits ?? 0,
      version: 1
    };
  } catch (error: any) {
    console.error("Vibe Generation Error:", error);
    return { success: false, error: "Synthesis failed. Please try again." };
  }
}

/**
 * 4. FETCH VIBE HISTORY
 */
export async function getVibeHistory(inquiryId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  try {
    const result = await db.query.tasks.findFirst({
      where: eq(tasks.inquiryId, inquiryId),
      orderBy: [desc(tasks.version)],
      with: { inquiry: true },
    });

    if (!result || !result.inquiry || result.inquiry.userId !== session.user.id) {
      return null;
    }

    return {
      id: result.id,
      steps: (result.steps as Step[]) || [], 
      emergentContent: result.emergentContent,
      version: result.version,
      createdAt: result.createdAt,
    };
  } catch (error) {
    console.error("Error in getVibeHistory:", error);
    return null;
  }
}

/**
 * 5. PUBLIC VIBE RETRIEVAL
 */
export async function getPublicVibe(id: string) {
  try {
    const vibeResult = await db.query.vibes.findFirst({
      where: eq(vibes.id, id),
    });

    if (vibeResult) {
      return {
        id: vibeResult.id,
        title: vibeResult.title,
        steps: vibeResult.steps,
        createdAt: vibeResult.createdAt,
        type: 'vibe'
      };
    }
    return null;
  } catch (error) {
    console.error("Error in getPublicVibe:", error);
    return null;
  }
}

/**
 * 6. UPDATE VIBE VERSION
 */
export async function updateVibeVersion(
  id: string, 
  prompt: string, 
  version: number
): Promise<ActionResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    const context = await getRelevantContext(session.user.id);
    const aiResponse = await generateVibeWorkflow(`${context}\n\n${prompt}`);
    
    const [updatedUser] = await db
      .update(users)
      .set({ credits: sql`${users.credits} - ${VIBE_COST}` })
      .where(and(eq(users.id, session.user.id), gt(users.credits, 0)))
      .returning({ credits: users.credits });

    if (!updatedUser) {
      return { success: false, error: "Insufficient credits." };
    }

    const [newTask] = await db.insert(tasks).values({
      inquiryId: id,
      versionName: `V${version + 1}: Edited Vibe`,
      steps: aiResponse.steps,
      emergentContent: aiResponse.emergentContent, 
      version: version + 1,
    }).returning();

    revalidatePath("/playground");
    
    return { 
      success: true, 
      steps: aiResponse.steps as Step[], 
      emergentContent: aiResponse.emergentContent,
      version: newTask.version ?? (version + 1),
      newCreditBalance: updatedUser.credits ?? 0
    };
  } catch (error) {
    console.error("Update Version Error:", error);
    return { success: false, error: "Failed to update version." };
  }
}

/**
 * 7. TOGGLE VIBE PUBLIC STATUS
 */
export async function toggleVibePublic(inquiryId: string, isPublic: boolean) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    if (isPublic) {
      const latestTask = await db.query.tasks.findFirst({
        where: eq(tasks.inquiryId, inquiryId),
        orderBy: [desc(tasks.version)],
        with: { inquiry: true }
      });

      if (!latestTask || !latestTask.inquiry || latestTask.inquiry.userId !== session.user.id) {
        return { success: false, error: "Vibe details not found or unauthorized." };
      }

      await db.insert(vibes).values({
        id: inquiryId,
        creatorId: session.user.id,
        title: latestTask.inquiry.title || "Untitled Vibe", 
        prompt: latestTask.inquiry.title || "User Prompt", 
        steps: latestTask.steps,
      }).onConflictDoUpdate({
        target: vibes.id,
        set: { 
          steps: latestTask.steps, 
          title: latestTask.inquiry.title || "Untitled Vibe",
          prompt: latestTask.inquiry.title || "User Prompt",
        }
      });

    } else {
      await db.delete(vibes).where(and(
        eq(vibes.id, inquiryId),
        eq(vibes.creatorId, session.user.id)
      ));
    }

    revalidatePath("/explore");
    revalidatePath("/playground");
    return { success: true };
  } catch (error) {
    console.error("Toggle Public Error:", error);
    return { success: false, error: "Failed to update status." };
  }
}