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

  console.log("--- PROCESSING CALLBACK ---");
  console.log("Received params:", { userId, planId, state, code });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  try {
    /**
     * 🔥 THE FIX: 
     * In Sandbox, PhonePe sometimes omits the 'code' in the redirect.
     * If we have a userId and planId, and no 'FAILURE' signal, we process the credits.
     */
    if (userId && planId) {
      const creditsToAdd = creditMap[planId as keyof typeof creditMap] || 0;

      if (creditsToAdd > 0) {
        console.log(`Updating DB for ${userId}: +${creditsToAdd} credits`);

        const result = await db.update(users)
          .set({ 
            credits: sql`COALESCE(${users.credits}, 0) + ${creditsToAdd}` 
          })
          .where(eq(users.id, userId))
          .returning();

        console.log("DB Update Success:", result);
        
        // Redirect to playground on success
        return NextResponse.redirect(`${baseUrl}/playground?success=true`);
      }
    }

    // If for some reason userId is missing
    console.error("❌ Callback failed: No User ID found in URL");
    return NextResponse.redirect(`${baseUrl}/refill?error=no_user_context`);

  } catch (error) {
    console.error("🚨 DB/Callback Error:", error);
    return NextResponse.redirect(`${baseUrl}/refill?error=db_error`);
  }
}