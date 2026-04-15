import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// AI Providers
export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Redis & Rate Limiting (10,000 tokens per hour)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const tokenRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10000, "1 h"),
  analytics: true,
  prefix: "youprompt_ratelimit",
});