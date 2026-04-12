"use client";

import { useState, useEffect, Suspense } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  createNewVibe, 
  getVibeHistory, 
  updateVibeVersion, 
  getAllUserInquiries,
} from "@/app/actions/workflow"; 
// 1. IMPORT the publish action
import { toggleVibeVisibility, publishToExplore } from "@/app/actions/social";
import { 
  Loader2, Send, Cpu, Layers, RotateCcw, 
  Globe, ExternalLink, LogOut, ShieldCheck, 
  ChevronRight, Sparkles, ToyBrick, Zap,
  AlertCircle, Menu, X, Copy, Check, PlusCircle,
  Settings, Terminal, Share2, Lock, Unlock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RiskPopup } from "../components/RiskPopup";
import { toast } from "sonner";
import Link from "next/link";

interface Step {
  objective: string;
  procedures: string[];
  precisePrompt: string;
}

interface HistoryItem {
  id: string;
  title: string | null;
  createdAt?: Date | null;
  isPublic?: boolean; 
}

export const dynamic = "force-dynamic";

function PlaygroundContent() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // UI States
  const [activeTab, setActiveTab] = useState<"workflow" | "emergent">("workflow");
  const [mounted, setMounted] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareLoading, setShareLoading] = useState(false); // New loading state for sharing
  const [shareCopied, setShareCopied] = useState(false);
  
  // Data States
  const [steps, setSteps] = useState<Step[]>([]);
  const [emergentContent, setEmergentContent] = useState<string>("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [currentInquiryId, setCurrentInquiryId] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [promptInput, setPromptInput] = useState("");
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);

  const isAdmin = session?.user?.role === "admin";
  const userCredits = (session?.user as any)?.credits ?? 0;

  useEffect(() => {
    setMounted(true);
    if (searchParams.get("success") === "true") {
      update();
      toast.success("Credits Refilled!", { description: "Your balance has been updated." });
    }
  }, [searchParams, update]);

  useEffect(() => {
    async function loadHistory() {
      if (status !== "authenticated") return;
      try {
        const data = await getAllUserInquiries();
        if (data) setHistory(data as HistoryItem[]);
      } catch (error) {
        console.error("History fetch failed", error);
      } finally {
        setIsInitialLoad(false);
      }
    }
    if (mounted) loadHistory();
  }, [status, mounted]);

  useEffect(() => {
    document.body.style.overflow = isRiskModalOpen ? 'hidden' : 'unset';
  }, [isRiskModalOpen]);

  const fullMasterPrompt = steps.length > 0 
    ? `FULL ARCHITECTURE ROADMAP (v${currentVersion}):\n\n` + 
      steps.map((s, i) => `STEP ${i + 1} - ${s.objective.toUpperCase()}:\n${s.precisePrompt}`).join("\n\n")
    : "";

  const handleCopyMasterPrompt = async () => {
    if (!fullMasterPrompt) return;
    try {
      await navigator.clipboard.writeText(fullMasterPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Prompt Copied", { description: "Ready to paste into your AI tool." });
    } catch (err) {
      toast.error("Copy failed");
    }
  };

  /**
   * UPDATED: handleShareVibe
   * Now actually publishes to the database AND copies the link.
   */
  const handleShareVibe = async () => {
    if (!currentInquiryId) return;
    
    setShareLoading(true);
    try {
      // 1. Publish to the 'vibes' table in Neon
      const res = await publishToExplore(currentInquiryId);
      
      if (res.success) {
        // 2. If DB update succeeded, copy the public link
        const shareUrl = `${window.location.origin}/explore`; // Or /view/${currentInquiryId} if you built that
        await navigator.clipboard.writeText(shareUrl);
        
        setShareCopied(true);
        toast.success("Published to Explore!", { description: "Link copied to clipboard." });
        setTimeout(() => setShareCopied(false), 3000);
      } else {
        toast.error(res.error || "Failed to publish");
      }
    } catch (error) {
      toast.error("An error occurred during sharing");
    } finally {
      setShareLoading(false);
    }
  };

  const handleVisibilityToggle = async () => {
    if (!currentInquiryId) return;
    toast.info("Visibility is managed via the 'Share' button.");
  };

  async function handleSelectHistory(id: string) {
    if (isLoading) return;
    setSelectedStep(null);
    setIsLoading(true);
    setIsLeftSidebarOpen(false); 

    try {
      const result = await getVibeHistory(id);
      if (result) {
        setSteps(result.steps as Step[]);
        setEmergentContent(result.emergentContent || "");
        setCurrentInquiryId(id);
        setCurrentVersion(result.version ?? 1);
        setIsPublic(!!result.isPublic);
        setPromptInput("");
      }
    } catch (error) {
      console.error("Failed to load vibe history", error);
      toast.error("Could not load history");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!promptInput.trim() || isLoading) return;

    if (userCredits <= 0 && !isAdmin) {
      toast.error("Insufficient Credits", {
        description: "Please refill your credits to continue.",
        action: { label: "Refill", onClick: () => router.push("/refill") },
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = currentInquiryId 
        ? await updateVibeVersion(currentInquiryId, promptInput, currentVersion)
        : await createNewVibe(promptInput);
      
      if (result.success) {
        await update(); 
        setSteps(result.steps as Step[]);
        setEmergentContent(result.emergentContent || "");
        setCurrentVersion(result.version ?? (currentInquiryId ? currentVersion + 1 : 1));
        
        if (!currentInquiryId) {
          setCurrentInquiryId(result.inquiryId ?? null);
          const updatedHistory = await getAllUserInquiries();
          setHistory(updatedHistory as HistoryItem[]);
        }
        
        setPromptInput("");
        setSelectedStep(0);
        if (result.emergentContent) setTimeout(() => setIsRiskModalOpen(true), 500);
      }
    } catch (error) {
      toast.error("Generation Failed");
    } finally {
      setIsLoading(false);
    }
  }

  const platforms = [
    { name: "Emergent", url: "https://app.emergent.sh/landing/", color: "text-cyan-400" },
    { name: "Gemini", url: "https://aistudio.google.com/", color: "text-blue-400" },
    { name: "v0.dev", url: "https://v0.dev/", color: "text-pink-400" },
    { name: "Bolt.new", url: "https://bolt.new/", color: "text-orange-400" },
    { name: "Claude", url: "https://claude.ai/", color: "text-orange-200" }
  ];

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden font-[family-name:var(--font-geist-sans)] relative">
      
      {/* Mobile Header */}
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

      {/* Left Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-[100] w-72 bg-[#111111] border-r border-white/5 flex flex-col p-4 transition-transform duration-300 transform ${isLeftSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 md:flex md:w-64 md:shrink-0`}>
        <div className="mb-6 flex items-center gap-2 px-2">
            <div className="bg-blue-600 p-1.5 rounded-lg"><Cpu size={18} className="text-white" /></div>
            <span className="font-black text-lg tracking-tighter uppercase">YouPrompt</span>
        </div>

        <div className="mb-6 space-y-1">
          <Link href="/explore" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:bg-white/5 hover:text-white transition-all">
            <Globe size={16} className="text-blue-400" /> Community Vibes
          </Link>
          <Link href="/playground" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-white/5 text-white border border-white/10">
            <Terminal size={16} className="text-blue-500" /> Playground
          </Link>
        </div>
    
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/10 border border-blue-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{isAdmin ? "System Access" : "Credits"}</span>
            <Zap size={12} className={isAdmin ? "text-yellow-400" : "text-blue-400"} />
          </div>
          <span className="text-2xl font-black">{isAdmin ? "Unlimited" : userCredits}</span>
        </div>

        <button onClick={() => { setCurrentInquiryId(null); setSteps([]); setEmergentContent(""); setPromptInput(""); setSelectedStep(null); }} className="mb-6 flex items-center justify-center gap-2 w-full p-3 rounded-xl bg-white text-black font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-lg">
          <PlusCircle size={16} /> New Vibe
        </button>

        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest px-2 mb-4">History</h2>
        <div className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
          {history.length > 0 ? history.map((item) => (
            <button key={item.id} onClick={() => handleSelectHistory(item.id)} className={`w-full text-left p-3 rounded-xl border text-xs truncate transition-all ${currentInquiryId === item.id ? "bg-blue-600/10 border-blue-600/30 text-blue-400" : "bg-white/5 border-transparent hover:border-white/10"}`}>
              {item.title || "Untitled Vibe"}
            </button>
          )) : <p className="text-[10px] text-gray-600 px-2 italic">No history yet</p>}
        </div>

        <div className="mt-auto pt-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-2 py-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-[10px] font-bold shrink-0 border border-white/10 overflow-hidden">
              {session?.user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold truncate">{session?.user?.name}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
              <button onClick={() => router.push("/profile")} className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-all">
                <Settings size={14} /> Profile
              </button>
              <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-red-400 text-[10px] font-bold uppercase tracking-widest transition-all">
                <LogOut size={14} /> Out
              </button>
          </div>
        </div>
      </aside>

      {/* Main Canvas */}
      <main className="flex-1 flex flex-col items-center relative overflow-hidden bg-[#0d0d0d] pt-16 md:pt-0">
        <div className="w-full max-w-2xl flex-1 overflow-y-auto py-8 md:py-12 px-4 md:px-6 pb-32 space-y-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {steps.length > 0 ? (
              <motion.div key="steps-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 md:space-y-8">
                {steps.map((step, i) => (
                  <motion.div key={i} onClick={() => { setSelectedStep(i); if(window.innerWidth < 768) setIsRightSidebarOpen(true); }} className={`p-5 md:p-6 rounded-3xl border transition-all cursor-pointer ${selectedStep === i ? "bg-[#161617] border-blue-500/50" : "bg-transparent border-white/5 hover:border-white/20"}`}>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full uppercase">Step {i + 1}</span>
                        {selectedStep === i && <ChevronRight size={14} className="text-blue-500 md:hidden"/>}
                    </div>
                    <h3 className="text-lg md:text-xl font-medium mb-4">{step.objective}</h3>
                    <div className="bg-black/40 p-4 rounded-xl font-mono text-[11px] text-gray-400 border border-white/5 break-words">{step.precisePrompt}</div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-20 mt-12 md:mt-20">
                <Layers size={64} className="mb-6" />
                <p className="text-xl md:text-2xl italic font-light tracking-tight px-4">Describe your vibe below to begin.</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating Input */}
        <div className="w-full max-w-2xl absolute bottom-6 md:bottom-8 px-4 md:px-6 z-[40]">
          <form onSubmit={handleSubmit} className="relative group">
            <input value={promptInput} onChange={(e) => setPromptInput(e.target.value)} placeholder={currentInquiryId ? "Suggest changes..." : "Describe your workflow vibe..."} className={`w-full bg-[#161617] rounded-full py-4 md:py-5 px-6 md:px-8 pr-14 md:pr-16 outline-none border transition-all shadow-2xl text-sm ${(userCredits <= 0 && !isAdmin) ? "border-red-500/30 text-gray-600" : "border-white/10 focus:border-blue-500/50"}`} disabled={isLoading || (userCredits <= 0 && !isAdmin)} />
            <button type="submit" disabled={isLoading || !promptInput.trim()} className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 p-2.5 md:p-3 rounded-full transition-all bg-white text-black">
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : currentInquiryId ? <RotateCcw size={18} /> : <Send size={18} />}
            </button>
          </form>
        </div>
      </main>

      {/* Right Sidebar - Builder Hub */}
      <aside className={`fixed inset-y-0 right-0 z-[100] w-80 bg-[#111111] border-l border-white/5 flex flex-col transition-transform duration-300 transform ${isRightSidebarOpen ? "translate-x-0" : "translate-x-full"} md:relative md:translate-x-0 md:flex md:w-80 md:shrink-0`}>
        <div className="flex items-center justify-between p-4 md:hidden border-b border-white/5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Builder Hub</h2>
            <button onClick={() => setIsRightSidebarOpen(false)} className="p-2 text-gray-500"><X size={20}/></button>
        </div>

        <div className="p-4 border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Master Workflow</span>
              <div className="flex gap-2">
                {steps.length > 0 && (
                  <>
                    <button onClick={handleShareVibe} disabled={shareLoading} className={`p-1.5 rounded-lg border transition-all ${shareCopied ? 'bg-green-600 border-green-600 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-blue-500/50'}`}>
                      {shareLoading ? <Loader2 size={12} className="animate-spin" /> : shareCopied ? <Check size={12} /> : <Share2 size={12} />}
                    </button>
                    <button onClick={handleCopyMasterPrompt} className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-lg transition-all ${copied ? 'bg-green-600/20 text-green-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                      {copied ? <Check size={10} /> : <Copy size={10} />}
                      {copied ? "Copied" : "Copy Full"}
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="bg-black/40 rounded-xl p-3 border border-white/5 h-24 overflow-y-auto custom-scrollbar mb-4">
                <p className="text-[10px] font-mono text-gray-500 leading-relaxed italic">
                  {steps.length > 0 ? fullMasterPrompt.substring(0, 150) + "..." : "Architectural prompt will appear here."}
                </p>
            </div>
        </div>

        <div className="flex p-2 gap-2 bg-black/20 border-b border-white/5">
          <button onClick={() => setActiveTab("workflow")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'workflow' ? 'bg-white/5 text-white border border-white/10' : 'text-gray-500 hover:text-gray-300'}`}>
            <ToyBrick size={14} /> Tools
          </button>
          <button onClick={() => setActiveTab("emergent")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'emergent' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-gray-500 hover:text-gray-300'}`}>
            <Sparkles size={14} /> Emergent
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === "workflow" ? (
              <motion.div key="tab-workflow" initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                {selectedStep !== null ? (
                  <div className="space-y-4">
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
                  <div className="text-center py-20 opacity-30 text-xs italic">Select a step to unlock tools</div>
                )}
              </motion.div>
            ) : (
              <motion.div key="tab-emergent" initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="p-5 rounded-3xl bg-blue-600/5 border border-blue-500/20 shadow-inner">
                  <h3 className="text-blue-400 font-bold text-[10px] uppercase tracking-widest mb-3">Neural Analysis</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{emergentContent || "Awaiting architectural generation..."}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {(isLeftSidebarOpen || isRightSidebarOpen) && (
        <div onClick={() => { setIsLeftSidebarOpen(false); setIsRightSidebarOpen(false); }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] md:hidden" />
      )}

      <RiskPopup isOpen={isRiskModalOpen} onClose={() => setIsRiskModalOpen(false)} content={emergentContent} />
    </div>
  );
}

export default function Playground() {
  return (
    <Suspense fallback={<div className="h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={32} /></div>}>
      <PlaygroundContent />
    </Suspense>
  );
}