import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Plan-specific configurations
export const PLAN_LIMITS = {
  free: { requests: 5, window: "1 h" as const },
  builder: { requests: 50, window: "1 h" as const },
  agency: { requests: 200, window: "1 h" as const },
} as const;

export async function checkRateLimit(userId: string, plan: keyof typeof PLAN_LIMITS) {
  const config = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    prefix: `youprompt_limit_${plan}`,
  });

  return await limiter.limit(userId);
}