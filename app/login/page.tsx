"use client";

/**
 * Copyright 2026 Sandeep Kumar
 * Security Hardened Login Architecture
 * Patches: Open Redirects, User Enumeration, Type Safety (string | null), and XSS.
 */

import { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Loader2, AlertCircle, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { z } from "zod";

// Local Schema for Login (Matches your validation.ts style)
const loginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
});

function LoginForm() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * FIX: Argument of type 'string | null' is not assignable.
   * We use '??' to provide a safe fallback string.
   */
  const callbackUrl = searchParams.get("callbackUrl") ?? "/playground";
  const errorParam = searchParams.get("error") ?? "";

  // Redirect authenticated users
  useEffect(() => {
    if (mounted && status === "authenticated") {
      // Security: Validate callbackUrl to prevent Open Redirect attacks
      const isInternal = callbackUrl.startsWith("/") && !callbackUrl.startsWith("//");
      router.push(isInternal ? callbackUrl : "/playground");
    }
  }, [status, mounted, router, callbackUrl]);

  // Sync server-side auth errors to the UI
  useEffect(() => {
    if (errorParam === "CredentialsSignin") {
      setError("Invalid email or password. Please try again.");
    } else if (errorParam === "OAuthAccountNotLinked") {
      setError("Email already in use with another provider.");
    } else if (errorParam) {
      setError("An authentication error occurred. Please try again.");
    }
  }, [errorParam]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    setError("");
    
    // Zod Validation
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }
    
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email: validation.data.email,
        password: validation.data.password,
        redirect: false,
      });

      if (res?.error) {
        // Security: Generic message to prevent User Enumeration
        setError("Invalid credentials. Please verify your email and password.");
        setLoading(false);
      } else {
        // Safe internal redirect
        const isInternal = callbackUrl.startsWith("/") && !callbackUrl.startsWith("//");
        router.push(isInternal ? callbackUrl : "/playground");
        router.refresh();
      }
    } catch (err) {
      console.error("Auth Failure:", err);
      setError("System currently unavailable. Please try again later.");
      setLoading(false);
    }
  };

  if (!mounted || status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20">
        <div className="relative">
          <Loader2 className="animate-spin text-blue-500" size={40} />
          <div className="absolute inset-0 blur-xl bg-blue-500/20 animate-pulse rounded-full" />
        </div>
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em] animate-pulse">
          Establishing Secure Session...
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-md relative z-10"
    >
      <div className="flex justify-center mb-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
            New: Get 5 Free Vibes on Signup
          </span>
        </motion.div>
      </div>

      <div className="text-center mb-10">
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-3xl tracking-tighter mb-4 group outline-none">
          <div className="bg-blue-600 p-2 rounded-xl group-hover:scale-110 group-focus:scale-110 transition-transform shadow-[0_0_20px_rgba(37,99,235,0.3)]">
            <Zap size={22} fill="white" className="text-white" />
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            YouPrompt
          </span>
        </Link>
        <h2 className="text-xl font-semibold text-white/90">Access your workspace</h2>
        <p className="text-gray-500 text-sm mt-2 font-medium">Log in to manage your AI workflows and credits.</p>
      </div>

      <div className="bg-[#111112] border border-white/5 p-8 md:p-10 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden group/container">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-red-500/5 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs flex items-center gap-3 font-medium"
              >
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2.5">
            <label htmlFor="email" className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Email Address</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 focus:bg-black/60 transition-all text-sm placeholder:text-gray-700"
              placeholder="sandeep@example.com"
            />
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <label htmlFor="password" className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Password</label>
              <Link href="/forgot-password" dir="ltr" className="text-[10px] font-bold text-blue-500/80 hover:text-blue-400 transition-colors uppercase tracking-widest">
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 focus:bg-black/60 transition-all text-sm placeholder:text-gray-700"
                placeholder="••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors p-2"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-black py-4.5 rounded-2xl hover:bg-blue-50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100 shadow-xl mt-4 text-sm uppercase tracking-widest"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <>Continue to Workspace <ArrowRight size={18} /></>}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-white/5 text-center space-y-6">
          <p className="text-gray-400 text-sm">
            Don&apos;t have an account?{" "}
            <Link 
              href="/signup" 
              className="text-white font-bold hover:text-blue-400 transition-colors underline underline-offset-8 decoration-white/10 hover:decoration-blue-400/40"
            >
              Start Free Trial
            </Link>
          </p>
          
          <div className="flex items-center justify-center gap-4 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              <ShieldCheck size={14} /> Encrypted
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-800" />
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              SaaS v2.4
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6 font-[family-name:var(--font-geist-sans)] selection:bg-blue-500/30">
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/[0.03] blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-600/[0.02] to-transparent pointer-events-none" />
      
      <Suspense fallback={
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-500" size={32} />
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Initializing...</p>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}