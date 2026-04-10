import React from "react";
import { 
  Zap, 
  BookOpen, 
  Terminal, 
  History, 
  ShieldCheck, 
  ArrowRight, 
  Layers,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";

export default function DocumentationPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-[family-name:var(--font-geist-sans)]">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <Link href="/playground" className="flex items-center gap-2 font-bold text-lg md:text-xl tracking-tighter shrink-0">
            <div className="bg-blue-600 p-1 rounded-lg">
              <Zap size={18} fill="white" />
            </div>
            <span>
              YouPrompt <span className="text-gray-500 font-medium text-xs md:text-sm ml-1 md:ml-2">Docs</span>
            </span>
          </Link>
          <Link href="/playground" className="text-xs md:text-sm font-medium text-gray-400 hover:text-white transition-colors truncate ml-4">
            Return to Playground
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Hero Section */}
        <section className="mb-12 md:mb-16">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">System Documentation</h1>
          <p className="text-gray-400 text-base md:text-lg leading-relaxed">
            Welcome to the YouPrompt Operating Procedure. This guide ensures you maximize the AI workflow 
            generation engine and understand the versioning lifecycle of your inquiries.
          </p>
        </section>

        {/* 1. The Workflow Engine */}
        <section className="mb-12 md:mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <Layers size={24} />
            </div>
            <h2 className="text-xl md:text-2xl font-semibold">The Core Workflow</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-[#161617] border border-white/5 p-6 rounded-2xl md:rounded-3xl">
              <h3 className="text-blue-400 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-3">01. Initialization</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Enter a technical or operational goal. The system utilizes Gemini 3 Flash to decompose 
                complex requests into a 7-step logical sequence.
              </p>
            </div>
            <div className="bg-[#161617] border border-white/5 p-6 rounded-2xl md:rounded-3xl">
              <h3 className="text-purple-400 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-3">02. Versioning</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Every modification creates a new "Vibe Version." This immutable history ensures 
                you can reference previous logic while iterating on new ideas.
              </p>
            </div>
          </div>
        </section>

        {/* 2. Your First Ever Prompt (SOP) */}
        <section className="mb-12 md:mb-16 bg-blue-600/5 border border-blue-500/10 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 hidden md:block">
            <Terminal size={120} />
          </div>
          
          <h2 className="text-xl md:text-2xl font-bold mb-8 flex items-center gap-2">
            <BookOpen className="text-blue-500" size={20}/>
            Standard Operating Procedure
          </h2>

          <div className="space-y-8 md:space-y-10 relative z-10">
            <div>
              <h3 className="text-white font-semibold mb-2 flex items-start gap-3">
                <CheckCircle2 size={18} className="text-blue-500 mt-0.5 shrink-0" />
                <span>Step 1: Use the CAR Framework</span>
              </h3>
              <div className="text-gray-400 text-sm ml-8 md:ml-9">
                For your first prompt, follow **Context, Action, Result**. 
                <div className="mt-3 p-4 bg-white/5 rounded-xl border border-white/5 text-blue-400 italic leading-relaxed">
                  "I am an Operations Manager (Context), generate a duty roster template (Action) for 50 bus drivers with SOC monitoring (Result)."
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2 flex items-start gap-3">
                <CheckCircle2 size={18} className="text-blue-500 mt-0.5 shrink-0" />
                <span>Step 2: Initialize the Vibe</span>
              </h3>
              <p className="text-gray-400 text-sm ml-8 md:ml-9 leading-relaxed">
                Paste your prompt in the Playground. Wait for the status indicator to complete. 
                Your first version (**V1: Initial Vibe**) will be saved to your sidebar history automatically.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2 flex items-start gap-3">
                <CheckCircle2 size={18} className="text-blue-500 mt-0.5 shrink-0" />
                <span>Step 3: Review & Iterate</span>
              </h3>
              <p className="text-gray-400 text-sm ml-8 md:ml-9 leading-relaxed">
                Navigate through the 7 generated milestones. If steps need technical adjustment, 
                simply update the prompt. The system will branch into **V2**, preserving your original V1.
              </p>
            </div>
          </div>
        </section>

        {/* 3. System Access & Roles */}
        <section className="mb-12 md:mb-16">
          <h2 className="text-xl md:text-2xl font-semibold mb-6 flex items-center gap-2">
            <ShieldCheck className="text-green-500" />
            Permissions & Roles
          </h2>
          <div className="bg-[#161617] border border-white/5 rounded-2xl md:rounded-3xl overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-sm min-w-[450px]">
                <thead className="bg-white/5 text-gray-400 uppercase text-[10px] tracking-widest">
                  <tr>
                    <th className="p-4 md:p-5">Role</th>
                    <th className="p-4 md:p-5">Capabilities</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="p-4 md:p-5 font-bold">Standard User</td>
                    <td className="p-4 md:p-5 text-gray-400 text-xs md:text-sm">Create Vibes, View Personal History, Update Versions.</td>
                  </tr>
                  <tr>
                    <td className="p-4 md:p-5 font-bold text-blue-400">Admin</td>
                    <td className="p-4 md:p-5 text-gray-400 text-xs md:text-sm">All User rights + System Activity Monitoring and User Management.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Footer Link */}
        <footer className="pt-8 md:pt-12 border-t border-white/5 text-center">
          <p className="text-gray-500 text-sm mb-6">Ready to begin your first session?</p>
          <Link 
            href="/playground" 
            className="inline-flex items-center justify-center gap-2 bg-white text-black w-full md:w-auto px-8 py-4 rounded-xl md:rounded-2xl font-bold hover:bg-blue-50 transition-all shadow-lg active:scale-95"
          >
            Launch Playground <ArrowRight size={18} />
          </Link>
        </footer>
      </main>
    </div>
  );
}