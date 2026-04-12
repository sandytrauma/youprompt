import { NextResponse } from "next/server";
import { initiatePhonePePayment } from "@/app/actions/payments";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, userId, planId } = body;

    const result = await initiatePhonePePayment(amount, userId, planId);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 500 });
  }
}