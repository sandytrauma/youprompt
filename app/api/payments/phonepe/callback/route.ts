import { NextResponse } from "next/server";
import { db } from "@/db"; 
import { users, transactions } from "@/db/schema"; 
import { eq, sql, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

// Matches your pricing.ts config
const creditMap: Record<string, { credits: number; price: number }> = {
  basic: { credits: 50, price: 599 },
  pro: { credits: 200, price: 1999 },
  elite: { credits: 1000, price: 6999 },
};

export async function POST(req: Request) {
  console.log("--- ⚡ PHONEPE SECURE CALLBACK START ⚡ ---");
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://youprompt.vercel.app";

  try {
    // 1. PHONEPE VERIFICATION (CRITICAL FOR SECURITY)
    const formData = await req.formData();
    const encodedResponse = formData.get("response") as string;

    if (!encodedResponse) {
      console.error("❌ ERROR: No response payload from PhonePe");
      return NextResponse.json({ error: "Missing payload" }, { status: 400 });
    }

    // Decode PhonePe response (Base64)
    const decodedJson = JSON.parse(Buffer.from(encodedResponse, 'base64').toString('utf-8'));
    const { success, code, data } = decodedJson;
    const { merchantTransactionId, amount, userId } = data; // userId must be passed in merchantContext

    // 2. IDEMPOTENCY CHECK (Issue #4 in Vulnerability Doc)
    // Check if this transaction ID has already been marked 'COMPLETED'
    const existingTx = await db.query.transactions.findFirst({
      where: eq(transactions.id, merchantTransactionId),
    });

    if (existingTx?.status === "COMPLETED") {
      console.warn("⚠️ IDEMPOTENCY: Transaction already processed:", merchantTransactionId);
      return NextResponse.json({ status: "ALREADY_PROCESSED" });
    }

    // 3. VALIDATION
    if (success && code === "PAYMENT_SUCCESS") {
      // Find the plan based on the amount paid (Safety check)
      const planEntry = Object.entries(creditMap).find(([_, val]) => val.price === amount / 100);
      const creditsToAdd = planEntry ? planEntry[1].credits : 0;

      if (creditsToAdd === 0) {
        console.error("❌ ERROR: Payment amount does not match any plan:", amount);
        return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
      }

      // 4. ATOMIC TRANSACTION (DB Integrity)
      // We wrap the credit addition and status update in a single transaction
      await db.transaction(async (tx) => {
        // Update user credits
        const userUpdate = await tx.update(users)
          .set({ 
            credits: sql`COALESCE(${users.credits}, 0) + ${creditsToAdd}` 
          })
          .where(eq(users.id, userId))
          .returning();

        if (userUpdate.length === 0) {
          throw new Error(`User ${userId} not found during credit update`);
        }

        // Update transaction record to COMPLETED
        // If your initiate action hasn't created this record yet, we use upsert logic
        await tx.insert(transactions)
          .values({
            id: merchantTransactionId,
            userId: userId,
            amount: amount,
            creditsAdded: creditsToAdd,
            status: "COMPLETED",
          })
          .onConflictDoUpdate({
            target: transactions.id,
            set: { status: "COMPLETED" },
          });
      });

      console.log(`✅ SUCCESS: Credited ${creditsToAdd} to User ${userId}`);

      // 5. CACHE REVALIDATION
      revalidatePath("/playground");
      revalidatePath("/refill");
      revalidatePath("/", "layout");

      return NextResponse.json({ status: "SUCCESS" });
    } else {
      // Mark transaction as FAILED in DB
      await db.update(transactions)
        .set({ status: "FAILED" })
        .where(eq(transactions.id, merchantTransactionId));
        
      console.error("❌ PAYMENT FAILED:", code);
      return NextResponse.json({ status: "FAILED", code });
    }

  } catch (error) {
    console.error("🚨 CRITICAL SYSTEM ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * GET Handler for User Redirect (The 'UI' callback)
 * This doesn't update the DB; it just shows the success/error page to the user.
 * Real credit logic stays in the POST (Webhook) above.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://youprompt.vercel.app";
  
  const status = searchParams.get("code");
  
  if (status === "PAYMENT_SUCCESS") {
    return NextResponse.redirect(`${baseUrl}/playground?success=true`);
  }
  
  return NextResponse.redirect(`${baseUrl}/refill?error=payment_failed`);
}