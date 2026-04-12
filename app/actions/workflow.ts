"use server";

import { db } from "@/db";
import { inquiries, tasks, users } from "@/db/schema";
import { generateVibeWorkflow } from "@/lib/gemini";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { desc, eq, sql } from "drizzle-orm";

// 1 Credit per generation/edit
const VIBE_COST = 1;

type ActionResponse = {
  success: boolean;
  steps?: any[];
  inquiryId?: string;
  version?: number;
  error?: string;
  emergentContent?: string;
};

/**
 * 1. Fetch all historical "Vibes" for the current logged-in user.
 */
export async function getAllUserInquiries() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return [];
  }

  try {
    return await db
      .select({
        id: inquiries.id,
        title: inquiries.title,
        createdAt: inquiries.createdAt,
      })
      .from(inquiries)
      .where(eq(inquiries.userId, session.user.id))
      .orderBy(desc(inquiries.createdAt));
  } catch (error) {
    console.error("Failed to fetch user history:", error);
    return [];
  }
}

/**
 * 2. Generate a brand new Vibe (Inquiry + Task V1).
 * Production Ready: Includes Credit Checks & Deductions
 */
export async function createNewVibe(prompt: string): Promise<ActionResponse> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required." };
  }

  try {
    // A. Credit Check
    const [userRecord] = await db
      .select({ credits: users.credits })
      .from(users)
      .where(eq(users.id, session.user.id));

    if (!userRecord || (userRecord.credits ?? 0) < VIBE_COST) {
      return { 
        success: false, 
        error: "Insufficient Vibes! Please refill your credits in the dashboard." 
      };
    }

    // B. AI Generation (Call this before DB changes to avoid charging for failed AI)
    const aiResponse = await generateVibeWorkflow(prompt);

    // C. Create the Inquiry (Parent)
    const [newInquiry] = await db.insert(inquiries).values({
      userId: session.user.id,
      title: prompt.substring(0, 50) || "New Vibe",
    }).returning();

    if (!newInquiry) {
      throw new Error("Critical: Failed to create inquiry record.");
    }

    // D. Create the first Task (Child V1)
    await db.insert(tasks).values({
      inquiryId: newInquiry.id,
      versionName: "V1: Initial Vibe",
      steps: aiResponse.steps, 
      emergentContent: aiResponse.emergentContent, 
      version: 1,
    });

    // E. Deduct Credits
    await db
      .update(users)
      .set({
        credits: sql`${users.credits} - ${VIBE_COST}`
      })
      .where(eq(users.id, session.user.id));

    revalidatePath("/playground");
    revalidatePath("/admin"); // Update admin dashboard stats
    
    return { 
      success: true, 
      steps: aiResponse.steps, 
      emergentContent: aiResponse.emergentContent,
      inquiryId: newInquiry.id 
    };

  } catch (error) {
    console.error("Vibe Generation Error:", error);
    return { 
      success: false, 
      error: "The AI encountered an error while architecting your vibe. Try again." 
    };
  }
}

/**
 * 3. Fetch the results for a specific history item from the DB.
 */
export async function getVibeHistory(inquiryId: string) {
  if (!inquiryId) return null;

  try {
    const data = await db.query.tasks.findFirst({
      where: eq(tasks.inquiryId, inquiryId),
      orderBy: [desc(tasks.version)],
    });
    
    return data || null;
  } catch (error) {
    console.error("Failed to fetch specific vibe history:", error);
    return null;
  }
}

/**
 * 4. Edit an existing Vibe and save it as a new version.
 * Production Ready: Credits applied for iterations.
 */
export async function updateVibeVersion(
  id: string, 
  prompt: string, 
  version: number
): Promise<ActionResponse> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // A. Credit Check
    const [userRecord] = await db
      .select({ credits: users.credits })
      .from(users)
      .where(eq(users.id, session.user.id));

    if (!userRecord || (userRecord.credits ?? 0) < VIBE_COST) {
      return { success: false, error: "Insufficient credits for an update." };
    }

    // B. AI Generation for the update
    const aiResponse = await generateVibeWorkflow(prompt);
    
    // C. Insert new version
    const [newTask] = await db.insert(tasks).values({
      inquiryId: id,
      versionName: `V${version + 1}: Edited Vibe`,
      steps: aiResponse.steps,
      emergentContent: aiResponse.emergentContent, 
      version: version + 1,
    }).returning();

    // D. Deduct Credits
    await db
      .update(users)
      .set({
        credits: sql`${users.credits} - ${VIBE_COST}`
      })
      .where(eq(users.id, session.user.id));
    
    revalidatePath("/playground");
    
    return { 
      success: true, 
      steps: aiResponse.steps, 
      emergentContent: aiResponse.emergentContent,
      version: newTask.version ?? (version + 1)
    };
  } catch (error) {
    console.error("Update Version Error:", error);
    return { 
      success: false, 
      error: "Failed to update version." 
    };
  }
}