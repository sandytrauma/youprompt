import { NextResponse } from "next/server";
import { db } from "@/db"; 
import { users } from "@/db/schema"; 
import { eq, sql } from "drizzle-orm";

const creditMap: Record<string, number> = {
  basic: 50,
  pro: 200,
  elite: 1000,
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  
  const userId = searchParams.get("userId");
  const planId = searchParams.get("planId");
  const state = searchParams.get("state"); 
  const code = searchParams.get("code");

  // This log is vital for Vercel debugging
  console.log("--- PHONEPE CALLBACK START ---");
  console.log("Params:", { userId, planId, state, code });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://youprompt.vercel.app";

  try {
    // 1. Validation: Ensure we have a userId and it's a valid UUID format
    // If NextAuth is using UUIDs, the ID must be a valid 36-character string
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!userId || !uuidRegex.test(userId)) {
      console.error("❌ Callback failed: Invalid or Missing UUID:", userId);
      return NextResponse.redirect(`${baseUrl}/refill?error=invalid_user_context`);
    }

    if (!planId || !creditMap[planId]) {
      console.error("❌ Callback failed: Invalid Plan ID:", planId);
      return NextResponse.redirect(`${baseUrl}/refill?error=invalid_plan`);
    }

    const creditsToAdd = creditMap[planId as keyof typeof creditMap];

    // 2. Perform the update
    console.log(`Attempting DB Update: User ${userId} | Adding ${creditsToAdd} credits`);

    const result = await db.update(users)
      .set({ 
        // Using COALESCE handles cases where credits might be NULL in the DB
        credits: sql`COALESCE(${users.credits}, 0) + ${creditsToAdd}` 
      })
      .where(eq(users.id, userId))
      .returning({ updatedId: users.id });

    // 3. Verification
    if (result.length === 0) {
      /**
       * 🚨 IF YOU HIT THIS LOG:
       * It means the userId exists in the URL but DOES NOT exist in the 
       * 'users' table in your Production database.
       */
      console.error(`❌ DB Update Failed: No user found with ID ${userId}`);
      return NextResponse.redirect(`${baseUrl}/refill?error=user_not_found_in_db`);
    }

    console.log("✅ DB Update Success. Record:", result[0]);
    
    // Final Success Redirect
    return NextResponse.redirect(`${baseUrl}/playground?success=true`);

  } catch (error) {
    console.error("🚨 CRITICAL CALLBACK ERROR:", error);
    // Log the full error to Vercel logs
    if (error instanceof Error) {
      console.error("Error Message:", error.message);
    }
    return NextResponse.redirect(`${baseUrl}/refill?error=db_error`);
  }
}