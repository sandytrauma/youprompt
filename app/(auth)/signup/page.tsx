"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { signUpUser } from "@/app/actions/auth";
import { 
  Loader2, 
  Zap, 
  ArrowRight, 
  Mail,  
  ShieldCheck, 
  CheckCircle2,
  Sparkles, 
  GitBranch
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;

    // Basic production validation
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      setIsLoading(false);
      return;
    }
    
    try {
      const result = await signUpUser(formData);

      if (result?.error) {
        toast.error(result.error);
      } else if (result?.success) {
        toast.success("Welcome to YouPrompt! Redirecting...");
        // Delay slightly for toast visibility
        setTimeout(() => router.push("/login"), 1500);
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-[family-name:var(--font-geist-sans)]">
      {/* Background Decorative Element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-blue-600/[0.03] blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[440px] z-10"
      >
        {/* SaaS Welcome Badge */}
        <div className="flex justify-center mb-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20"
          >
            <Sparkles size={12} className="text-blue-400" />
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
              Join now & get 5 Free Credits
            </span>
          </motion.div>
        </div>

        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <Link href="/" className="flex items-center gap-2 font-bold text-3xl tracking-tighter mb-4 group outline-none">
            <div className="bg-blue-600 p-2 rounded-xl group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(37,99,235,0.3)]">
              <Zap size={22} fill="white" />
            </div>
            YouPrompt
          </Link>
          <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            Create your account
          </h1>
          <p className="text-gray-500 text-sm mt-2 font-medium">
            Start building with the speed of vibes.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-[#111112] border border-white/5 p-8 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden group/container">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Full Name</label>
              <input 
                name="name"
                type="text"
                placeholder="Sandeep Kumar"
                required
                disabled={isLoading}
                className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 focus:bg-black/60 transition-all text-sm placeholder:text-gray-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Email Address</label>
              <input 
                name="email"
                type="email"
                placeholder="sandeep@example.com"
                required
                disabled={isLoading}
                className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 focus:bg-black/60 transition-all text-sm placeholder:text-gray-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Password</label>
              <input 
                name="password"
                type="password"
                placeholder="••••••••"
                required
                disabled={isLoading}
                className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 focus:bg-black/60 transition-all text-sm placeholder:text-gray-700"
              />
              <p className="text-[9px] text-gray-600 px-1 italic">Min. 8 characters with letters & numbers</p>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-black font-black py-4.5 rounded-2xl mt-4 flex items-center justify-center gap-2 hover:bg-blue-50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl uppercase text-sm tracking-widest"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Claim My 5 Credits <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* SaaS Divider */}
          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/5"></span>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em]">
              <span className="bg-[#111112] px-4 text-gray-600 font-bold">Secure Access</span>
            </div>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 bg-white/[0.03] border border-white/5 py-3.5 rounded-2xl hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-wider active:scale-95 group">
              <GitBranch size={18} className="group-hover:text-blue-400 transition-colors" /> GitHub
            </button>
            <button className="flex items-center justify-center gap-2 bg-white/[0.03] border border-white/5 py-3.5 rounded-2xl hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-wider active:scale-95 group">
              <Mail size={18} className="group-hover:text-red-400 transition-colors" /> Google
            </button>
          </div>

          {/* Feature List for Conversion */}
          <div className="mt-8 pt-8 border-t border-white/5 space-y-3">
            {[
              "Instant access to Gemini 3 Flash",
              "Priority neural processing",
              "Save up to 50 active projects"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-gray-500 text-[10px] font-bold uppercase tracking-tight">
                <CheckCircle2 size={12} className="text-blue-500" /> {feature}
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-gray-400 text-sm mt-8">
          Already have an account?{" "}
          <Link href="/login" className="text-white font-bold hover:text-blue-400 transition-colors underline underline-offset-8 decoration-white/10 hover:decoration-blue-400/40">
            Sign In
          </Link>
        </p>
      </motion.div>

      {/* Corporate Footer */}
      <footer className="mt-12 mb-8 flex flex-col items-center gap-2 opacity-40">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-500 uppercase tracking-widest">
            <ShieldCheck size={12} /> SOC2 Compliant
          </div>
          <div className="w-1 h-1 rounded-full bg-gray-800" />
          <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
            GDPR Ready
          </div>
        </div>
        <p className="text-[8px] text-gray-700 uppercase tracking-[0.4em] font-bold">
          © 2026 YouPrompt Systems
        </p>
      </footer>
    </div>
  );
}