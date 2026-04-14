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
  const session = await getServerSession(authOptions);
  
  // Guard clause: ensure user is authenticated
  if (!session?.user?.id) return null;

  try {
    const result = await db.query.tasks.findFirst({
      where: eq(tasks.inquiryId, inquiryId),
      orderBy: [desc(tasks.version)],
      with: {
        inquiry: true, 
      },
    });

    // Verify the record exists and belongs to the authenticated user
    if (!result || result.inquiry?.userId !== session.user.id) {
      return null;
    }

    // Return the result without referencing the non-existent isPublic column
    return {
      id: result.id,
      steps: result.steps, // Your Step[] array from JSONB
      emergentContent: result.emergentContent,
      version: result.version,
      createdAt: result.createdAt,
      // We hardcode this to false for now since the DB column doesn't exist
      isPublic: false, 
    };
  } catch (error) {
    console.error("Error in getVibeHistory:", error);
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