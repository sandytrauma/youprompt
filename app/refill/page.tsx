/**
 * Copyright 2026 Sandeep Kumar
 * Refill Page - Secure Payment Entry Point
 */

"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Zap, ArrowRight, ShieldCheck, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner"; // Switching to Sonner for better Next.js 13+ compatibility
import { initiatePhonePePayment } from "@/app/actions/payments";

// Tiered Pricing Strategy (Aligned with /pricing.ts)
const creditBundles = [
  { id: "basic", credits: 50, price: 599, label: "Starter", description: "Perfect for small projects" },
  { id: "pro", credits: 200, price: 1999, label: "Professional", popular: true, description: "Most flexible for power users" },
  { id: "elite", credits: 1000, price: 6999, label: "Enterprise", description: "The ultimate workflow engine" },
];

function RefillContent() {
  const { data: session, status, update } = useSession();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  /**
   * Secure Callback Handling
   * Verifies payment status and refreshes local session state
   */
  useEffect(() => {
    const error = searchParams.get("error");
    const success = searchParams.get("success");

    if (error) {
      const messages: Record<string, string> = {
        failed: "Payment was declined by the bank.",
        cancelled: "Transaction was cancelled.",
        invalid_user: "Security mismatch. Please log in again.",
        db_error: "Payment received but sync failed. Please contact support."
      };
      toast.error("Payment Issue", { description: messages[error] || "An unknown error occurred." });
      // Clear URL params to prevent toast loops
      router.replace("/refill");
    } 
    
    if (success === "true") {
      toast.success("Credits Refilled!", { description: "Your balance has been updated successfully." });
      // Critical: Refresh the session to show new credit count immediately
      update();
      router.replace("/playground");
    }
  }, [searchParams, update, router]);

  const handleRefill = async (bundle: typeof creditBundles[0]) => {
    // 1. Authorization Guard
    if (status !== "authenticated" || !session?.user?.id) {
      toast.error("Authentication Required", { description: "Please log in to purchase credits." });
      return;
    }

    // 2. Prevent Concurrent Requests (Double-tap protection)
    if (loadingId || isRedirecting) return;

    try {
      setLoadingId(bundle.id);
      
      // 3. Secure Server Action Call
      // We pass bundle.price but the server action MUST re-validate this price against the ID
      const result = await initiatePhonePePayment(bundle.price, session.user.id, bundle.id);

      if (result.error) {
        toast.error("Gateway Error", { description: result.error });
      } else if (result.url) {
        setIsRedirecting(true);
        // 4. Secure Redirect to Hosted Payment Page
        window.location.href = result.url;
      }
    } catch (err) {
      console.error("Refill_Client_Error:", err);
      toast.error("Connection Failed", { description: "Could not reach payment gateway." });
    } finally {
      if (!isRedirecting) setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center py-20 px-6 font-[family-name:var(--font-geist-sans)]">
      
      {/* Header Section */}
      <div className="text-center mb-16">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6"
        >
          <Sparkles size={14} className="text-blue-400" />
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
            Credit Management
          </span>
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
          Fuel your creativity.
        </h1>
        <p className="text-gray-500 max-w-md mx-auto">
          Secure, instant top-ups for your prompt engineering workflow. Credits are added to your account immediately.
        </p>
      </div>

      {/* Pricing Grid */}
      <div className="grid md:grid-cols-3 gap-6 w-full max-w-6xl">
        {creditBundles.map((bundle, index) => (
          <motion.div
            key={bundle.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex flex-col bg-[#111112] border ${
              bundle.popular 
                ? 'border-blue-500/40 shadow-[0_0_40px_rgba(37,99,235,0.05)]' 
                : 'border-white/5'
            } p-8 rounded-[2.5rem] relative transition-all group hover:bg-[#161618]`}
          >
            {bundle.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-[9px] font-black uppercase px-4 py-1.5 rounded-full shadow-lg">
                Best Value
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">
                {bundle.label}
              </h3>
              <div className="text-4xl font-black mb-2 flex items-baseline gap-1">
                {bundle.credits}
                <span className="text-sm font-medium text-gray-500">Credits</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{bundle.description}</p>
            </div>

            <div className="mt-auto pt-8">
              <div className="flex items-center justify-between mb-6 px-1">
                <span className="text-gray-500 text-xs font-medium">Total Amount</span>
                <span className="text-xl font-bold">₹{bundle.price}</span>
              </div>

              <button
                onClick={() => handleRefill(bundle)}
                disabled={loadingId !== null || status === "loading" || isRedirecting}
                className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all ${
                  bundle.popular 
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20' 
                    : 'bg-white text-black hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed active:scale-95`}
              >
                {loadingId === bundle.id || (isRedirecting && loadingId === bundle.id) ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <>
                    Initialize Payment <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Trust & Security Footer */}
      <footer className="mt-20 flex flex-col items-center gap-8">
        <div className="flex flex-wrap justify-center items-center gap-8 opacity-40 hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest border border-white/10 px-4 py-2 rounded-full">
            <ShieldCheck size={14} className="text-green-500" /> AES-256 Encryption
          </div>
          <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest border border-white/10 px-4 py-2 rounded-full">
            <Zap size={14} className="text-yellow-500" /> Instant Credits
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-2 max-w-xs text-center">
          <AlertCircle size={16} className="text-gray-600" />
          <p className="text-[9px] text-gray-600 font-medium leading-relaxed">
            Payments are processed via PhonePe Secure API. By continuing, you agree to our Terms of Service regarding digital credit purchases.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function RefillPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-blue-500" size={40} />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Securing Session...</p>
      </div>
    }>
      <RefillContent />
    </Suspense>
  );
}