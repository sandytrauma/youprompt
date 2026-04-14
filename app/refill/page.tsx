/**
 * Copyright 2026 Sandeep Kumar
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Zap, ArrowRight, ShieldCheck, Sparkles, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
// 🔥 Updated import to point to your new Server Action file
import { initiatePhonePePayment } from "@/app/actions/payments";

const creditBundles = [
  { id: "basic", credits: 50, price: 199, label: "Starter" },
  { id: "pro", credits: 200, price: 499, label: "Professional", popular: true },
  { id: "elite", credits: 1000, price: 1499, label: "Enterprise" },
];

function RefillContent() {
  const { data: session, status } = useSession();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const searchParams = useSearchParams();

  /**
   * Handle URL feedback from the callback redirect
   */
  useEffect(() => {
    const error = searchParams.get("error");
    const success = searchParams.get("success");

    if (error === "failed") {
      toast.error("Payment failed or was cancelled.");
    } else if (error === "invalid_user") {
      toast.error("Session error. Please log in again.");
    } else if (error === "db_error") {
      toast.error("Database update failed. Contact support.");
    } else if (success === "true") {
      toast.success("Credits added successfully!");
    }
  }, [searchParams]);

  const handleRefill = async (bundle: typeof creditBundles[0]) => {
    // 1. Validation: Ensure user is logged in
    if (status === "unauthenticated" || !session?.user?.id) {
      toast.error("Please log in to purchase credits.");
      return;
    }

    const userId = session.user.id;

    try {
      setLoadingId(bundle.id);
      
      // 2. Trigger the Server Action
      const result = await initiatePhonePePayment(bundle.price, userId, bundle.id);
      
      if (result.error) {
        toast.error(result.error);
      } else if (result.url) {
        // 3. Redirect to the secure PhonePe checkout page
        window.location.href = result.url;
      }
    } catch (err) {
      console.error("Frontend Refill Error:", err);
      toast.error("Unexpected error occurred.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center py-20 px-6 font-[family-name:var(--font-geist-sans)]">
      {/* Header Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
          <Sparkles size={14} className="text-blue-400" />
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
            Token Refill
          </span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Power up your workflow</h1>
        <p className="text-gray-500">Credits never expire. Top up and keep creating.</p>
      </div>

      {/* Pricing Grid */}
      <div className="grid md:grid-cols-3 gap-6 w-full max-w-5xl">
        {creditBundles.map((bundle) => (
          <motion.div
            key={bundle.id}
            whileHover={{ y: -5 }}
            className={`bg-[#111112] border ${
              bundle.popular 
                ? 'border-blue-500/40 shadow-[0_0_30px_rgba(37,99,235,0.1)]' 
                : 'border-white/5'
            } p-8 rounded-[2.5rem] relative transition-shadow`}
          >
            {bundle.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-[9px] font-black uppercase px-3 py-1 rounded-full">
                Most Popular
              </span>
            )}
            
            <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">
              {bundle.label}
            </h3>
            
            <div className="text-3xl font-bold mb-4">{bundle.credits} Credits</div>
            
            <div className="text-gray-400 text-sm mb-8">
              Pay just <span className="text-white font-bold">₹{bundle.price}</span>
            </div>
            
            <button
              onClick={() => handleRefill(bundle)}
              disabled={loadingId !== null || status === "loading"}
              className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                bundle.popular 
                  ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                  : 'bg-white text-black hover:bg-gray-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loadingId === bundle.id ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  Buy Now <ArrowRight size={16} />
                </>
              )}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Trust Footer */}
      <footer className="mt-16 flex flex-wrap justify-center items-center gap-6 opacity-30 grayscale hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
          <ShieldCheck size={16} /> Secured by PhonePe
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
          <Zap size={16} /> Instant Delivery
        </div>
      </footer>
    </div>
  );
}

// Wrapping in Suspense is mandatory for useSearchParams() in Next.js Client Components
export default function RefillPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    }>
      <RefillContent />
    </Suspense>
  );
}