/**
 * Copyright 2026 Sandeep Kumar
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
    <div className="space-y-3 px-2">
      <h3 className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-1">Deploy to IDE</h3>
      <div className="grid grid-cols-2 gap-2">
        {bridgeTools.map((tool) => (
          <button 
            key={tool.name}
            onClick={() => shipToTool(tool.url, tool.name)}
            className={`flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 transition-all group ${tool.border}`}
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

  // Load History and Vault Documents
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
      // --- RAG CONTEXT INJECTION ---
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
          <Link href="/explore" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${pathname === '/explore' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'}`}>
            <Globe size={16} /> Community Vibes
          </Link>
          <Link href="/playground" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${pathname === '/playground' ? 'bg-white/5 text-white border border-white/10' : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'}`}>
            <Terminal size={16} /> Playground
          </Link>
          {isAdmin && (
            <Link href="/admin" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${pathname === '/admin' ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20' : 'text-gray-400 hover:bg-purple-600/5 hover:text-purple-300 border border-transparent'}`}>
              <LayoutDashboard size={16} /> Admin Console
            </Link>
          )}
        </div>
    
        <div className={`mb-6 p-4 rounded-2xl border transition-all ${adminMode ? "bg-gradient-to-br from-green-600/20 to-emerald-600/10 border-green-500/20" : "bg-gradient-to-br from-blue-600/20 to-purple-600/10 border-blue-500/20"}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">{adminMode ? "Admin Control" : "Credits"}</span>
            {adminMode ? <ShieldCheck size={12} className="text-green-400" /> : <Zap size={12} className="text-blue-400" />}
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black">{adminMode ? "Unlimited" : userCredits}</span>
            {!adminMode && (
              <button onClick={() => router.push("/refill")} className="text-[10px] bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded-md flex items-center gap-1 font-bold transition-all border border-white/10">
                <CreditCard size={10} /> Refill
              </button>
            )}
          </div>
        </div>

        {isAdmin && (
          <button onClick={toggleAdminMode} className={`mb-6 flex items-center justify-between w-full p-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${adminMode ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-white/5 border-white/10 text-gray-500"}`}>
            <div className="flex items-center gap-2"><ShieldAlert size={14} /> {adminMode ? "Admin Active" : "User View"}</div>
            <div className={`w-8 h-4 rounded-full relative transition-colors ${adminMode ? "bg-green-500" : "bg-gray-700"}`}>
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${adminMode ? "left-[1.125rem]" : "left-0.5"}`} />
            </div>
          </button>
        )}

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
              <p className="text-[9px] text-gray-500 truncate uppercase tracking-tighter">{actualRole} Mode</p>
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

        {/* Floating Input with RAG indicator */}
        <div className="w-full max-w-2xl absolute bottom-6 md:bottom-8 px-4 md:px-6 z-[40]">
          {selectedContextIds.length > 0 && (
            <div className="flex items-center gap-2 mb-3 px-4">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">
                Context: {selectedContextIds.length} Patterns Active
              </span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="relative group">
            <input 
              value={promptInput} 
              onChange={(e) => setPromptInput(e.target.value)} 
              placeholder={currentInquiryId ? "Suggest changes..." : "Describe your workflow vibe..."} 
              className={`w-full bg-[#161617] rounded-full py-4 md:py-5 px-6 md:px-8 pr-14 md:pr-16 outline-none border transition-all shadow-2xl text-sm ${(userCredits <= 0 && !(isAdmin && adminMode)) ? "border-red-500/30 text-gray-600" : "border-white/10 focus:border-blue-500/50"}`} 
              disabled={isLoading || (userCredits <= 0 && !(isAdmin && adminMode))} 
            />
            <button type="submit" disabled={isLoading || !promptInput.trim()} className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 p-2.5 md:p-3 rounded-full transition-all bg-white text-black">
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : currentInquiryId ? <RotateCcw size={18} /> : <Send size={18} />}
            </button>
          </form>
        </div>
      </main>

      {/* Right Sidebar */}
      <aside className={`fixed inset-y-0 right-0 z-[100] w-80 bg-[#111111] border-l border-white/5 flex flex-col transition-transform duration-300 transform ${isRightSidebarOpen ? "translate-x-0" : "translate-x-full"} md:relative md:translate-x-0 md:flex md:w-80 md:shrink-0`}>
        <div className="flex items-center justify-between p-4 md:hidden border-b border-white/5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Builder Hub</h2>
            <button onClick={() => setIsRightSidebarOpen(false)} className="p-2 text-gray-500"><X size={20}/></button>
        </div>

        <div className={`p-4 border-b border-white/5 bg-white/[0.02] ${mounted ? 'space-y-4' : ''}`}>
            <div className={`flex items-center justify-between px-2 ${!mounted ? 'mb-3' : ''}`}>
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
            
            <div className={`bg-black/40 rounded-xl p-3 border border-white/5 overflow-y-auto custom-scrollbar ${mounted ? 'h-20' : 'h-24 mb-4'}`}>
                <p className="text-[10px] font-mono text-gray-500 leading-relaxed italic">
                  {steps.length > 0 ? fullMasterPrompt.substring(0, 150) + "..." : "Architectural prompt will appear here."}
                </p>
            </div>

            {mounted && (
              <>
                <VibeBridge 
                  fullPrompt={fullMasterPrompt} 
                  title={steps[0]?.objective || "New Blueprint"} 
                />
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg mx-2">
                  <div className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                  </div>
                  <span className="text-[8px] font-bold text-blue-400 uppercase tracking-widest uppercase">Vault Synced</span>
                </div>
              </>
            )}
        </div>

        {/* RAG Context Panel */}
        <div className="space-y-3 px-2 mt-6">
          <h3 className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-1 flex items-center gap-2">
            <Database size={10} /> RAG Context (Vault)
          </h3>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar px-1">
            {vaultDocs.length > 0 ? vaultDocs.map((doc) => (
              <button 
                key={doc.id}
                onClick={() => toggleContext(doc.id)}
                className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left group ${
                  selectedContextIds.includes(doc.id) 
                    ? "bg-blue-600/10 border-blue-500/40 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.05)]" 
                    : "bg-white/[0.03] border-white/5 text-gray-500 hover:border-white/20"
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${selectedContextIds.includes(doc.id) ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-gray-700"}`} />
                <span className="text-[10px] font-bold truncate uppercase tracking-tight flex-1">{doc.title}</span>
                {selectedContextIds.includes(doc.id) && <Check size={10} className="text-blue-500" />}
              </button>
            )) : (
              <div className="py-8 text-center border border-dashed border-white/5 rounded-2xl">
                <p className="text-[10px] text-gray-600 italic px-4 uppercase tracking-widest">Vault is empty</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex p-2 gap-2 bg-black/20 border-b border-white/5 mt-6">
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
                          <span className="text-xs font-medium uppercase tracking-tighter">{p.name}</span>
                        </div>
                        <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 opacity-30 text-[10px] font-bold uppercase tracking-widest">Select a step to unlock tools</div>
                )}
              </motion.div>
            ) : (
              <motion.div key="tab-emergent" initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="p-5 rounded-3xl bg-blue-600/5 border border-blue-500/20 shadow-inner">
                  <h3 className="text-blue-400 font-bold text-[10px] uppercase tracking-widest mb-3">Neural Analysis</h3>
                  <p className="text-gray-300 text-sm leading-relaxed italic">{emergentContent || "Architecting logic patterns..."}</p>
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