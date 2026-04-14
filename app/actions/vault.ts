"use server";

import { db } from "@/db";
import { documents } from "@/db/schema";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { and, desc, eq } from "drizzle-orm";


export async function saveToCodeVault(data: { 
  title: string; 
  content: string; 
  category?: "technical" | "branding" | "general"; 
}) {
  try {
    const session = await getServerSession(authOptions);

    // Guard: Ensure user is authenticated
    if (!session?.user?.id) {
      console.error("[VAULT] Error: No valid session found.");
      return { success: false, error: "Unauthorized" };
    }

    // Strict Schema Insertion
    const result = await db.insert(documents).values({
      userId: session.user.id, // Must be valid UUID
      title: data.title,       // .notNull()
      content: data.content,   // .notNull()
      category: data.category || "technical",
      isActive: true,
    }).returning();

    revalidatePath("/playground");
    
    return { 
      success: true, 
      id: result[0].id 
    };

  } catch (error: any) {
    console.error("[VAULT] Database Insertion Error:", error.message);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

export async function getCodeVaultDocs() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return [];
  }

  try {
    const data = await db
      .select({
        id: documents.id,
        title: documents.title,
        content: documents.content,
        category: documents.category,
      })
      .from(documents)
      .where(
        and(
          eq(documents.category, "technical")
          // If you have a userId column in documents, uncomment below:
          // , eq(documents.userId, session.user.id)
        )
      )
      .orderBy(desc(documents.id));

    return data;
  } catch (error) {
    console.error("RAG Fetch Error:", error);
    return [];
  }
}