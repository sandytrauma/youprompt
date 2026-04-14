"use client";

import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export function ClaimCreditsOverlay() {
  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-[500px]">
      <div className="bg-blue-600 border border-white/20 rounded-[2rem] p-6 shadow-[0_0_50px_rgba(37,99,235,0.4)] flex items-center justify-between gap-6 animate-in fade-in slide-in-from-bottom-10 duration-700">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
            <Sparkles className="text-white fill-white" size={24} />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-tight text-white leading-tight">Claim Your 5 Credits</h4>
            <p className="text-[10px] text-blue-100 font-medium opacity-80 uppercase tracking-widest mt-0.5">Start building architecture now</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href="/login" className="bg-white text-blue-600 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center gap-2">
            SIGN IN <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}