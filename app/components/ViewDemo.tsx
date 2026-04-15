"use client";

/**
 * Copyright 2026 Sandeep Kumar
 * Interactive Simulation Engine v4.2
 * Patches: Interval Memory Safety, Body Scroll Locking, and Keyboard Access.
 */

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  Zap, X, Play, RefreshCcw, Terminal, AlertTriangle, 
  CheckCircle2, ShieldAlert, Code2 
} from "lucide-react";

const DEMO_STEPS = [
  { id: 1, title: "Schema Design", desc: "Drizzle ORM tables for Users, Clients, and Tasks." },
  { id: 2, title: "Auth Layer", desc: "NextAuth with Edge-compatible JWT handling." },
  { id: 3, title: "Real-time Sync", desc: "Socket.io integration for live status updates." },
  { id: 4, title: "State Management", desc: "Zustand store for global application state." },
  { id: 5, title: "API Routes", desc: "Safe route handlers with Zod validation." },
  { id: 6, title: "UI Components", desc: "Shadcn charts for performance metrics." },
  { id: 7, title: "Deployment", desc: "Vercel Edge config with Neon DB pooling." },
];

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DemoModal({ isOpen, onClose }: DemoModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showRisk, setShowRisk] = useState(false);

  // 1. Body Scroll Locking & ESC Key Handling
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleEsc);
      return () => {
        document.body.style.overflow = "unset";
        window.removeEventListener("keydown", handleEsc);
      };
    }
  }, [isOpen, onClose]);

  // 2. Safe Interval Engine
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStep((prev) => {
          const next = prev + 1;
          if (next >= DEMO_STEPS.length) {
            setIsPlaying(false);
            clearInterval(interval);
            return DEMO_STEPS.length;
          }
          if (next === 2) setShowRisk(true);
          return next;
        });
      }, 1400);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  const startDemo = useCallback(() => {
    setCurrentStep(0);
    setShowRisk(false);
    setIsPlaying(true);
  }, []);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-5xl bg-[#0d0d0d] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-600/20">
                  <Zap size={18} fill="white" className="text-white" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-widest text-white">Simulation</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Architecture Validation Loop</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-3 hover:bg-white/10 rounded-full transition-all active:scale-90"
                aria-label="Close Modal"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
              <div className="grid lg:grid-cols-5 gap-10">
                {/* Left: Input Console */}
                <div className="lg:col-span-2 space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-blue-400">
                      <Terminal size={14} />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Source Prompt</span>
                    </div>
                    <div className="bg-black/50 border border-white/5 rounded-3xl p-6 font-mono text-[13px] text-gray-400 leading-relaxed shadow-inner">
                      "Develop a <span className="text-blue-400 font-bold">Task Management System</span> for high-scale firms. Apply <span className="text-purple-400">Drizzle schema</span> for relational data and <span className="text-green-400">WebSocket</span> sync."
                    </div>
                  </div>

                  <AnimatePresence>
                    {showRisk && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5"
                      >
                        <div className="flex gap-4">
                          <div className="p-2 bg-red-500/20 rounded-lg shrink-0 h-fit">
                            <AlertTriangle className="text-red-500" size={18} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-red-500 uppercase mb-1">Bottleneck Detected</p>
                            <p className="text-xs text-gray-500 leading-relaxed">
                              Standard pooling identified as failure point. <br />
                              <span className="text-white font-bold underline decoration-red-500/50">Auto-injecting WebSocket failover.</span>
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="pt-4">
                    {!isPlaying && (
                      <button 
                        onClick={startDemo} 
                        className="w-full py-4 bg-white text-black font-black text-xs uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 hover:bg-blue-50 transition-all shadow-xl active:scale-[0.98]"
                      >
                        {currentStep > 0 ? <><RefreshCcw size={16} /> Re-Run Analysis</> : <><Play size={16} fill="black" /> Initialize Simulation</>}
                      </button>
                    )}
                  </div>
                </div>

                {/* Right: Steps Progression */}
                <div className="lg:col-span-3 space-y-3">
                  {DEMO_STEPS.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isActive = index === currentStep;

                    return (
                      <motion.div
                        key={step.id}
                        initial={false}
                        animate={{ 
                          opacity: index <= currentStep ? 1 : 0.2,
                          x: isActive ? 10 : 0,
                          scale: isActive ? 1.01 : 1
                        }}
                        className={`p-5 rounded-2xl border transition-all duration-500 ${
                          isActive ? "bg-blue-600/5 border-blue-500/30 shadow-[0_0_20px_rgba(37,99,235,0.05)]" : "bg-white/[0.02] border-white/5"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`mt-0.5 w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 transition-colors duration-500 ${isCompleted ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" : "bg-white/5 text-gray-600"}`}>
                            {isCompleted ? <CheckCircle2 size={14} /> : step.id}
                          </div>
                          <div className="flex-1">
                            <h4 className={`text-xs font-black uppercase tracking-widest ${isActive ? "text-blue-400" : "text-gray-400"}`}>
                              {step.title}
                            </h4>
                            {index <= currentStep && (
                              <p className="text-[11px] text-gray-500 mt-1 font-medium leading-relaxed">{step.desc}</p>
                            )}
                          </div>
                          {isActive && isPlaying && (
                            <div className="flex gap-1 pt-1.5">
                              <span className="w-1 h-1 bg-blue-500 rounded-full animate-ping" />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 bg-black border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6 text-[10px] text-gray-500 font-black uppercase tracking-tighter">
                <span className="flex items-center gap-2"><ShieldAlert size={14} className="text-green-500" /> Secure Protocol</span>
                <span className="flex items-center gap-2"><Code2 size={14} className="text-blue-500" /> Edge Optimized</span>
              </div>
              <Link href="/playground" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-10 py-4 bg-blue-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:bg-blue-500 hover:-translate-y-1 active:scale-95">
                  Launch Environment
                </button>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}