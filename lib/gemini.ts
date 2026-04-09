import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Updated schema to include emergentContent at the root level
const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    steps: {
      type: SchemaType.ARRAY,
      description: "A 7-step development roadmap.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          objective: {
            type: SchemaType.STRING,
            description: "The goal of this development phase.",
          },
          procedures: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "Step-by-step actions.",
          },
          precisePrompt: {
            type: SchemaType.STRING,
            description: "High-tech prompt for v0/Bolt to execute this step.",
          },
        },
        required: ["objective", "procedures", "precisePrompt"],
      },
    },
    emergentContent: {
      type: SchemaType.STRING,
      description: "A high-level architectural analysis, risk assessment, and technical advice for the project.",
    },
  },
  required: ["steps", "emergentContent"],
} as const;

export async function generateVibeWorkflow(userPrompt: string, retries = 3) {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: responseSchema as any, 
      temperature: 0.2, // Slightly increased for better 'emergent' creativity
    },
  });

  const systemInstruction = `
    You are a Senior Software Architect and Operations Strategist. 
    Transform the user idea into a dual-layered response:
    
    LAYER 1: The 7-Step "Vibe Coding" roadmap (Architecture, Auth, API, Layout, UI, Logic, Deploy).
    LAYER 2: Emergent Intelligence. Analyze the idea for hidden risks, scalability bottlenecks, 
    and architectural nuances that a junior dev might miss.

    STRICT: Return ONLY JSON. The steps array must contain EXACTLY 7 items.
  `;

  for (let i = 0; i < retries; i++) {
    try {
      const result = await model.generateContent([
        { text: systemInstruction },
        { text: `User Idea: ${userPrompt}` }
      ]);

      const responseText = result.response.text();
      return JSON.parse(responseText);

    } catch (error: any) {
      // Handle the 503 error gracefully with a retry loop
      const is503 = error?.status === 503 || error?.message?.includes("503");
      
      if (is503 && i < retries - 1) {
  // Wait 2s, then 4s, then 8s...
  const waitTime = Math.pow(2, i + 1) * 1000; 
  console.warn(`Gemini 503 - Attempt ${i + 1}. Retrying in ${waitTime/1000}s...`);
  await new Promise(resolve => setTimeout(resolve, waitTime));
  continue;
}

      console.error("AI Workflow Error:", error);
      throw new Error(is503 ? "Gemini is busy. Try again in 10 seconds." : "Failed to generate roadmap.");
    }
  }
}