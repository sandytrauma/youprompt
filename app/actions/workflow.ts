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
import { documents, inquiries, tasks, users } from "@/db/schema";
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
  newCreditBalance?: number; // Added to help UI sync
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
    const [updatedUser] = await db
      .update(users)
      .set({
        credits: sql`${users.credits} - ${VIBE_COST}`
      })
      .where(eq(users.id, session.user.id))
      .returning({ credits: users.credits });

    revalidatePath("/playground");
    revalidatePath("/admin"); 
    
    return { 
      success: true, 
      steps: aiResponse.steps, 
      emergentContent: aiResponse.emergentContent,
      inquiryId: newInquiry.id,
      newCreditBalance: updatedUser.credits ?? 0
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
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) return null;

  try {
    const result = await db.query.tasks.findFirst({
      where: eq(tasks.inquiryId, inquiryId),
      orderBy: [desc(tasks.version)],
      with: {
        inquiry: true, 
      },
    });

    if (!result || result.inquiry?.userId !== session.user.id) {
      return null;
    }

    return {
      id: result.id,
      steps: result.steps, 
      emergentContent: result.emergentContent,
      version: result.version,
      createdAt: result.createdAt,
      isPublic: false, 
    };
  } catch (error) {
    console.error("Error in getVibeHistory:", error);
    return null;
  }
}

export async function getPublicVibe(inquiryId: string) {
  try {
    const result = await db.query.tasks.findFirst({
      where: eq(tasks.inquiryId, inquiryId),
      orderBy: [desc(tasks.version)],
      with: {
        inquiry: true, 
      },
    });

    // 1. Check if the task exists
    // 2. Check if the linked inquiry exists to satisfy the "possibly null" error
    if (!result || !result.inquiry) {
      return null;
    }

    return {
      id: result.id,
      title: result.inquiry.title, // TypeScript is now happy because we checked it above
      steps: result.steps, 
      emergentContent: result.emergentContent,
      version: result.version,
      createdAt: result.createdAt,
    };
  } catch (error) {
    console.error("Error in getPublicVibe:", error);
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
    const [updatedUser] = await db
      .update(users)
      .set({
        credits: sql`${users.credits} - ${VIBE_COST}`
      })
      .where(eq(users.id, session.user.id))
      .returning({ credits: users.credits });
    
    revalidatePath("/playground");
    
    return { 
      success: true, 
      steps: aiResponse.steps, 
      emergentContent: aiResponse.emergentContent,
      version: newTask.version ?? (version + 1),
      newCreditBalance: updatedUser.credits ?? 0
    };
  } catch (error) {
    console.error("Update Version Error:", error);
    return { 
      success: false, 
      error: "Failed to update version." 
    };
  }
}

// Example Logic for retrieval
async function getRelevantContext(userInput: string) {
  // Search the 'documents' table where category = 'technical'
  // and content matches keywords from userInput
  const relatedDocs = await db.select()
    .from(documents)
    .where(eq(documents.category, 'technical'))
    .limit(3); 
    
  return relatedDocs.map(d => d.content).join("\n\n");
}