"use server"; // 👈 This is the magic line for Server Actions

import axios from "axios";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

export async function initiatePhonePePayment(amount: number, userId: string, planId: string) {
  try {
    const transactionId = "MT" + uuidv4().toString().slice(0, 15);
    const merchantId = process.env.PHONEPE_MERCHANT_ID;
    const saltKey = process.env.PHONEPE_SALT_KEY;
    const saltIndex = process.env.PHONEPE_SALT_INDEX;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    const data = {
      merchantId: merchantId,
      merchantTransactionId: transactionId,
      merchantUserId: userId,
      amount: amount * 100, // Convert to Paise
      redirectUrl: `${baseUrl}/api/payments/phonepe/callback?userId=${userId}&planId=${planId}`,
      redirectMode: "REDIRECT",
      paymentInstrument: { type: "PAY_PAGE" },
    };

    const payload = Buffer.from(JSON.stringify(data)).toString("base64");
    const stringToHash = payload + "/pg/v1/pay" + saltKey;
    const sha256 = crypto.createHash("sha256").update(stringToHash).digest("hex");
    const checksum = sha256 + "###" + saltIndex;

    const options = {
      method: "POST",
      url: "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
      },
      data: { request: payload },
    };

    const response = await axios.request(options);
    
    return { 
      url: response.data.data.instrumentResponse.redirectInfo.url,
      transactionId 
    };
  } catch (error: any) {
    console.error("PhonePe Error:", error.response?.data || error.message);
    return { error: "Failed to initiate payment" };
  }
}