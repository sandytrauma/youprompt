import { GoogleGenerativeAI, SchemaType, HarmCategory, 
  HarmBlockThreshold } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Structured Schema for consistent JSON output
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
            description: "The goal of this development phase (e.g., Auth Setup).",
          },
          procedures: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "Step-by-step technical actions.",
          },
          precisePrompt: {
            type: SchemaType.STRING,
            description: "A high-density prompt optimized for v0/Bolt.new to execute this specific step.",
          },
        },
        required: ["objective", "procedures", "precisePrompt"],
      },
    },
    emergentContent: {
      type: SchemaType.STRING,
      description: "Deep architectural analysis, risk assessment, and scalability advice.",
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
    temperature: 0.2,
    topP: 0.95,
  },
    // Prevent AI from being "too safe" and refusing to generate code logic
   safetySettings: [
    { 
      category: HarmCategory.HARM_CATEGORY_HARASSMENT, 
      threshold: HarmBlockThreshold.BLOCK_NONE 
    },
    { 
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, 
      threshold: HarmBlockThreshold.BLOCK_NONE 
    },
    { 
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, 
      threshold: HarmBlockThreshold.BLOCK_NONE 
    },
    { 
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, 
      threshold: HarmBlockThreshold.BLOCK_NONE 
    },
  ],
  });

  const systemInstruction = `
    You are a Senior Software Architect and Vibe Coding Expert. 
    Your mission is to turn a vague user idea into a precise, 7-step executable roadmap.

    INSTRUCTIONS:
    1. LAYER 1 (Roadmap): Break the app into 7 logical stages: 
       - Architecture/Schema, Authentication, Core API logic, Layout/UI, Feature Logic, Optimization, and Deployment.
    2. LAYER 2 (Emergent Intelligence): Act as a 'Chief Technical Officer'. 
       Highlight technical debt, hidden edge cases (e.g., race conditions, state management pitfalls), 
       and cost-saving deployment strategies.
    3. PROMPTS: Each 'precisePrompt' MUST be formatted as a direct instruction to an AI coder like v0 or Bolt.new.
       Include necessary context so each step can be built in isolation.

    STRICT: Output EXACTLY 7 steps in the JSON 'steps' array.
  `;

  for (let i = 0; i < retries; i++) {
    try {
      const result = await model.generateContent([
        { text: systemInstruction },
        { text: `User Idea: ${userPrompt}` }
      ]);

      const responseText = result.response.text();
      const parsedData = JSON.parse(responseText);

      // Validation: Ensure we got exactly 7 steps
      if (parsedData.steps && parsedData.steps.length !== 7) {
        console.warn(`AI returned ${parsedData.steps.length} steps. Retrying to get 7...`);
        if (i < retries - 1) continue;
      }

      return parsedData;

    } catch (error: any) {
      const status = error?.status || error?.response?.status;
      const isRetryable = status === 503 || status === 504 || status === 429;
      
      if (isRetryable && i < retries - 1) {
        const waitTime = Math.pow(2, i + 1) * 1000; 
        console.warn(`Gemini Error ${status} - Attempt ${i + 1}. Retrying in ${waitTime/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      console.error("AI Workflow Error:", error);
      throw new Error(
        isRetryable 
          ? "Our AI engine is temporarily busy. Please try again in 10 seconds." 
          : "Failed to generate your roadmap. Please try a different description."
      );
    }
  }
}