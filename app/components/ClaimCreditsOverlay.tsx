"use client";

/**
 * Copyright 2026 Sandeep Kumar
 * Smart CTA Overlay v1.2
 * Patches: Session-Awareness, Dismissible Persistence, and UI Blocking.
 */

import { useState, useEffect } from "react";
import { Sparkles, ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";

export function ClaimCreditsOverlay() {
  const { status } = useSession();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 1. Only show if user is NOT authenticated
    // 2. Only show if user hasn't dismissed it in this session
    const isDismissed = localStorage.getItem("claim_credits_dismissed");
    
    if (status === "unauthenticated" && !isDismissed) {
      // Small delay for better UX entrance
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleDismiss = () => {
    setIsVisible(false);
    // Persist dismissal so it doesn't annoy the user on every route change
    localStorage.setItem("claim_credits_dismissed", "true");
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0, y: 100, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: 100, x: "-50%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-10 left-1/2 z-[100] w-[95%] max-w-[500px] pointer-events-none"
        >
          <div className="bg-blue-600 border border-white/20 rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(37,99,235,0.4)] flex items-center justify-between gap-6 pointer-events-auto relative overflow-hidden group">
            {/* Subtle background glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                <Sparkles className="text-white fill-white" size={24} />
              </div>
              <div>
                <h4 className="text-sm font-black uppercase tracking-tight text-white leading-tight">
                  Claim Your 5 Credits
                </h4>
                <p className="text-[10px] text-blue-100 font-medium opacity-80 uppercase tracking-widest mt-0.5">
                  Start building architecture now
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 relative z-10">
              <Link 
                href="/login" 
                className="bg-white text-blue-600 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center gap-2 shadow-lg active:scale-95"
              >
                SIGN IN <ArrowRight size={14} />
              </Link>
              
              <button 
                onClick={handleDismiss}
                className="p-2 text-white/50 hover:text-white transition-colors rounded-full hover:bg-white/10"
                aria-label="Dismiss"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}