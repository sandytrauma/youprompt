"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldAlert, 
  X, 
  BrainCircuit, 
  Activity, 
  AlertTriangle 
} from "lucide-react";

interface RiskPopupProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
}

export function RiskPopup({ isOpen, onClose, content }: RiskPopupProps) {
  // Prevent background scrolling when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle Escape key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop with heavy blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/90 backdrop-blur-xl cursor-pointer"
          />
          
          {/* Modal Content Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40, rotateX: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40, rotateX: 15 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className="relative w-full max-w-2xl outline-none"
          >
            {/* Scrollable Internal Box */}
            <div className="relative bg-[#0d0d0e] border border-red-500/30 rounded-[2rem] md:rounded-[3rem] shadow-[0_0_80px_rgba(239,68,68,0.15)] overflow-hidden max-h-[85vh] md:max-h-[90vh] flex flex-col">
              
              {/* Fixed Neural Glows */}
              <div className="absolute -top-24 -right-24 w-64 h-64 md:w-96 md:h-96 bg-red-600/5 blur-[80px] md:blur-[100px] pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 md:w-96 md:h-96 bg-blue-600/5 blur-[80px] md:blur-[100px] pointer-events-none" />

              {/* Close Button */}
              <button 
                onClick={onClose}
                aria-label="Close dialog"
                className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-gray-500 hover:text-white z-20"
              >
                <X size={18} className="md:w-5 md:h-5" />
              </button>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar relative z-10">
                <div className="flex flex-col gap-6 md:gap-8">
                  
                  {/* Header */}
                  <div className="flex items-start md:items-center gap-4">
                    <div className="w-10 h-10 md:w-14 md:h-14 bg-red-500/10 rounded-xl md:rounded-2xl flex items-center justify-center border border-red-500/20 shrink-0">
                      <ShieldAlert className="text-red-500 w-6 h-6 md:w-7 md:h-7" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-3xl font-bold tracking-tight leading-tight">
                        Emergent <span className="text-red-500">Risk Analysis</span>
                      </h2>
                      <p className="text-gray-500 text-[8px] md:text-[10px] font-mono uppercase tracking-[0.2em] md:tracking-[0.3em] mt-1">Neural Engine Active</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex items-center justify-between text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                      <span>Threat Level</span>
                      <span className="text-red-500 font-black">Elevated (88%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "88%" }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-red-600 to-orange-500" 
                      />
                    </div>
                  </div>

                  {/* Dynamic Content Area */}
                  <div className="bg-red-500/5 border border-red-500/10 rounded-[1.25rem] md:rounded-[2rem] p-5 md:p-6 relative group hover:border-red-500/30 transition-all duration-500">
                    <div className="flex items-center gap-2 text-red-400 text-[10px] md:text-xs font-bold uppercase mb-3 md:mb-4">
                      <AlertTriangle size={12} className="md:w-3.5 md:h-3.5" /> Critical Architectural Warning
                    </div>
                    <p className="text-gray-200 text-xs md:text-sm leading-relaxed font-medium whitespace-pre-wrap italic">
                      "{content || "Our engine is analyzing specific edge-case vulnerabilities for this architecture..."}"
                    </p>
                  </div>

                  {/* Insight Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div className="p-4 md:p-5 bg-white/[0.03] border border-white/5 rounded-[1.25rem] flex items-center md:items-start md:flex-col gap-3 md:gap-2 group/card transition-colors hover:bg-white/[0.05]">
                      <BrainCircuit className="text-blue-400 shrink-0 group-hover/card:scale-110 transition-transform" size={18}/>
                      <span className="text-[10px] md:text-xs text-gray-400 leading-tight">Predictive Scalability Bottlenecks Logged.</span>
                    </div>
                    <div className="p-4 md:p-5 bg-white/[0.03] border border-white/5 rounded-[1.25rem] flex items-center md:items-start md:flex-col gap-3 md:gap-2 group/card transition-colors hover:bg-white/[0.05]">
                      <Activity className="text-purple-400 shrink-0 group-hover/card:scale-110 transition-transform" size={18}/>
                      <span className="text-[10px] md:text-xs text-gray-400 leading-tight">Cross-service Auth Vulnerability Check.</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={onClose}
                    className="w-full py-4 md:py-5 bg-white text-black font-black text-[11px] md:text-sm uppercase tracking-widest rounded-xl md:rounded-2xl hover:bg-red-50 transition-all hover:scale-[1.01] active:scale-[0.98] shadow-[0_20px_40px_rgba(0,0,0,0.3)] mt-2"
                  >
                    I acknowledge the risks
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}