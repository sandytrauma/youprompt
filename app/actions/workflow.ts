"use server";

import { db } from "@/db";
import { inquiries, tasks } from "@/db/schema";
import { generateVibeWorkflow } from "@/lib/gemini";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";

type ActionResponse = {
  success: boolean;
  steps?: any[];
  inquiryId?: string;
  version?: number;
  error?: string;
  emergentContent?: string; // Correctly included in the type
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
 */
export async function createNewVibe(prompt: string): Promise<ActionResponse> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // 1. AI Generation 
    // Note: Ensure your generateVibeWorkflow returns { steps, emergentContent }
    const aiResponse = await generateVibeWorkflow(prompt);

    // 2. Database Transaction
    const result = await db.transaction(async (tx) => {
      // Create the Inquiry
      const [newInquiry] = await tx.insert(inquiries).values({
        userId: session.user.id,
        title: prompt.substring(0, 50) || "New Vibe",
      }).returning();

      // Create the first Task (V1)
      await tx.insert(tasks).values({
        inquiryId: newInquiry.id,
        versionName: "V1: Initial Vibe",
        steps: aiResponse.steps, // Extracting steps from AI response
        emergentContent: aiResponse.emergentContent, // Saving emergent analysis
        version: 1,
      });

      return {
        id: newInquiry.id,
        steps: aiResponse.steps,
        emergent: aiResponse.emergentContent
      };
    });

    revalidatePath("/playground");
    
    return { 
      success: true, 
      steps: result.steps, 
      emergentContent: result.emergent,
      inquiryId: result.id 
    };
  } catch (error) {
    console.error("Vibe Generation Error:", error);
    return { success: false, error: "AI failed to generate workflow. Please try a different prompt." };
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
    
    // This returns the full task object, which includes 'emergentContent'
    return data || null;
  } catch (error) {
    console.error("Failed to fetch specific vibe history:", error);
    return null;
  }
}

/**
 * 4. Edit an existing Vibe and save it as a new version.
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
    // 1. AI Generation for the update
    const aiResponse = await generateVibeWorkflow(prompt);
    
    // 2. Insert new version
    const [newTask] = await db.insert(tasks).values({
      inquiryId: id,
      versionName: `V${version + 1}: Edited Vibe`,
      steps: aiResponse.steps,
      emergentContent: aiResponse.emergentContent, // Update the analysis for the new version
      version: version + 1,
    }).returning();
    
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