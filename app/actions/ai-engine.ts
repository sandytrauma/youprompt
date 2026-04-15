/**
 * Copyright 2026 Sandeep Kumar
 * YouPrompt AI Engine v3.4 - Production Hardened
 */

"use server";

import { db } from "@/db";
import { aiUsage, users } from "@/db/schema";
import { genAI, groq, tokenRateLimiter } from "@/lib/gemini";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eq, sql, and, gt } from "drizzle-orm";
import { z } from "zod";

// --- VALIDATION ---
const RoadmapStepSchema = z.object({
  objective: z.string().min(1),
  procedures: z.array(z.string()).min(1),
  precisePrompt: z.string().min(1),
});

const WorkflowResponseSchema = z.object({
  steps: z.array(RoadmapStepSchema).min(1),
  emergentContent: z.string(),
});

const SYSTEM_INSTRUCTION = `
 SYSTEM_PROTOCOL: SENIOR_SOFTWARE_ARCHITECT_ENGINE
MODE: STRICT_JSON_OUTPUT_ONLY

[DOMAIN_CONTEXT]
The user is a full-stack expert specializing in Next.js, TypeScript, Tailwind, and Drizzle ORM. Every response must prioritize high-performance, modularity, and type-safety.

[OUTPUT_SCHEMA]
{
  "steps": [
    {
      "objective": "High-level goal of this architectural phase.",
      "procedures": [
        "Granular, technical execution task 1",
        "Granular, technical execution task 2",
        "Granular, technical execution task 3"
      ],
      "precisePrompt": "A single, highly detailed LLM-ready prompt to generate the actual code for this step."
    }
  ],
  "emergentContent": "A recursive summary identifying potential technical debt, state management strategies, and security considerations."
}

[STRICTURES]
1. COUNT: Exactly 7 sequential steps.
2. FORMAT: Pure JSON. No backticks. No prose. No "Here is your JSON."
3. LOGIC: Step N must provide the foundation for Step N+1.
4. DETAIL: 'precisePrompt' must include specific imports, variable names, and patterns (e.g., 'Use Zod for validation', 'Implement Neon-HTTP sequential persistence').
`;

function cleanAndParseJSON(raw: string) {
  try {
    const clean = raw.replace(/```json|```/g, "").trim();
    return WorkflowResponseSchema.parse(JSON.parse(clean));
  } catch (e) {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try { return WorkflowResponseSchema.parse(JSON.parse(match[0])); } catch { return null; }
    }
    return null;
  }
}

export async function generateVibeWorkflow(augmentedPrompt: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized Access.");

  let finalData: any = null;
  let providerInfo = { provider: "recovery", model: "internal", tokens: 0 };

  try {
    try {
      // PRIMARY: GEMINI
      const modelName = "gemini-2.5-flash";
      const model = genAI.getGenerativeModel({ model: modelName, generationConfig: { responseMimeType: "application/json" } });
      const result = await Promise.race([
        model.generateContent([{ text: SYSTEM_INSTRUCTION }, { text: augmentedPrompt }]),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 12000))
      ]) as any;
      
      finalData = cleanAndParseJSON(await result.response.text());
      providerInfo = { provider: "gemini", model: modelName, tokens: result.response.usageMetadata?.totalTokenCount || 0 };
    } catch (geminiError) {
      // FAILOVER: GROQ
      const modelName = "llama-3.3-70b-versatile";
      const groqRes = await groq.chat.completions.create({
        model: modelName,
        messages: [{ role: "system", content: SYSTEM_INSTRUCTION }, { role: "user", content: augmentedPrompt }],
        temperature: 0.1,
        response_format: { type: "json_object" },
        stream: false 
      });
      finalData = cleanAndParseJSON(groqRes.choices[0]?.message?.content || "{}");
      providerInfo = { provider: "groq", model: modelName, tokens: groqRes.usage?.total_tokens || 0 };
    }
  } catch (critical) { console.error("AI Blackout:", critical); }

  // RECOVERY
  if (!finalData) {
    finalData = {
      steps: [{ objective: "Architecture Baseline", procedures: ["Analyze logic"], precisePrompt: "Generate foundation." }],
      emergentContent: "Recovery logic synthesized."
    };
  }

  // LOG USAGE (Non-blocking)
  try {
    await db.insert(aiUsage).values({
      userId: session.user.id,
      provider: providerInfo.provider,
      model: providerInfo.model,
      totalTokens: providerInfo.tokens,
    });
  } catch (e) { console.error("Log failed"); }

  return finalData;
}