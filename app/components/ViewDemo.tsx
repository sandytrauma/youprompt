"use client";

import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentStep < DEMO_STEPS.length) {
      interval = setInterval(() => {
        setCurrentStep((prev) => prev + 1);
        if (currentStep === 2) setShowRisk(true);
      }, 1200);
    } else {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentStep]);

  const startDemo = () => {
    setCurrentStep(0);
    setShowRisk(false);
    setIsPlaying(true);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-[#0a0a0a]/90 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="relative w-full max-w-5xl bg-[#111] border border-white/10 rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-1.5 rounded-lg">
                  <Zap size={18} fill="white" />
                </div>
                <h3 className="font-bold text-lg">Interactive Workflow Demo</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
              <div className="grid lg:grid-cols-5 gap-8">
                {/* Left: Input */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <div className="flex items-center gap-2 text-blue-400 mb-4">
                      <Terminal size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">The Input Vibe</span>
                    </div>
                    <div className="bg-black border border-white/10 rounded-2xl p-5 font-mono text-sm text-gray-300 leading-relaxed shadow-inner">
                      "Create a <span className="text-blue-400">Task Management System</span> for an advocate firm. Needs a <span className="text-purple-400">Drizzle schema</span> for clients, real-time <span className="text-green-400">inquiry tracking</span>, and automated <span className="text-yellow-400">document status</span> updates."
                    </div>
                  </div>

                  <AnimatePresence>
                    {showRisk && (
                      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
                        <div className="flex gap-4">
                          <AlertTriangle className="text-red-500 shrink-0" size={20} />
                          <div>
                            <p className="text-xs font-bold text-red-400 uppercase mb-1">Emergent Risk Found</p>
                            <p className="text-xs text-gray-400 leading-snug">
                              Standard DB pooling will lag under high load.
                              <span className="text-red-400 block mt-2 font-bold underline italic">Fix: Step 3 updated with WebSocket architecture.</span>
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!isPlaying && currentStep === 0 && (
                    <button onClick={startDemo} className="w-full py-4 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-all shadow-lg">
                      <Play size={18} fill="currentColor" /> Run Simulation
                    </button>
                  )}
                  
                  {currentStep === DEMO_STEPS.length && (
                    <button onClick={startDemo} className="w-full py-4 bg-white/5 border border-white/10 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all">
                      <RefreshCcw size={18} /> Restart Demo
                    </button>
                  )}
                </div>

                {/* Right: Steps */}
                <div className="lg:col-span-3 space-y-3">
                  {DEMO_STEPS.map((step, index) => (
                    <motion.div
                      key={step.id}
                      animate={{ 
                        opacity: index <= currentStep ? 1 : 0.3,
                        scale: index === currentStep ? 1.02 : 1,
                        x: index === currentStep ? 8 : 0
                      }}
                      className={`p-4 rounded-2xl border transition-all ${
                        index === currentStep ? "bg-blue-600/10 border-blue-500/40" : "bg-white/[0.02] border-white/[0.05]"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${index < currentStep ? "bg-blue-600 text-white" : "bg-white/10 text-gray-500"}`}>
                          {index < currentStep ? <CheckCircle2 size={14} /> : step.id}
                        </div>
                        <div className="flex-1">
                          <h4 className={`text-sm font-bold ${index === currentStep ? "text-blue-400" : "text-gray-300"}`}>{step.title}</h4>
                          {index <= currentStep && <p className="text-xs text-gray-500 mt-1">{step.desc}</p>}
                        </div>
                        {index === currentStep && isPlaying && (
                          <div className="flex gap-1 pt-1">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-white/[0.02] border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                <span className="flex items-center gap-1.5"><ShieldAlert size={14} className="text-green-500" /> Architecture Verified</span>
                <span className="flex items-center gap-1.5"><Code2 size={14} className="text-purple-500" /> Next.js Optimized</span>
              </div>
              <Link href="/playground" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-bold rounded-xl transition-all shadow-lg">
                  Start Coding This Project
                </button>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}