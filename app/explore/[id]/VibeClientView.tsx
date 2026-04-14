"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Zap, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function VibeClientView({ vibe }: { vibe: any }) {
  const { data: session, status } = useSession();
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    // Show overlay if user is not logged in
    if (status === "unauthenticated") {
      setShowOverlay(true);
    }
  }, [status]);

  const steps = (vibe.steps as any[]) || [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative">
      <main className={`max-w-3xl mx-auto py-20 px-6 transition-all duration-700 ${showOverlay ? 'blur-md pointer-events-none scale-[0.98]' : ''}`}>
        <header className="mb-12">
          <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-4">
            {vibe.title}
          </h1>
         <p className="text-blue-500 font-mono text-xs tracking-widest uppercase">
  Shared Blueprint // {new Date(vibe.createdAt).toLocaleDateString('en-GB')}
</p>
        </header>

        <div className="space-y-10">
          {steps.map((step, i) => (
            <div key={i} className="border-l border-white/10 pl-8 relative">
              <div className="absolute left-0 top-0 w-1 h-6 bg-blue-600 -translate-x-[2px]" />
              <h2 className="text-sm font-black text-gray-400 uppercase mb-3">Step {i + 1}</h2>
              <div className="bg-[#111] p-6 rounded-2xl border border-white/5 font-mono text-sm text-gray-300 leading-relaxed">
                {step.precisePrompt}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* CLAIM CREDITS OVERLAY */}
      {showOverlay && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          {/* Backdrop blur handled by parent div if needed, but fixed inset works best */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xl" />
          
          <div className="relative bg-[#111] border border-white/10 p-10 rounded-[2.5rem] max-w-md w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] text-center">
            <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/30">
              <Zap className="text-blue-500" size={32} />
            </div>
            
            <h2 className="text-2xl font-black uppercase tracking-tight mb-2">
              Claim this Blueprint
            </h2>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              This is a private blueprint shared via WhatsApp. Sign in to claim it to your dashboard and receive <b>5 Builder Credits</b>.
            </p>

            <div className="space-y-3">
              <Link 
                href="/login" 
                className="flex items-center justify-center gap-2 w-full bg-white text-black py-4 rounded-full font-black uppercase text-xs tracking-widest hover:bg-blue-500 hover:text-white transition-all"
              >
                Sign In to Claim <ArrowRight size={16} />
              </Link>
              
              <p className="text-[10px] text-gray-600 uppercase font-bold tracking-widest pt-4 flex items-center justify-center gap-2">
                <Lock size={10} /> Secure Architectural Transfer
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}