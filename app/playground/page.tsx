"use client";

import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  createNewVibe, 
  getVibeHistory, 
  updateVibeVersion, 
  getAllUserInquiries 
} from "@/app/actions/workflow"; 
import { 
  Loader2, Send, Cpu, Layers, RotateCcw, 
  Globe, ExternalLink, LogOut, ShieldCheck, 
  ChevronRight, Sparkles, ToyBrick, Zap,
  AlertCircle, Menu, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RiskPopup } from "../components/RiskPopup";

interface Step {
  objective: string;
  procedures: string[];
  precisePrompt: string;
}

export default function Playground() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // UI States
  const [activeTab, setActiveTab] = useState<"workflow" | "emergent">("workflow");
  const [mounted, setMounted] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  
  // Data States
  const [steps, setSteps] = useState<Step[]>([]);
  const [emergentContent, setEmergentContent] = useState<string>("");
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [currentInquiryId, setCurrentInquiryId] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [promptInput, setPromptInput] = useState("");

  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);

  const isAdmin = session?.user?.role === "admin";

  useEffect(() => { setMounted(true); }, []);

  // 1. Fetch History on Load
  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await getAllUserInquiries();
        if (data) setHistory(data);
      } catch (error) {
        console.error("History fetch failed", error);
      } finally {
        setIsInitialLoad(false);
      }
    }
    if (status === "authenticated" && mounted) loadHistory();
  }, [status, mounted]);

  useEffect(() => {
    if (isRiskModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isRiskModalOpen]);

  // 2. Handle History Selection
  async function handleSelectHistory(id: string) {
    if (isLoading) return;
    setSelectedStep(null);
    setIsLoading(true);
    setIsLeftSidebarOpen(false); // Close drawer on mobile

    try {
      const result = await getVibeHistory(id);
      if (result) {
        setSteps(result.steps as Step[]);
        setEmergentContent(result.emergentContent || "");
        setCurrentInquiryId(id);
        setCurrentVersion(result.version ?? 1);
        setPromptInput("");
      }
    } catch (error) {
      console.error("Failed to load vibe history", error);
    } finally {
      setIsLoading(false);
    }
  }

  // 3. Handle Submission
  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!promptInput.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const result = currentInquiryId 
        ? await updateVibeVersion(currentInquiryId, promptInput, currentVersion)
        : await createNewVibe(promptInput);
      
      if (result.success) {
        setSteps(result.steps as Step[]);
        setEmergentContent(result.emergentContent || "");
        setCurrentVersion(result.version ?? (currentInquiryId ? currentVersion + 1 : 1));
        
        if (!currentInquiryId) {
          setCurrentInquiryId(result.inquiryId ?? null);
          const updatedHistory = await getAllUserInquiries();
          setHistory(updatedHistory);
        }
        
        setPromptInput("");
        setSelectedStep(0);

        if (result.emergentContent) {
          setTimeout(() => {
            setIsRiskModalOpen(true);
          }, 500);
        }
      }
    } catch (error) {
      console.error("Submission failed", error);
    } finally {
      setIsLoading(false);
    }
  }

  if (!mounted || status === "loading") {
    return (
      <div className="h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  const platforms = [
    { name: "Gemini", url: "https://aistudio.google.com/", color: "text-blue-400" },
    { name: "v0.dev", url: "https://v0.dev/", color: "text-pink-400" },
    { name: "Bolt.new", url: "https://bolt.new/", color: "text-orange-400" },
    { name: "Claude", url: "https://claude.ai/", color: "text-orange-200" }
  ];

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden font-[family-name:var(--font-geist-sans)] relative">
      
      {/* MOBILE HEADER */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#111111]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 z-[50]">
        <button onClick={() => setIsLeftSidebarOpen(true)} className="p-2 hover:bg-white/5 rounded-lg text-gray-400">
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-widest">
          <Cpu size={16} className="text-blue-500"/> YouPrompt
        </div>
        <button onClick={() => setIsRightSidebarOpen(true)} className="p-2 hover:bg-white/5 rounded-lg text-blue-400">
          <Zap size={20} />
        </button>
      </header>

      {/* LEFT SIDEBAR (Desktop + Mobile Drawer) */}
      <aside className={`
        fixed inset-y-0 left-0 z-[100] w-72 bg-[#111111] border-r border-white/5 flex flex-col p-4 transition-transform duration-300 transform
        ${isLeftSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0 md:flex md:w-64 md:shrink-0
      `}>
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-2 font-bold text-lg">
            <div className="bg-blue-600 p-1 rounded-md"><Cpu size={16}/></div>
            YouPrompt
          </div>
          <button onClick={() => setIsLeftSidebarOpen(false)} className="md:hidden p-2 text-gray-500"><X size={20}/></button>
        </div>
        
        {isAdmin && (
          <div className="flex p-1 bg-black/40 rounded-xl mb-6 border border-white/5">
            <button className="flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-tight rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20">
              <Layers size={12} /> Playground
            </button>
            <button onClick={() => router.push("/admin")} className="flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-tight rounded-lg text-gray-500 hover:text-white transition-all">
              <ShieldCheck size={12} /> Admin
            </button>
          </div>
        )}

        <button 
          onClick={() => { setCurrentInquiryId(null); setSteps([]); setEmergentContent(""); setPromptInput(""); setSelectedStep(null); setIsLeftSidebarOpen(false); }}
          className="mb-6 flex items-center justify-center gap-2 w-full p-3 rounded-xl bg-white text-black font-semibold text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
        >
          <Layers size={16} /> New Vibe
        </button>

        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest px-2 mb-4">History</h2>
        <div className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
          {history.map((item) => (
            <button 
              key={item.id}
              onClick={() => handleSelectHistory(item.id)}
              className={`w-full text-left p-3 rounded-xl border text-xs truncate transition-all ${
                currentInquiryId === item.id 
                ? "bg-blue-600/10 border-blue-600/30 text-blue-400" 
                : "bg-white/5 border-transparent hover:border-white/10"
              }`}
            >
              {item.title || "Untitled Vibe"}
            </button>
          ))}
        </div>

        <div className="mt-auto pt-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-[10px] font-bold shrink-0">
              {session?.user?.name?.[0] || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{session?.user?.name}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-tighter">{session?.user?.role}</p>
            </div>
          </div>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex items-center justify-between w-full p-3 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-red-400 transition-all text-xs font-medium">
            <div className="flex items-center gap-2"><LogOut size={14} /> Sign Out</div>
          </button>
        </div>
      </aside>

      {/* CENTER: Main Canvas */}
      <main className="flex-1 flex flex-col items-center relative overflow-hidden bg-[#0d0d0d] pt-16 md:pt-0">
        <div className="w-full max-w-2xl flex-1 overflow-y-auto py-8 md:py-12 px-4 md:px-6 pb-32 space-y-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {steps.length > 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 md:space-y-8">
                {steps.map((step, i) => (
                  <motion.div 
                    key={i}
                    onClick={() => { setSelectedStep(i); if(window.innerWidth < 768) setIsRightSidebarOpen(true); }}
                    className={`p-5 md:p-6 rounded-3xl border transition-all cursor-pointer ${
                      selectedStep === i ? "bg-[#161617] border-blue-500/50" : "bg-transparent border-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full uppercase">Step {i + 1}</span>
                        {selectedStep === i && <ChevronRight size={14} className="text-blue-500 md:hidden"/>}
                    </div>
                    <h3 className="text-lg md:text-xl font-medium mb-4">{step.objective}</h3>
                    <div className="bg-black/40 p-4 rounded-xl font-mono text-[11px] text-gray-400 border border-white/5 break-words">
                      {step.precisePrompt}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-20 mt-12 md:mt-20">
                <Layers size={64} className="mb-6" />
                <p className="text-xl md:text-2xl italic font-light tracking-tight px-4">The canvas is empty.<br/>Describe your vibe below.</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating Input Area */}
        <div className="w-full max-w-2xl absolute bottom-6 md:bottom-8 px-4 md:px-6 z-[40]">
          <form onSubmit={handleSubmit} className="relative group">
            <input 
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder={currentInquiryId ? "Suggest changes..." : "Describe your vibe..."}
              className="w-full bg-[#161617] rounded-full py-4 md:py-5 px-6 md:px-8 pr-14 md:pr-16 outline-none border border-white/10 focus:border-blue-500/50 transition-all shadow-2xl text-sm"
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !promptInput.trim()} className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 p-2.5 md:p-3 bg-white text-black rounded-full hover:scale-105 transition-all">
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : currentInquiryId ? <RotateCcw size={18} /> : <Send size={18} />}
            </button>
          </form>
        </div>
      </main>

      {/* RIGHT SIDEBAR (Desktop + Mobile Drawer) */}
      <aside className={`
        fixed inset-y-0 right-0 z-[100] w-80 bg-[#111111] border-l border-white/5 flex flex-col transition-transform duration-300 transform
        ${isRightSidebarOpen ? "translate-x-0" : "translate-x-full"}
        md:relative md:translate-x-0 md:flex md:w-80 md:shrink-0
      `}>
        <div className="flex items-center justify-between p-4 md:hidden border-b border-white/5">
           <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Builder Hub</h2>
           <button onClick={() => setIsRightSidebarOpen(false)} className="p-2 text-gray-500"><X size={20}/></button>
        </div>

        {/* Tabs Header */}
        <div className="flex p-2 gap-2 bg-black/20 border-b border-white/5">
          <button 
            onClick={() => setActiveTab("workflow")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'workflow' ? 'bg-white/5 text-white shadow-inner border border-white/10' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <ToyBrick size={14} /> Workflow
          </button>
          <button 
            onClick={() => setActiveTab("emergent")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'emergent' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Sparkles size={14} /> Emergent
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === "workflow" ? (
              <motion.div key="workflow" initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <h2 className="hidden md:block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Builder Tools</h2>
                {selectedStep !== null ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                      <p className="text-xs text-gray-400 leading-relaxed italic">
                        Step {selectedStep + 1} is ready. Launch a platform to begin:
                      </p>
                    </div>
                    {platforms.map((p) => (
                      <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-blue-500/30 transition-all group">
                        <div className="flex items-center gap-3">
                          <Globe size={16} className={p.color} />
                          <span className="text-xs font-medium">{p.name}</span>
                        </div>
                        <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 opacity-30">
                    <AlertCircle className="mx-auto mb-2" size={20} />
                    <p className="text-xs italic">Select a step to unlock tools</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="emergent" initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="p-5 rounded-3xl bg-blue-600/5 border border-blue-500/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><Zap size={40} className="text-blue-500" /></div>
                  <h3 className="text-blue-400 font-bold text-[10px] uppercase tracking-widest mb-3">Neural Analysis</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {emergentContent || "Awaiting input to generate intelligence."}
                  </p>
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Heuristic Insights</h4>
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-[11px] text-gray-500 leading-relaxed">
                    Emergent AI monitors (V{currentVersion}) to suggest invisible optimizations.
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* Backdrop for Mobile Drawers */}
      {(isLeftSidebarOpen || isRightSidebarOpen) && (
        <div 
          onClick={() => { setIsLeftSidebarOpen(false); setIsRightSidebarOpen(false); }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] md:hidden"
        />
      )}

      <RiskPopup 
        isOpen={isRiskModalOpen} 
        onClose={() => setIsRiskModalOpen(false)} 
        content={emergentContent} 
      />
    </div>
  );
}