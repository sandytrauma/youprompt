/**
 * Copyright 2026 Sandeep Kumar
 * YouPrompt Workflow Engine v3.7 - FULL PRODUCTION MASTER
 * Features: Admin Switcher, RAG Context Visualization, Full VibeBridge, Credit Sync, Social Share
 */

"use client";

import { useState, useEffect, Suspense, useCallback, useMemo } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { 
  createNewVibe, 
  getVibeHistory, 
  updateVibeVersion, 
  getAllUserInquiries,
  getRelevantContext, 
  type ActionResponse
} from "@/app/actions/workflow"; 
import { saveToCodeVault } from "@/app/actions/vault";
import { publishToExplore } from "@/app/actions/social";
import { sanitizeInput } from "@/lib/sanitizer"; 
import { 
  Loader2, Send, Cpu, Layers, RotateCcw, 
  Globe, LogOut, ShieldCheck, 
  ChevronRight, Sparkles, ToyBrick, Zap,
  Menu, X, Copy, Check, PlusCircle,
  Settings, Terminal, Share2, CreditCard,
  LayoutDashboard, ExternalLink, Box, ShieldAlert, Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RiskPopup } from "../components/RiskPopup";
import { toast } from "sonner";
import Link from "next/link";

// --- TYPES ---
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

interface ExtendedUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
  credits?: number;
}

