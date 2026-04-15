"use client";

/**
 * Copyright 2026 Sandeep Kumar
 * Global Identity Sync & Architectural Transfer Protocol
 * Fixed: Vulnerability to XSS via user-generated prompt rendering
 */

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Zap, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import ismorphicDomPurify from "isomorphic-dompurify";

interface Step {
  precisePrompt: string;
  objective?: string;
}

export default function VibeClientView({ vibe }: { vibe: any }) {
  const { status } = useSession();
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    // Show overlay if user is not logged in to protect the blueprint and trigger onboarding
    if (status === "unauthenticated") {
      setShowOverlay(true);
    } else if (status === "authenticated") {
      setShowOverlay(false);
    }
  }, [status]);

  // Security: Sanitize all user-generated content before rendering
  const sanitize = (content: string) => {
    return ismorphicDomPurify.sanitize(content || "");
  };

  const steps = (vibe.steps as Step[]) || [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative selection:bg-blue-500/30">
      <main 
        className={`max-w-3xl mx-auto py-20 px-6 transition-all duration-1000 ease-in-out ${
          showOverlay ? 'blur-xl pointer-events-none scale-[0.96] opacity-50' : 'blur-0 scale-100 opacity-100'
        }`}
      >
        <header className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full flex items-center gap-2">
              <ShieldCheck size={10} className="text-blue-400" />
              <span className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter">Verified Architecture</span>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-4 leading-none">
            {sanitize(vibe.title)}
          </h1>
          
          <p className="text-blue-500 font-mono text-[10px] tracking-[0.3em] uppercase">
            Shared Blueprint // {vibe.createdAt ? new Date(vibe.createdAt).toLocaleDateString('en-GB') : 'SYSTEM_GEN'}
          </p>
        </header>

        <div className="space-y-12">
          {steps.map((step, i) => (
            <div key={i} className="border-l border-white/10 pl-8 relative group">
              <div className="absolute left-0 top-0 w-1 h-8 bg-blue-600 -translate-x-[2px] group-hover:h-full transition-all duration-500" />
              <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Step {i + 1}</h2>
              <div className="bg-[#111] p-8 rounded-[2rem] border border-white/5 font-mono text-sm text-gray-300 leading-relaxed shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-[0.02] pointer-events-none">
                  <Lock size={40} />
                </div>
                {/* Fixed: XSS protection on prompt rendering */}
                <div dangerouslySetInnerHTML={{ __html: sanitize(step.precisePrompt) }} className="whitespace-pre-wrap" />
              </div>
            </div>
          ))}
        </div>

        <footer className="mt-20 pt-10 border-t border-white/5 text-center">
          <p className="text-[9px] text-gray-700 font-bold uppercase tracking-[0.5em]">
            Architectural Node: {vibe.id}
          </p>
        </footer>
      </main>

      {/* CLAIM CREDITS OVERLAY */}
      {showOverlay && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
          
          <div className="relative bg-[#0c0c0c] border border-white/10 p-10 rounded-[3rem] max-w-md w-full shadow-[0_0_80px_rgba(0,0,0,0.8)] text-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-blue-600/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-blue-500/20">
              <Zap className="text-blue-500 animate-pulse" size={38} />
            </div>
            
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-3 italic">
              Claim this <span className="text-blue-500">Blueprint</span>
            </h2>
            <p className="text-gray-400 text-sm mb-10 leading-relaxed font-medium px-4">
              Access the full architectural workflow and receive <b className="text-white">5 Builder Credits</b> instantly added to your node.
            </p>

            <div className="space-y-4">
              <Link 
                href="/login" 
                className="flex items-center justify-center gap-3 w-full bg-white text-black py-5 rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.2em] hover:bg-blue-500 hover:text-white transition-all active:scale-95 shadow-xl"
              >
                Sign In to Claim <ArrowRight size={18} />
              </Link>
              
              <div className="flex flex-col items-center gap-2 pt-6">
                <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest flex items-center justify-center gap-2">
                  <Lock size={12} className="text-gray-800" /> Secure Architectural Transfer
                </p>
                <div className="h-1 w-12 bg-white/5 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}