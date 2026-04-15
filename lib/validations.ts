import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(12, "Password must be at least 12 characters")
    .regex(/[A-Z]/, "Must contain one uppercase letter")
    .regex(/[0-9]/, "Must contain one number")
    .regex(/[^a-zA-Z0-9]/, "Must contain one special character"),
});

export const commentSchema = z.object({
  vibeId: z.string().uuid(),
  content: z.string().min(1).max(500, "Comment too long"),
});