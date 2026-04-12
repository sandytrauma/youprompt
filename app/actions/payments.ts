"use server";

const BASE_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox";

/**
 * Helper to get the OAuth2 Token for V2 APIs
 */
async function getAuthToken() {
  const clientId = process.env.PHONEPE_CLIENT_ID;
  const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.error("❌ PHONEPE_CLIENT_ID or SECRET missing in .env");
    return null;
  }

  try {
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const response = await fetch(`${BASE_URL}/v1/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${authHeader}`,
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        client_version: "1"
      }).toString(),
    });

    const data = await response.json();
    return data.access_token || null;
  } catch (err) {
    console.error("🚨 Token generation error:", err);
    return null;
  }
}

/**
 * Initiates the PhonePe Standard Checkout V2 Flow
 */
export async function initiatePhonePePayment(amount: number, userId: string, planId: string) {
  try {
    const token = await getAuthToken();
    if (!token) return { error: "Authentication failed. Check server logs." };

    const merchantId = process.env.PHONEPE_MERCHANT_ID || "PGTESTPAYUAT";
    const rawBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const baseUrl = rawBaseUrl.replace(/\/+$/, ""); 
    
    // Alphanumeric Transaction ID
    const transactionId = `T${Date.now()}`;

    const payload = {
      merchantId: merchantId,
      merchantOrderId: transactionId,
      amount: Math.floor(amount * 100), // Amount in Paise (no decimals)
      expireAfter: 900, // 15 minutes
      paymentFlow: {
        type: "PG_CHECKOUT",
        merchantUrls: {
         redirectUrl: `${baseUrl}/api/payments/phonepe/callback?userId=${userId}&planId=${planId}`,
  redirectMode: "REDIRECT",
  callbackUrl: `${baseUrl}/api/payments/phonepe/webhook`
        }
      }
    };

    const response = await fetch(`${BASE_URL}/checkout/v2/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `O-Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    // 💡 V2 Sandbox Success Check: Look for redirectUrl and PENDING state
    if (result.redirectUrl) {
      return { url: result.redirectUrl };
    } else {
      console.error("❌ PHONEPE REJECTION:", JSON.stringify(result, null, 2));
      return { 
        error: result.message || "UAT Initialization failed.",
        code: result.code 
      };
    }
  } catch (error: any) {
    console.error("🚨 CRITICAL ACTION ERROR:", error);
    return { error: "Internal server error." };
  }
}