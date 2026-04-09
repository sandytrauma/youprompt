"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { signUpUser } from "@/app/actions/auth";
import { Loader2, Zap, ArrowRight, Mail, GitBranch } from "lucide-react";
import { toast } from "react-hot-toast";

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    
    try {
      const result = await signUpUser(formData);

      if (result?.error) {
        toast.error(result.error);
      } else if (result?.success) {
        toast.success("Account created successfully!");
        router.push("/login");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[440px] z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <Link href="/" className="flex items-center gap-2 font-bold text-2xl tracking-tighter mb-4">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Zap size={20} fill="white" />
            </div>
            YouPrompt
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
          <p className="text-gray-500 text-sm mt-2">Start building with the speed of vibes.</p>
        </div>

        {/* Card */}
        <div className="bg-[#111111]/50 backdrop-blur-xl border border-white/5 p-8 rounded-[2.5rem] shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400 ml-1 uppercase tracking-wider">Full Name</label>
              <input 
                name="name"
                type="text"
                placeholder="Sandeep Kumar"
                required
                disabled={isLoading}
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-blue-500/50 focus:ring-1 ring-blue-500/20 transition-all placeholder:text-gray-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400 ml-1 uppercase tracking-wider">Email Address</label>
              <input 
                name="email"
                type="email"
                placeholder="sandeep@example.com"
                required
                disabled={isLoading}
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-blue-500/50 focus:ring-1 ring-blue-500/20 transition-all placeholder:text-gray-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400 ml-1 uppercase tracking-wider">Password</label>
              <input 
                name="password"
                type="password"
                placeholder="••••••••"
                required
                disabled={isLoading}
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-blue-500/50 focus:ring-1 ring-blue-500/20 transition-all placeholder:text-gray-700"
              />
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-black font-bold py-4 rounded-2xl mt-4 flex items-center justify-center gap-2 hover:bg-gray-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Create Account <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5"></span></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#111] px-4 text-gray-500 font-medium">Or continue with</span></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 py-3 rounded-2xl hover:bg-white/10 transition-colors text-sm font-medium">
              <GitBranch size={18} /> GitHub
            </button>
            <button className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 py-3 rounded-2xl hover:bg-white/10 transition-colors text-sm font-medium">
              <Mail size={18} /> Google
            </button>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-8">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-500 hover:text-blue-400 font-medium transition-colors">
            Sign In
          </Link>
        </p>
      </motion.div>

      <footer className="absolute bottom-8 text-[10px] text-gray-600 uppercase tracking-[0.2em] font-bold">
        Secure Auth Powered by YouPrompt AI
      </footer>
    </div>
  );
}