// --- VIBE BRIDGE COMPONENT ---
function VibeBridge({ fullPrompt, title, steps, version }: { fullPrompt: string; title: string; steps: Step[]; version: number }) {
  const [isArchiving, setIsArchiving] = useState(false);

  const shipToTool = async (url: string, toolName: string) => {
    if (!fullPrompt || steps.length === 0) {
      toast.error("No vibe generated yet!");
      return;
    }

    setIsArchiving(true);
    await navigator.clipboard.writeText(fullPrompt);
    
    try {
      const vaultRes = await saveToCodeVault({
        title: `${title || 'Blueprint'} (v${version})`,
        content: fullPrompt,
        category: "technical"
      });

      if (vaultRes.success) {
        toast.success("Archived in Vault", {
          description: `Blueprint synced for ${toolName}.`,
          icon: <ShieldCheck size={12} className="text-green-500" />
        });
      }
    } catch (err) {
      console.error("Vault Error:", err);
    } finally {
      setIsArchiving(false);
    }

    toast.success(`Opening ${toolName}...`, { description: "Paste the prompt to start building." });
    setTimeout(() => window.open(url, "_blank"), 800);
  };

  const bridgeTools = [
    { name: "v0.dev", url: "https://v0.dev", icon: <Terminal size={14} />, color: "text-pink-500", border: "hover:border-pink-500/50" },
    { name: "Bolt.new", url: "https://bolt.new", icon: <Zap size={14} />, color: "text-orange-500", border: "hover:border-orange-500/50" },
    { name: "Cursor", url: "https://cursor.com", icon: <Cpu size={14} />, color: "text-cyan-400", border: "hover:border-cyan-500/50" },
    { name: "Lovable", url: "https://lovable.dev", icon: <Box size={14} />, color: "text-yellow-400", border: "hover:border-yellow-500/50" },
  ];

  return (
    <div className="space-y-3 px-2">
      <h3 className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-1 flex items-center justify-between">
        Deploy to IDE {isArchiving && <Loader2 size={10} className="animate-spin" />}
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {bridgeTools.map((tool) => (
          <button 
            key={tool.name}
            onClick={() => shipToTool(tool.url, tool.name)}
            disabled={steps.length === 0 || isArchiving}
            className={`flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 transition-all group ${tool.border} disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tighter">
              <span className={tool.color}>{tool.icon}</span> {tool.name}
            </div>
            <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 text-gray-500" />
          </button>
        ))}
      </div>
    </div>
  );
}

// --- MAIN PLAYGROUND CONTENT ---
function PlaygroundContent() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Tabs and Layout State
  const [activeTab, setActiveTab] = useState<"workflow" | "emergent" | "context">("workflow");
  const [mounted, setMounted] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  
  // Business Logic State
  const [steps, setSteps] = useState<Step[]>([]);
  const [emergentContent, setEmergentContent] = useState<string>("");
  const [rawContext, setRawContext] = useState<string>(""); 
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStep, setSelectedStep] = useState<number | undefined>(undefined);
  const [currentInquiryId, setCurrentInquiryId] = useState<string | undefined>(undefined);
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [promptInput, setPromptInput] = useState("");
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [adminMode, setAdminMode] = useState(false);

  const user = session?.user as ExtendedUser;
  const userCredits = user?.credits ?? 0;
  const isAdmin = user?.role === "admin";
  const isBypassed = isAdmin && adminMode;

 useEffect(() => {
  setMounted(true);
  
  if (searchParams.get("success") === "true") {
    const syncSession = async () => {
      // Give the DB a moment to finalize the transaction
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Force NextAuth to re-run the JWT callback by passing a payload
      await update({ triggerSync: Date.now() });
      
      // Force a server-side data revalidation
      router.refresh();
      
      toast.success("Credits Refilled!", {
        description: "Database and Session are now in sync."
      });
    };

    syncSession();
  }
}, [searchParams, update, router]);

  const loadAllData = useCallback(async () => {
    if (status !== "authenticated") return;
    try {
      const [historyData, contextData] = await Promise.all([
        getAllUserInquiries(),
        getRelevantContext(session?.user?.id as string)
      ]);
      if (historyData) setHistory(historyData as HistoryItem[]);
      if (contextData) setRawContext(contextData);
    } catch (err) {
      console.error("Data Load Error:", err);
    }
  }, [status, session]);

  useEffect(() => {
    if (mounted) loadAllData();
  }, [mounted, loadAllData]);

  const fullMasterPrompt = useMemo(() => {
    return steps.length > 0 
      ? `FULL ARCHITECTURE ROADMAP (v${currentVersion}):\n\n` + 
        steps.map((s, i) => `STEP ${i + 1} - ${s.objective.toUpperCase()}:\n${s.precisePrompt}`).join("\n\n")
      : "";
  }, [steps, currentVersion]);

  const currentTitle = useMemo(() => {
    return history.find(h => h.id === currentInquiryId)?.title || (steps[0]?.objective) || "Architecture Blueprint";
  }, [history, currentInquiryId, steps]);

  const handleCopyMasterPrompt = async () => {
    if (!fullMasterPrompt) return;
    await navigator.clipboard.writeText(fullMasterPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Blueprint Copied");
  };

  const handleShareVibe = async () => {
    if (!currentInquiryId) return;
    setShareLoading(true);
    try {
      const res = await publishToExplore(currentInquiryId);
      if (res.success) {
        await navigator.clipboard.writeText(`${window.location.origin}/explore`);
        toast.success("Published to Social Hub!", { description: "Link copied to clipboard." });
      }
    } finally { setShareLoading(false); }
  };

  async function handleSelectHistory(id: string) {
    if (isLoading) return;
    setIsLoading(true);
    setIsLeftSidebarOpen(false); 
    try {
      const result = await getVibeHistory(id);
      if (result) {
        setSteps(result.steps as Step[]);
        setEmergentContent(result.emergentContent || "");
        setCurrentInquiryId(id);
        setCurrentVersion(result.version ?? 1);
        setSelectedStep(0);
      }
    } finally { setIsLoading(false); }
  }

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!promptInput.trim() || isLoading) return;

    if (userCredits <= 0 && !isBypassed) {
      toast.error("Insufficient Credits", {
        description: "Please refill to continue architecting.",
        action: { label: "Refill", onClick: () => router.push("/refill") },
      });
      return;
    }

    setIsLoading(true);
    const cleanPrompt = sanitizeInput(promptInput, "text");

    try {
      const result = currentInquiryId 
        ? await updateVibeVersion(currentInquiryId, cleanPrompt, currentVersion)
        : await createNewVibe(cleanPrompt);
      
      if (result.success) {
        router.refresh(); 
        await update(); 

        setSteps(result.steps as Step[]);
        setEmergentContent(result.emergentContent || "");
        setCurrentVersion(result.version ?? (currentInquiryId ? currentVersion + 1 : 1));
        
        if (!currentInquiryId) {
          setCurrentInquiryId(result.inquiryId ?? undefined);
          loadAllData(); 
        }
        
        setPromptInput("");
        setSelectedStep(0);
        if (result.emergentContent) setTimeout(() => setIsRiskModalOpen(true), 500);
        toast.success("Vibe Synthesized", { description: `-1 Credit Applied` });
      } else {
        toast.error(result.error || "Synthesis Failed");
      }
    } catch (error) {
      toast.error("Critical Synthesis Error");
    } finally {
      setIsLoading(false);
    }
  }

  const platforms = [
    { name: "v0.dev", url: "https://v0.dev/", color: "text-pink-400" },
    { name: "Bolt.new", url: "https://bolt.new/", color: "text-orange-400" },
    { name: "Cursor", url: "https://cursor.com/", color: "text-cyan-400" },
    { name: "Claude", url: "https://claude.ai/", color: "text-orange-200" }
  ];

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden relative">
      
      {/* MOBILE HEADER */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#111111]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 z-[50]">
        <button onClick={() => setIsLeftSidebarOpen(true)} className="p-2 text-gray-400"><Menu size={20} /></button>
        <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-widest"><Cpu size={16} className="text-blue-500"/> YouPrompt</div>
        <button onClick={() => setIsRightSidebarOpen(true)} className="p-2 text-blue-400"><Zap size={20} /></button>
      </header>

      {/* LEFT SIDEBAR: NAVIGATION & HISTORY */}
      <aside className={`fixed inset-y-0 left-0 z-[100] w-72 bg-[#111111] border-r border-white/5 flex flex-col p-4 transition-transform duration-300 transform ${isLeftSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 md:flex md:w-64`}>
        <div className="mb-6 flex items-center gap-2 px-2">
            <div className="bg-blue-600 p-1.5 rounded-lg"><Cpu size={18} className="text-white" /></div>
            <span className="font-black text-lg tracking-tighter uppercase">YouPrompt</span>
        </div>

        <nav className="mb-6 space-y-1">
          <Link href="/explore" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:bg-white/5">
            <Globe size={16} /> Community
          </Link>
          <Link href="/playground" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-white/5 text-white border border-white/10">
            <Terminal size={16} /> Playground
          </Link>
          {/* ADMIN DASHBOARD LINK */}
          {isAdmin && (
            <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-bold uppercase text-orange-400 hover:bg-orange-500/5 transition-all">
              <ShieldCheck size={16} /> Admin Panel
            </Link>
          )}
          <Link 
    href="/refill" 
    className="flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-bold uppercase text-green-400 hover:bg-green-500/5 transition-all border border-transparent hover:border-green-500/20"
  >
    <CreditCard size={16} /> Refill Credits
  </Link>
        </nav>
    
        {isAdmin && (
          <button onClick={() => setAdminMode(!adminMode)} className={`mb-4 flex items-center justify-between w-full p-3 rounded-xl border text-[10px] font-bold uppercase transition-all ${adminMode ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-white/5 border-white/10 text-gray-500"}`}>
            <div className="flex items-center gap-2"><ShieldAlert size={14} /> {adminMode ? "Bypass On" : "Standard"}</div>
            <div className={`w-8 h-4 rounded-full relative transition-colors ${adminMode ? "bg-green-500" : "bg-gray-700"}`}>
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${adminMode ? "left-[1.125rem]" : "left-0.5"}`} />
            </div>
          </button>
        )}

        <button onClick={() => { setCurrentInquiryId(undefined); setSteps([]); setEmergentContent(""); setPromptInput(""); }} className="mb-6 flex items-center justify-center gap-2 w-full p-3 rounded-xl bg-white text-black font-bold text-sm hover:scale-[1.02] transition-all">
          <PlusCircle size={16} /> New Vibe
        </button>

        <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2 mb-4">History</h2>
        <div className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
          {history.map((item) => (
            <button key={item.id} onClick={() => handleSelectHistory(item.id)} className={`w-full text-left p-3 rounded-xl border text-xs truncate transition-all ${currentInquiryId === item.id ? "bg-blue-600/10 border-blue-600/30 text-blue-400" : "bg-white/5 border-transparent hover:border-white/10"}`}>
              {item.title || "Untitled Blueprint"}
            </button>
          ))}
        </div>

        <div className="mt-auto pt-4 border-t border-white/5">
            <div className="flex items-center gap-3 px-2 py-3 mb-2">
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-xs font-bold border border-white/10">{user?.name?.[0]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold truncate">{user?.name}</p>
                <p className="text-[9px] text-blue-400 font-black uppercase">{isBypassed ? "∞" : userCredits} Credits</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => router.push("/profile")} className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white/5 text-[10px] font-bold uppercase hover:bg-white/10 transition-all"><Settings size={14} /> Profile</button>
              <button onClick={() => signOut()} className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white/5 text-red-400 text-[10px] font-bold uppercase hover:bg-red-500/10 transition-all"><LogOut size={14} /> Exit</button>
            </div>
        </div>
      </aside>

      {/* MAIN CANVAS */}
      <main className="flex-1 flex flex-col items-center relative bg-[#0d0d0d] pt-16 md:pt-0">
        <div className="w-full max-w-2xl flex-1 overflow-y-auto py-8 md:py-12 px-4 pb-32 space-y-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {steps.length > 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {steps.map((step, i) => (
                  <div key={i} onClick={() => { setSelectedStep(i); if(window.innerWidth < 768) setIsRightSidebarOpen(true); }} className={`p-6 rounded-3xl border transition-all cursor-pointer ${selectedStep === i ? "bg-[#161617] border-blue-500/50" : "bg-transparent border-white/5 hover:border-white/10"}`}>
                    <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full uppercase mb-3 inline-block">Step {i + 1}</span>
                    <h3 className="text-lg font-medium mb-4">{step.objective}</h3>
                    <div className="bg-black/40 p-4 rounded-xl font-mono text-[11px] text-gray-400 border border-white/5 whitespace-pre-wrap">{step.precisePrompt}</div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-20 mt-20">
                <Layers size={64} className="mb-6" />
                <p className="text-xl italic font-light">Begin your architectural roadmap.</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* INPUT DOCK */}
        <div className="w-full max-w-2xl absolute bottom-6 px-4 z-[40]">
          <form onSubmit={handleSubmit} className="relative group">
            <input 
              value={promptInput} 
              onChange={(e) => setPromptInput(e.target.value)} 
              placeholder={currentInquiryId ? "Iterate on this vibe..." : "Describe your workflow vibe..."} 
              className={`w-full bg-[#161617] rounded-full py-5 px-8 pr-16 outline-none border transition-all shadow-2xl text-sm ${userCredits <= 0 && !isBypassed ? "border-red-500/30" : "border-white/10 focus:border-blue-500/50"}`} 
              disabled={isLoading} 
            />
            <button type="submit" disabled={isLoading || !promptInput.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white text-black hover:scale-110 active:scale-95 transition-all disabled:opacity-50">
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : currentInquiryId ? <RotateCcw size={18} /> : <Send size={18} />}
            </button>
          </form>
        </div>
      </main>

      {/* RIGHT SIDEBAR: TOOLS & KNOWLEDGE */}
      <aside className={`fixed inset-y-0 right-0 z-[100] w-80 bg-[#111111] border-l border-white/5 flex flex-col transition-transform duration-300 transform ${isRightSidebarOpen ? "translate-x-0" : "translate-x-full"} md:relative md:translate-x-0`}>
        <div className="p-4 border-b border-white/5 bg-white/[0.02] space-y-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Master Workflow</span>
              <div className="flex gap-2">
                {steps.length > 0 && (
                  <>
                    <button onClick={handleShareVibe} disabled={shareLoading} className="p-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white transition-all disabled:opacity-50">
                      {shareLoading ? <Loader2 size={12} className="animate-spin" /> : <Share2 size={12} />}
                    </button>
                    <button onClick={handleCopyMasterPrompt} className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-lg transition-all ${copied ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'bg-blue-600 text-white hover:bg-blue-500'}`}>
                      {copied ? <Check size={10} /> : <Copy size={10} />} {copied ? "Copied" : "Bundle"}
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="bg-black/40 rounded-xl p-3 border border-white/5 h-20 overflow-y-auto custom-scrollbar">
                <p className="text-[10px] font-mono text-gray-500 italic">
                  {steps.length > 0 ? fullMasterPrompt.substring(0, 200) + "..." : "Synthesis logic awaiting blueprinting."}
                </p>
            </div>

            <VibeBridge fullPrompt={fullMasterPrompt} title={currentTitle} steps={steps} version={currentVersion} />
        </div>

        <div className="flex p-2 gap-1 border-b border-white/5 bg-black/20">
          {(['workflow', 'emergent', 'context'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white/5 text-white border border-white/10 shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>
              {tab === 'workflow' && <ToyBrick size={11} className="inline mr-1 mb-0.5" />}
              {tab === 'emergent' && <Sparkles size={11} className="inline mr-1 mb-0.5" />}
              {tab === 'context' && <Eye size={11} className="inline mr-1 mb-0.5" />}
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === "workflow" ? (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Selected Deployment</h4>
                {selectedStep !== undefined ? platforms.map((p) => (
                  <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-blue-500/30 hover:bg-white/[0.05] transition-all group">
                    <div className="flex items-center gap-3">
                      <Globe size={16} className={p.color} />
                      <span className="text-xs font-medium">{p.name}</span>
                    </div>
                    <ExternalLink size={12} className="text-gray-500 group-hover:text-white transition-colors" />
                  </a>
                )) : <div className="py-20 flex flex-col items-center opacity-30 gap-3"><Terminal size={32}/><p className="text-xs italic">Select a step to deploy.</p></div>}
              </motion.div>
            ) : activeTab === "emergent" ? (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="p-5 rounded-3xl bg-blue-600/5 border border-blue-500/20 relative group">
                  <div className="absolute -top-px -left-px w-8 h-8 border-t border-l border-blue-500/50 rounded-tl-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <h3 className="text-blue-400 font-bold text-[10px] uppercase tracking-widest mb-3">System Analysis</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{emergentContent || "Synthesis engine ready for architectural logic..."}</p>
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="p-5 rounded-3xl bg-orange-600/5 border border-orange-500/20">
                  <h3 className="text-orange-400 font-black text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2"><ShieldCheck size={12}/> Knowledge Base</h3>
                  <div className="text-[10px] font-mono text-gray-500 leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5 h-64 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                    {rawContext || "No active RAG context data found for this session."}
                  </div>
                </div>
                <button onClick={loadAllData} className="w-full py-3 rounded-xl border border-orange-500/20 text-[9px] font-bold uppercase text-orange-400 hover:bg-orange-500/10 transition-all flex items-center justify-center gap-2">
                  <RotateCcw size={12} /> Sync Context Cache
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* MOBILE OVERLAYS */}
      {(isLeftSidebarOpen || isRightSidebarOpen) && (
        <div onClick={() => { setIsLeftSidebarOpen(false); setIsRightSidebarOpen(false); }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] md:hidden" />
      )}

      <RiskPopup isOpen={isRiskModalOpen} onClose={() => setIsRiskModalOpen(false)} content={emergentContent} />
    </div>
  );
}

export default function Playground() {
  return (
    <Suspense fallback={<div className="h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={32} /></div>}>
      <PlaygroundContent />
    </Suspense>
  );
}