/**
 * Copyright 2026 Sandeep Kumar
 * YouPrompt Secure Documentation Engine v1.2
 * Patches: Tab-Nabbing, Semantic SEO, and Mobile Table Overflow.
 */

import React from "react";
import { 
  Zap, BookOpen, Terminal, ShieldCheck, ArrowRight, Layers,
  CheckCircle2, Cpu, Globe, Database, CreditCard, Code2, ExternalLink
} from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation | YouPrompt AI",
  description: "Official SOPs and Technical Specifications for YouPrompt Vibe Coding.",
};

export default function DocumentationPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {/* Secure Header */}
      <header className="border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <Link 
            href="/playground" 
            className="flex items-center gap-2 font-bold text-xl tracking-tighter shrink-0 transition-opacity hover:opacity-80 focus:ring-2 focus:ring-blue-500 rounded-lg outline-none"
          >
            <div className="bg-blue-600 p-1 rounded-lg shadow-lg shadow-blue-600/20">
              <Zap size={20} fill="white" className="text-white" />
            </div>
            <span>YouPrompt <span className="text-gray-500 text-sm ml-2 font-medium tracking-normal">Docs</span></span>
          </Link>
          <div className="flex items-center gap-6">
            <a 
              href="https://github.com/sandytrauma/youprompt" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hidden md:flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-white transition-colors"
            >
              Github <ExternalLink size={12} />
            </a>
            <Link href="/playground" className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors">
              Open Playground
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 md:py-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        
        {/* Project Intelligence Overview */}
        <section className="mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            System Operational
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-[0.9]">
            The Architecture <br />
            <span className="text-gray-600">of Vibe Coding.</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl leading-relaxed max-w-3xl">
            YouPrompt leverages Gemini 2.5 Flash to convert abstract product visions into 
            multi-stage technical roadmaps. Built on Next.js 16.2.3 for extreme performance.
          </p>
        </section>

        {/* The 7-Step Workflow Logic */}
        <section className="mb-24">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
              <Layers size={28} />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight">Core Workflow</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { 
                title: "01. Prompt Injection", 
                desc: "User inputs a functional requirement via the Playground.",
                icon: <Terminal className="text-blue-400" />
              },
              { 
                title: "02. Logic Synthesis", 
                desc: "AI identifies database schemas, API routes, and UI components.",
                icon: <Cpu className="text-purple-400" />
              },
              { 
                title: "03. IDE Handover", 
                desc: "Validated prompts are moved to Cursor or Bolt for final build.",
                icon: <Globe className="text-green-400" />
              }
            ].map((card, i) => (
              <div key={i} className="bg-[#111] border border-white/5 p-8 rounded-[2.5rem] group hover:border-white/10 transition-all">
                <div className="mb-6 p-3 bg-white/[0.03] w-fit rounded-2xl group-hover:scale-110 transition-transform">{card.icon}</div>
                <h3 className="font-black text-[10px] uppercase tracking-[0.2em] mb-3 text-gray-500">{card.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed font-medium">{card.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Standard Operating Procedure: CAR Framework */}
        <section className="mb-24 bg-gradient-to-br from-blue-600/[0.05] to-transparent border border-blue-500/10 rounded-[3rem] p-8 md:p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <BookOpen size={200} />
          </div>
          
          <h2 className="text-3xl font-black mb-12 flex items-center gap-4">
            User SOP: Prompt Mastery
          </h2>

          <div className="space-y-12 max-w-3xl relative z-10">
            <div className="flex gap-8">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-white shrink-0 shadow-2xl shadow-blue-600/40">1</div>
              <div>
                <h3 className="text-xl font-bold mb-3">Contextual Action Result (CAR)</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                  For optimal generation, your prompt should contain your professional persona, the specific action required, and the tech-stack result.
                </p>
                <div className="bg-black/60 border border-white/5 p-6 rounded-2xl font-mono text-xs md:text-sm text-blue-300 italic shadow-inner select-all">
                  "As a <span className="text-white font-bold underline">SaaS Founder</span>, generate a <span className="text-white font-bold underline">Subscription Logic</span> using <span className="text-white font-bold underline">Stripe and Drizzle</span>."
                </div>
              </div>
            </div>

            <div className="flex gap-8">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-white shrink-0">2</div>
              <div>
                <h3 className="text-xl font-bold mb-3">Version Branching</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Every update to your "Vibe" creates a new version in the Inquiry table. 
                  You can jump between <span className="text-white font-bold">V1 (Initial)</span> and <span className="text-white font-bold">V2 (Refined)</span> without losing data.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Permissions & RBAC */}
        <section className="mb-24">
          <h2 className="text-2xl font-black mb-10 flex items-center gap-3">
            <ShieldCheck className="text-green-500" />
            Security & Governance
          </h2>
          <div className="bg-[#111] border border-white/5 rounded-[2.5rem] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[600px]">
                <thead className="bg-white/5 text-gray-500 font-black uppercase text-[10px] tracking-[0.2em]">
                  <tr>
                    <th className="p-8">Role Type</th>
                    <th className="p-8">Capabilities</th>
                    <th className="p-8">Credits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-8 font-black text-gray-200 uppercase tracking-tighter">Standard User</td>
                    <td className="p-8 text-gray-500 text-xs leading-relaxed">Create, Version, and Publish Vibes. Access to Public Feed.</td>
                    <td className="p-8 text-blue-400 font-bold">5 Initial</td>
                  </tr>
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-8 font-black text-blue-500 uppercase tracking-tighter">System Admin</td>
                    <td className="p-8 text-gray-500 text-xs leading-relaxed">Database Mutation, Credit Override, System Analytics.</td>
                    <td className="p-8 text-purple-400 font-bold">Unlimited</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Final CTA Footer */}
        <footer className="pt-20 border-t border-white/5 text-center">
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.5em] mb-10">Start Your Development Cycle</p>
          <Link 
            href="/playground" 
            className="group relative inline-flex items-center justify-center gap-3 bg-white text-black px-14 py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:bg-blue-50 active:scale-95 shadow-[0_20px_60px_rgba(255,255,255,0.05)]"
          >
            Launch Environment <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <div className="mt-16 text-[10px] text-gray-700 font-bold uppercase tracking-widest flex items-center justify-center gap-4">
            <span>© 2026 Sandeep Kumar</span>
            <span className="w-1 h-1 bg-gray-800 rounded-full" />
            <span>Apache 2.0 License</span>
            <span className="w-1 h-1 bg-gray-800 rounded-full" />
            <span>v0.1.0-STABLE</span>
          </div>
        </footer>
      </main>
    </div>
  );
}