"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Loader2, AlertCircle, Eye, EyeOff, ArrowRight } from "lucide-react";
import Link from "next/link";

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

  useEffect(() => {
    if (mounted && status === "authenticated") {
      router.push("/playground");
    }
  }, [status, mounted, router]);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "CredentialsSignin") {
      setError("Invalid email or password. Please try again.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("The credentials you provided are incorrect.");
        setLoading(false);
      } else {
        router.push("/playground");
        router.refresh();
      }
    } catch (err) {
      setError("A system error occurred. Please try again later.");
      setLoading(false);
    }
  };

  if (!mounted || status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-blue-500" size={32} />
        <p className="text-gray-500 text-xs animate-pulse uppercase tracking-widest">Verifying Session...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md relative z-10"
    >
      <div className="text-center mb-10">
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl tracking-tighter mb-4 group">
          <div className="bg-blue-600 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
            <Zap size={20} fill="white" />
          </div>
          YouPrompt
        </Link>
        <h2 className="text-xl font-medium">Access your workspace</h2>
        <p className="text-gray-500 text-sm mt-2">Enter your authorized credentials to continue.</p>
      </div>

      <div className="bg-[#161617] border border-white/5 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/5 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs flex items-center gap-3"
              >
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Email Address</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 outline-none focus:border-blue-500/40 focus:bg-black/60 transition-all text-sm"
              placeholder="sandeep@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 outline-none focus:border-blue-500/40 focus:bg-black/60 transition-all text-sm"
                placeholder="••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-blue-50 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100 mt-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <>Continue <ArrowRight size={18} /></>}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-white/5 text-center space-y-4">
          <p className="text-gray-400 text-sm">
            Don't have an account?{" "}
            <Link 
              href="/signup" 
              className="text-white font-semibold hover:text-blue-400 transition-colors underline underline-offset-4 decoration-white/20"
            >
              Sign up
            </Link>
          </p>
          
          <p className="text-gray-500 text-[10px] leading-relaxed">
            System access restricted to authorized personnel only. 
            <br />
            <span className="inline-block mt-1 text-gray-600">
              Forgot credentials? Contact your administrator.
            </span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6 font-[family-name:var(--font-geist-sans)]">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
      <Suspense fallback={<Loader2 className="animate-spin text-blue-500" size={32} />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}