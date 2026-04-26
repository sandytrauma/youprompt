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
import { sanitizeHtml } from "@/lib/client-sanitizer";


interface Step {
  precisePrompt: string;
  objective?: string;
}



export default function VibeClientView({ vibe }: { vibe: any }) {
  // Now using browser's DOMPurify
  const sanitize = (content: string) => {
    return sanitizeHtml(content || "", "permissive");  // ✅ Client-only
  };

  const steps = (vibe.steps as Step[]) || [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative">
      <main>
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-4">
            {sanitize(vibe.title)}  {/* ✅ Safe HTML rendering */}
          </h1>
        </header>

        <div className="space-y-12">
          {steps.map((step, i) => (
            <div key={i} className="border-l border-white/10 pl-8 relative">
              <div dangerouslySetInnerHTML={{ 
                __html: sanitize(step.precisePrompt)  // ✅ Client-side sanitized
              }} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}