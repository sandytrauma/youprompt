import { NextResponse } from "next/server";
import { db } from "@/db"; 
import { users } from "@/db/schema"; 
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Define the credit logic strictly to match your frontend bundles
const creditMap: Record<string, number> = {
  basic: 50,
  pro: 200,
  elite: 1000,
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  
  // Extract parameters passed from the initiatePhonePePayment action
  const userId = searchParams.get("userId");
  const planId = searchParams.get("planId");
  const state = searchParams.get("state"); 
  const code = searchParams.get("code");

  console.log("--- ⚡ PHONEPE CALLBACK PROCESSING ⚡ ---");
  console.log("Incoming Params:", { userId, planId, state, code });

  // Ensure this matches your Vercel production domain
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://youprompt.vercel.app";

  try {
    // 1. DATA VALIDATION
    // Check for valid UUID format (8-4-4-4-12 hex characters)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!userId || !uuidRegex.test(userId)) {
      console.error("❌ CALLBACK ERROR: Invalid or Missing UUID:", userId);
      return NextResponse.redirect(`${baseUrl}/refill?error=invalid_user_context`);
    }

    if (!planId || !creditMap[planId]) {
      console.error("❌ CALLBACK ERROR: Invalid Plan ID:", planId);
      return NextResponse.redirect(`${baseUrl}/refill?error=invalid_plan`);
    }

    const creditsToAdd = creditMap[planId as keyof typeof creditMap];

    // 2. DATABASE UPDATE
    console.log(`🛠️ UPDATING DB: User ${userId} | Adding +${creditsToAdd} credits`);

    const result = await db.update(users)
      .set({ 
        // sql`COALESCE` handles NULL credit values by defaulting them to 0 before adding
        credits: sql`COALESCE(${users.credits}, 0) + ${creditsToAdd}` 
      })
      .where(eq(users.id, userId))
      .returning({ updatedId: users.id, newTotal: users.credits });

    // 3. VERIFICATION & CACHE CLEARING
    if (result.length === 0) {
      console.error(`❌ DB UPDATE FAILED: No user record found for ID ${userId}`);
      return NextResponse.redirect(`${baseUrl}/refill?error=user_not_found_in_db`);
    }

    console.log("✅ DB UPDATE SUCCESS:", result[0]);

    /**
     * 🔥 THE FIX FOR STALE DATA:
     * We must tell Next.js to purge the cache for the playground and refill pages
     * so the user sees their new credit balance immediately.
     */
    revalidatePath("/playground");
    revalidatePath("/refill");
    revalidatePath("/", "layout"); // Clears layout cache (where headers usually sit)

    // 4. FINAL REDIRECT
    return NextResponse.redirect(`${baseUrl}/playground?success=true`);

  } catch (error) {
    console.error("🚨 CRITICAL CALLBACK EXCEPTION:", error);
    
    if (error instanceof Error) {
      console.error("Trace:", error.message);
    }
    
    return NextResponse.redirect(`${baseUrl}/refill?error=db_error`);
  }
}