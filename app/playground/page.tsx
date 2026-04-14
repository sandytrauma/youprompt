/**
 * Copyright 2026 Sandeep Kumar
 * Licensed under the Apache License, Version 2.0
 */

"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  getVibeHistory, 
  createNewVibe, 
  updateVibeVersion, 
  getAllUserInquiries 
} from "@/app/actions/workflow"; 
import { publishToExplore } from "@/app/actions/social";
import { 
  Loader2, Send, Cpu, Layers, RotateCcw, 
  Globe, LogOut, ShieldCheck, 
  ChevronRight, Sparkles, ToyBrick, Zap,
  Menu, X, Copy, Check, PlusCircle,
  Settings, Terminal, Share2, CreditCard,
  User, ShieldAlert, LayoutDashboard, ExternalLink, Box, Database
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RiskPopup } from "../components/RiskPopup";
import { toast } from "sonner";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { saveToCodeVault, getCodeVaultDocs } from "../actions/vault";

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

// --- VIBE BRIDGE COMPONENT ---
function VibeBridge({ fullPrompt, title }: { fullPrompt: string; title: string }) {
  const shipToTool = async (url: string, toolName: string) => {
    if (!fullPrompt) {
      toast.error("No vibe generated yet!");
      return;
    }

    await navigator.clipboard.writeText(fullPrompt);
    
    const vaultRes = await saveToCodeVault({
      title: title || "New Technical Blueprint",
      content: fullPrompt,
      category: "technical"
    });

    if (vaultRes.success) {
      toast.success("Blueprint Secured", {
        description: `Saved to Vault & opening ${toolName}`,
        icon: <ShieldCheck size={14} className="text-green-500" />
      });
    } else {
      console.error("Vaulting failed:", vaultRes.error);
      toast.error("Vault Sync Error", {
        description: "Prompt copied, but database update failed."
      });
    }

    setTimeout(() => window.open(url, "_blank"), 800);
  };

  const bridgeTools = [
    { name: "v0.dev", url: "https://v0.dev", icon: <Terminal size={14} />, color: "text-pink-500", border: "hover:border-pink-500/50" },
    { name: "Bolt.new", url: "https://bolt.new", icon: <Zap size={14} />, color: "text-orange-500", border: "hover:border-orange-500/50" },
    { name: "Cursor", url: "https://cursor.com", icon: <Cpu size={14} />, color: "text-cyan-400", border: "hover:border-cyan-500/50" },
    { name: "Lovable", url: "https://lovable.dev", icon: <Box size={14} />, color: "text-yellow-400", border: "hover:border-yellow-500/50" },
  ];

  return (
    <div className="space-y-4 px-2">
      <h3 className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-1">Deploy to IDE</h3>
      <div className="grid grid-cols-2 gap-3">
        {bridgeTools.map((tool) => (
          <button 
            key={tool.name}
            onClick={() => shipToTool(tool.url, tool.name)}
            className={`flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 transition-all group ${tool.border}`}
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

function PlaygroundContent() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // UI States
  const [activeTab, setActiveTab] = useState<"workflow" | "emergent">("workflow");
  const [mounted, setMounted] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  
  // Data States
  const [steps, setSteps] = useState<Step[]>([]);
  const [emergentContent, setEmergentContent] = useState<string>("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [currentInquiryId, setCurrentInquiryId] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [promptInput, setPromptInput] = useState("");
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  
  // --- RAG STATES ---
  const [selectedContextIds, setSelectedContextIds] = useState<string[]>([]);
  const [vaultDocs, setVaultDocs] = useState<any[]>([]);

  // Admin & Protection Logic
  const actualRole = session?.user?.role;
  const [adminMode, setAdminMode] = useState(false);
  const isAdmin = actualRole === "admin";
  const userCredits = (session?.user as any)?.credits ?? 0;

  useEffect(() => {
    setMounted(true);
    if (searchParams.get("success") === "true") {
      update();
      toast.success("Credits Refilled!", { description: "Your balance has been updated." });
    }
  }, [searchParams, update]);

  useEffect(() => {
    async function loadData() {
      if (status !== "authenticated") return;
      try {
        const [historyData, vaultData] = await Promise.all([
          getAllUserInquiries(),
          getCodeVaultDocs()
        ]);
        if (historyData) setHistory(historyData as HistoryItem[]);
        if (vaultData) setVaultDocs(vaultData);
      } catch (error) {
        console.error("Data fetch failed", error);
      } finally {
        setIsInitialLoad(false);
      }
    }
    if (mounted) loadData();
  }, [status, mounted]);

  useEffect(() => {
    document.body.style.overflow = isRiskModalOpen ? 'hidden' : 'unset';
  }, [isRiskModalOpen]);

  const toggleAdminMode = () => {
    if (!isAdmin) {
      toast.error("Access Denied", { description: "Administrator privileges required." });
      return;
    }
    setAdminMode(!adminMode);
    toast.success(adminMode ? "Switched to User View" : "Admin Mode Activated", {
      icon: adminMode ? <User size={14}/> : <ShieldCheck size={14} className="text-green-400"/>
    });
  };

  const toggleContext = (id: string) => {
    setSelectedContextIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

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
      toast.success("Prompt Copied");
    } catch (err) {
      toast.error("Copy failed");
    }
  };

  const handleShareVibe = async () => {
    if (!currentInquiryId) return;
    setShareLoading(true);
    try {
      const res = await publishToExplore(currentInquiryId);
      if (res.success) {
        const shareUrl = `${window.location.origin}/explore`;
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

    const isActuallyBypassed = isAdmin && adminMode;
    if (userCredits <= 0 && !isActuallyBypassed) {
      toast.error("Insufficient Credits", {
        description: "Please refill your credits to continue.",
        action: { label: "Refill", onClick: () => router.push("/refill") },
      });
      return;
    }

    setIsLoading(true);
    try {
      const selectedContext = vaultDocs
        .filter(doc => selectedContextIds.includes(doc.id))
        .map(doc => `[REFERENCE PATTERN: ${doc.title}]\n${doc.content}`)
        .join("\n\n---\n\n");

      const finalPrompt = selectedContext 
        ? `ACT AS AN ARCHITECT. INHERIT LOGIC FROM THESE BLUEPRINTS:\n\n${selectedContext}\n\nUSER REQUEST: ${promptInput}`
        : promptInput;

      const result = currentInquiryId 
        ? await updateVibeVersion(currentInquiryId, finalPrompt, currentVersion)
        : await createNewVibe(finalPrompt);
      
      if (result.success) {
        if (result.newCreditBalance !== undefined) {
          await update({
            ...session,
            user: { ...session?.user, credits: result.newCreditBalance },
          });
        } else {
          await update();
        }

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
      } else {
        toast.error(result.error || "Generation Failed");
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
      
      {/* --- Mobile Header --- */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#111111]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 z-[60]">
        <button onClick={() => setIsLeftSidebarOpen(true)} className="p-2 -ml-2 hover:bg-white/5 rounded-lg text-gray-400 transition-colors">
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2 font-black text-sm uppercase tracking-widest">
          <Cpu size={16} className="text-blue-500"/> YouPrompt
        </div>
        <button onClick={() => setIsRightSidebarOpen(true)} className="p-2 -mr-2 hover:bg-white/5 rounded-lg text-blue-400 transition-colors">
          <Zap size={20} />
        </button>
      </header>

      {/* --- Left Sidebar (Context & History) --- */}
      <aside className={`fixed inset-y-0 left-0 z-[100] w-[280px] bg-[#111111] border-r border-white/5 flex flex-col transition-transform duration-300 transform ${isLeftSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0 lg:flex lg:w-72 lg:shrink-0`}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-600/20"><Cpu size={18} className="text-white" /></div>
                <span className="font-black text-lg tracking-tighter uppercase">YouPrompt</span>
            </div>
            <button onClick={() => setIsLeftSidebarOpen(false)} className="lg:hidden p-2 text-gray-500"><X size={20}/></button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 space-y-8 custom-scrollbar pb-6">
            {/* Primary Nav */}
            <nav className="space-y-1">
              <Link href="/explore" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${pathname === '/explore' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-sm' : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'}`}>
                <Globe size={16} /> Community Vibes
              </Link>
              <Link href="/playground" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${pathname === '/playground' ? 'bg-white/5 text-white border border-white/10' : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'}`}>
                <Terminal size={16} /> Playground
              </Link>
              {isAdmin && (
                <Link href="/admin" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${pathname === '/admin' ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20' : 'text-gray-400 hover:bg-purple-600/5 hover:text-purple-300 border border-transparent'}`}>
                  <LayoutDashboard size={16} /> Admin Console
                </Link>
              )}
            </nav>

            {/* Credit Card Section */}
            <section>
              <div className={`p-5 rounded-[2rem] border transition-all ${adminMode ? "bg-gradient-to-br from-green-600/20 to-emerald-600/5 border-green-500/20" : "bg-gradient-to-br from-blue-600/20 to-purple-600/5 border-blue-500/20"}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-50">{adminMode ? "Admin Control" : "Balance"}</span>
                  {adminMode ? <ShieldCheck size={12} className="text-green-400" /> : <Zap size={12} className="text-blue-400" />}
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black tracking-tight">{adminMode ? "∞" : userCredits}</span>
                  {!adminMode && (
                    <button onClick={() => router.push("/refill")} className="text-[9px] bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 font-black transition-all border border-white/5 uppercase tracking-tighter">
                      <CreditCard size={10} /> Refill
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* Admin Toggle */}
            {isAdmin && (
              <button onClick={toggleAdminMode} className={`flex items-center justify-between w-full p-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${adminMode ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-white/[0.02] border-white/5 text-gray-500"}`}>
                <div className="flex items-center gap-2"><ShieldAlert size={14} /> {adminMode ? "Admin Active" : "View As User"}</div>
                <div className={`w-8 h-4 rounded-full relative transition-colors ${adminMode ? "bg-green-500" : "bg-gray-700"}`}>
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${adminMode ? "left-[1.125rem]" : "left-0.5"}`} />
                </div>
              </button>
            )}

            {/* Action & History */}
            <section className="space-y-4">
              <button onClick={() => { setCurrentInquiryId(null); setSteps([]); setEmergentContent(""); setPromptInput(""); setSelectedStep(null); }} className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-white text-black font-black text-[11px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/5">
                <PlusCircle size={16} /> New Architecture
              </button>

              <div className="space-y-3">
                <h2 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] px-2">History</h2>
                <div className="space-y-1">
                  {history.length > 0 ? history.map((item) => (
                    <button key={item.id} onClick={() => handleSelectHistory(item.id)} className={`w-full text-left p-4 rounded-xl border text-[11px] font-medium truncate transition-all ${currentInquiryId === item.id ? "bg-blue-600/10 border-blue-600/20 text-blue-400" : "bg-white/[0.02] border-transparent hover:border-white/10 text-gray-400 hover:text-gray-200"}`}>
                      {item.title || "Untitled Blueprint"}
                    </button>
                  )) : <p className="text-[10px] text-gray-700 px-2 italic font-medium">Clear stream...</p>}
                </div>
              </div>
            </section>
          </div>

          {/* User Profile Area */}
          <div className="p-4 mt-auto border-t border-white/5 bg-[#0e0e0e]">
            <div className="flex items-center gap-3 px-2 py-3 mb-2">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-[10px] font-black shrink-0 border border-white/10 shadow-lg">
                {session?.user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black truncate text-white">{session?.user?.name}</p>
                <p className="text-[9px] text-blue-500 truncate uppercase font-bold tracking-tighter">{actualRole} Mode</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <button onClick={() => router.push("/profile")} className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 text-gray-400 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all border border-transparent hover:border-white/5">
                  <Settings size={14} /> Profile
                </button>
                <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 text-gray-400 hover:text-red-400 text-[10px] font-black uppercase tracking-widest transition-all border border-transparent hover:border-white/5">
                  <LogOut size={14} /> Exit
                </button>
            </div>
          </div>
        </div>
      </aside>

      {/* --- Main Canvas --- */}
      <main className="flex-1 flex flex-col items-center relative overflow-hidden bg-[#0d0d0d] pt-20 lg:pt-0">
        <div className="w-full max-w-3xl h-full overflow-y-auto pt-8 pb-40 px-6 space-y-8 custom-scrollbar scroll-smooth">
          <AnimatePresence mode="wait">
            {steps.length > 0 ? (
              <motion.div key="steps-container" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 lg:space-y-10">
                {steps.map((step, i) => (
                  <motion.div 
                    key={i} 
                    onClick={() => { setSelectedStep(i); if(window.innerWidth < 1024) setIsRightSidebarOpen(true); }} 
                    className={`group p-6 lg:p-10 rounded-[2.5rem] border transition-all cursor-pointer relative overflow-hidden ${selectedStep === i ? "bg-[#141415] border-blue-500/40 shadow-2xl shadow-blue-900/10" : "bg-transparent border-white/5 hover:border-white/10"}`}
                  >
                    <div className="flex items-center justify-between mb-5 relative z-10">
                        <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${selectedStep === i ? "bg-blue-600 text-white" : "bg-white/5 text-gray-500"}`}>
                          Block {i + 1}
                        </span>
                        {selectedStep === i && <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse lg:hidden" />}
                    </div>
                    <h3 className="text-xl lg:text-3xl font-black mb-6 tracking-tight leading-tight group-hover:text-blue-400 transition-colors relative z-10">{step.objective}</h3>
                    <div className="bg-black/60 p-6 rounded-3xl font-mono text-[10px] lg:text-[11px] text-gray-500 border border-white/5 break-words leading-relaxed relative z-10 group-hover:text-gray-300 transition-colors">
                      {step.precisePrompt}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="h-[70vh] flex flex-col items-center justify-center text-center opacity-10">
                <Layers size={80} className="mb-8" />
                <p className="text-2xl lg:text-4xl italic font-black tracking-tight px-10 leading-tight">Define your technical vibe <br className="hidden md:block" /> to begin extraction.</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating Input Dock */}
        <div className="w-full max-w-2xl absolute bottom-8 px-6 z-[50]">
          <div className="absolute inset-x-6 -top-10 flex items-center justify-center pointer-events-none">
             {selectedContextIds.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 bg-blue-600/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 shadow-lg">
                  <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  <span className="text-[9px] font-black text-white uppercase tracking-widest">
                    RAG Active: {selectedContextIds.length} Patterns
                  </span>
                </motion.div>
              )}
          </div>
          
          <form onSubmit={handleSubmit} className="relative group filter drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <input 
              value={promptInput} 
              onChange={(e) => setPromptInput(e.target.value)} 
              placeholder={currentInquiryId ? "Iterate on this architecture..." : "Describe the tool you want to build..."} 
              className={`w-full bg-[#181819]/90 backdrop-blur-2xl rounded-[2rem] py-5 lg:py-7 px-8 lg:px-10 pr-20 lg:pr-24 outline-none border transition-all text-[13px] font-medium ${(userCredits <= 0 && !(isAdmin && adminMode)) ? "border-red-500/30 text-gray-600" : "border-white/10 focus:border-blue-500/50 shadow-[0_0_40px_rgba(59,130,246,0.1)]"}`} 
              disabled={isLoading || (userCredits <= 0 && !(isAdmin && adminMode))} 
            />
            <button type="submit" disabled={isLoading || !promptInput.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 h-12 w-12 lg:h-14 lg:w-14 flex items-center justify-center rounded-full transition-all bg-white text-black hover:bg-blue-600 hover:text-white active:scale-90 shadow-xl">
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : currentInquiryId ? <RotateCcw size={20} /> : <Send size={20} />}
            </button>
          </form>
        </div>
      </main>

      {/* --- Right Sidebar (Builder Hub) --- */}
      <aside className={`fixed inset-y-0 right-0 z-[100] w-[320px] bg-[#111111] border-l border-white/5 flex flex-col transition-transform duration-300 transform ${isRightSidebarOpen ? "translate-x-0" : "translate-x-full"} lg:relative lg:translate-x-0 lg:flex lg:w-80 lg:shrink-0`}>
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                  <Zap size={14} className="text-blue-500" /> Builder Hub
                </h2>
                <button onClick={() => setIsRightSidebarOpen(false)} className="lg:hidden p-2 text-gray-500 hover:text-white transition-colors"><X size={20}/></button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                
                {/* Master Workflow Controls */}
                <section className="p-6 space-y-6 border-b border-white/5 bg-white/[0.01]">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Master Workflow</span>
                      <div className="flex gap-2">
                        {steps.length > 0 && (
                          <>
                            <button onClick={handleShareVibe} disabled={shareLoading} className={`p-2 rounded-xl border transition-all ${shareCopied ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-900/20' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-blue-500/50'}`}>
                              {shareLoading ? <Loader2 size={14} className="animate-spin" /> : shareCopied ? <Check size={14} /> : <Share2 size={14} />}
                            </button>
                            <button onClick={handleCopyMasterPrompt} className={`flex items-center gap-2 text-[9px] font-black px-4 py-2 rounded-xl transition-all shadow-lg ${copied ? 'bg-green-600/20 text-green-400 border border-green-500/20' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-900/20'}`}>
                              {copied ? <Check size={12} /> : <Copy size={12} />}
                              {copied ? "DONE" : "COPY ALL"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-black/40 rounded-2xl p-4 border border-white/5 h-24 overflow-y-auto custom-scrollbar">
                        <p className="text-[10px] font-mono text-gray-500 leading-relaxed italic font-medium">
                          {steps.length > 0 ? fullMasterPrompt.substring(0, 180) + "..." : "Extracting logic from neural patterns..."}
                        </p>
                    </div>

                    {mounted && steps.length > 0 && (
                      <VibeBridge 
                        fullPrompt={fullMasterPrompt} 
                        title={steps[0]?.objective || "New Blueprint"} 
                      />
                    )}
                </section>

                {/* RAG Vault Context */}
                <section className="p-6 space-y-4 border-b border-white/5">
                  <h3 className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-1 flex items-center gap-2">
                    <Database size={12} className="text-purple-500" /> Pattern Vault
                  </h3>
                  <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                    {vaultDocs.length > 0 ? vaultDocs.map((doc) => (
                      <button 
                        key={doc.id}
                        onClick={() => toggleContext(doc.id)}
                        className={`flex items-center gap-3 w-full p-3.5 rounded-xl border transition-all text-left group ${
                          selectedContextIds.includes(doc.id) 
                            ? "bg-blue-600/10 border-blue-500/40 text-blue-400" 
                            : "bg-white/[0.02] border-white/5 text-gray-500 hover:border-white/20"
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${selectedContextIds.includes(doc.id) ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" : "bg-gray-800"}`} />
                        <span className="text-[10px] font-bold truncate uppercase tracking-tight flex-1">{doc.title}</span>
                        {selectedContextIds.includes(doc.id) && <Check size={10} className="text-blue-500" />}
                      </button>
                    )) : (
                      <div className="py-10 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
                        <p className="text-[9px] text-gray-700 italic font-black uppercase tracking-[0.2em]">Vault Empty</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Tabbed Analysis */}
                <section className="flex-1 flex flex-col p-6 space-y-6">
                    <div className="flex p-1.5 gap-1.5 bg-black/40 border border-white/5 rounded-2xl shrink-0">
                      <button onClick={() => setActiveTab("workflow")} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'workflow' ? 'bg-white/10 text-white shadow-inner' : 'text-gray-600 hover:text-gray-400'}`}>
                        <ToyBrick size={14} /> Tools
                      </button>
                      <button onClick={() => setActiveTab("emergent")} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'emergent' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/10' : 'text-gray-600 hover:text-gray-400'}`}>
                        <Sparkles size={14} /> Emergent
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      <AnimatePresence mode="wait">
                        {activeTab === "workflow" ? (
                          <motion.div key="tab-workflow" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                            {selectedStep !== null ? (
                              <div className="space-y-3">
                                {platforms.map((p) => (
                                  <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-blue-500/30 hover:bg-white/[0.05] transition-all group">
                                    <div className="flex items-center gap-3">
                                      <Globe size={16} className={p.color} />
                                      <span className="text-[10px] font-black uppercase tracking-widest">{p.name}</span>
                                    </div>
                                    <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-all text-gray-500" />
                                  </a>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-16 opacity-30 text-[9px] font-black uppercase tracking-[0.3em] border-2 border-dashed border-white/5 rounded-[2rem]">Select block</div>
                            )}
                          </motion.div>
                        ) : (
                          <motion.div key="tab-emergent" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="h-full">
                            <div className="p-6 rounded-[2.5rem] bg-blue-600/[0.03] border border-blue-500/10 shadow-inner h-full">
                              <h3 className="text-blue-500 font-black text-[9px] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <ShieldCheck size={12} /> Emergent Logic
                              </h3>
                              <p className="text-gray-400 text-[11px] leading-relaxed italic font-medium">{emergentContent || "Extracting emergent logic from the architectural stream..."}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                </section>
            </div>
        </div>
      </aside>

      {/* Mobile Overlays */}
      <AnimatePresence>
        {(isLeftSidebarOpen || isRightSidebarOpen) && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => { setIsLeftSidebarOpen(false); setIsRightSidebarOpen(false); }} 
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[80] lg:hidden" 
          />
        )}
      </AnimatePresence>

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