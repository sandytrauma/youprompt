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
 * Refactored to remove db.transaction for Neon HTTP compatibility.
 */
export async function createNewVibe(prompt: string): Promise<ActionResponse> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // 1. AI Generation 
    const aiResponse = await generateVibeWorkflow(prompt);

    // 2. Create the Inquiry (Parent)
    const [newInquiry] = await db.insert(inquiries).values({
      userId: session.user.id,
      title: prompt.substring(0, 50) || "New Vibe",
    }).returning();

    if (!newInquiry) {
      throw new Error("Failed to create inquiry record.");
    }

    // 3. Create the first Task (Child V1)
    // We execute this sequentially since transactions aren't supported in neon-http
    await db.insert(tasks).values({
      inquiryId: newInquiry.id,
      versionName: "V1: Initial Vibe",
      steps: aiResponse.steps, 
      emergentContent: aiResponse.emergentContent, 
      version: 1,
    });

    revalidatePath("/playground");
    
    return { 
      success: true, 
      steps: aiResponse.steps, 
      emergentContent: aiResponse.emergentContent,
      inquiryId: newInquiry.id 
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
      emergentContent: aiResponse.emergentContent, 
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