/**
 * Copyright 2026 Sandeep Kumar
 * High-Performance Global Identity Sync & SaaS Refill Integration
 * Fixed: TypeScript property 'error' and 'description' mismatches
 */

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/actions/profile";
import Link from "next/link";
import { 
  User, Shield, Save, Camera, 
  Zap, Globe, Verified, ChevronLeft,
  Sparkles, ArrowUpRight, Loader2
} from "lucide-react";
import { toast } from "react-hot-toast";

const AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Sawyer",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Jameson",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Zion",
];

export default function ProfilePage() {
  const { data: session, update, status } = useSession();
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync internal state when session loads or changes
  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setSelectedAvatar(session.user.image || "");
    }
  }, [session]);

  const handleGlobalSync = async () => {
    if (!name.trim()) {
      toast.error("Identity identifier required.");
      return;
    }
    
    setIsUpdating(true);
    
    try {
      // 1. Persistence: Update the database record via Server Action
      const result = await updateProfile({ 
        name: name.trim(), 
        image: selectedAvatar 
      });

      // Fix: Check result.success instead of result.error
      if (!result.success) {
        throw new Error(result.message || "Failed to update profile");
      }

      // 2. Critical Global Broadcast
      await update({
        ...session,
        user: {
          ...session?.user,
          name: name.trim(),
          image: selectedAvatar,
        },
      });

      // 3. Force a hard refresh of the local session state 
      window.dispatchEvent(new Event("visibilitychange"));

      // Fix: Removed 'description' property not supported by react-hot-toast
      toast.success("Global Sync Successful!");
      
    } catch (err: any) {
      console.error("Sync Error:", err);
      toast.error(err.message || "The system could not broadcast your identity.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-[family-name:var(--font-geist-sans)] selection:bg-blue-500/30">
      
      {/* Subtle Header Navigation */}
      <header className="h-20 shrink-0 border-b border-white/5 flex items-center justify-between px-6 sm:px-10 bg-[#050505]/50 backdrop-blur-xl fixed top-0 w-full z-50">
        <Link href="/playground" className="flex items-center gap-2 text-[10px] font-black text-gray-500 hover:text-blue-400 transition-all tracking-widest group">
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          RETURN TO LAB
        </Link>
        <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full">
          <Shield size={12} className="text-blue-400" />
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">Identity Node</span>
        </div>
      </header>

      {/* Decorative Backdrop */}
      <div className="h-64 w-full bg-gradient-to-b from-blue-900/10 to-transparent border-b border-white/5 pt-20" />

      <div className="max-w-5xl mx-auto px-6 -mt-32 relative z-10 pb-20">
        
        {/* Profile Identity Header */}
        <div className="flex flex-col md:flex-row items-end gap-6 mb-12">
          <div className="relative">
            <div className="w-40 h-40 rounded-[3rem] bg-[#0c0c0c] border-[6px] border-[#050505] shadow-2xl overflow-hidden group">
              <img 
                src={selectedAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${session?.user?.email || 'User'}`} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                alt="Profile" 
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-blue-600 p-2.5 rounded-2xl border-4 border-[#050505] shadow-xl">
              <Camera size={18} className="text-white" />
            </div>
          </div>

          <div className="flex-1 pb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-5xl font-black tracking-tighter italic uppercase drop-shadow-sm truncate max-w-[400px]">
                {name || "Architect"}
              </h1>
              <Verified size={24} className="text-blue-500 shrink-0" />
            </div>
            <p className="text-gray-500 text-xs font-mono uppercase tracking-[0.4em] mt-2">Global Identity Protocol</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar: Avatar Selection */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#0c0c0c] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] rotate-12 pointer-events-none">
                <Sparkles size={120} />
              </div>
              <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                Visual Matrix
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {AVATARS.map((url) => (
                  <button 
                    key={url}
                    type="button"
                    onClick={() => setSelectedAvatar(url)}
                    className={`aspect-square rounded-[1.2rem] overflow-hidden border-2 transition-all active:scale-90 ${selectedAvatar === url ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-white/5 opacity-40 hover:opacity-100 hover:border-white/20'}`}
                  >
                    <img src={url} className="w-full h-full p-1.5" alt="avatar-option" />
                  </button>
                ))}
              </div>
            </div>

            {/* Credit Status Card */}
            <div className="bg-gradient-to-br from-[#111] to-transparent p-8 rounded-[2.5rem] border border-white/5 shadow-xl">
               <h3 className="text-blue-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                  <Zap size={14} /> Node Balance
               </h3>
               <p className="text-4xl font-black text-white tracking-tighter mb-6">
                 {session?.user?.credits ?? 0} <span className="text-[10px] text-gray-600 tracking-widest font-bold">CRD</span>
               </p>
               <button 
                 type="button"
                 onClick={() => router.push("/refill")}
                 className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group"
               >
                 Request Refill <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
               </button>
            </div>
          </div>

          {/* Main Content: Info Control */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-[#0c0c0c] p-8 md:p-10 rounded-[2.5rem] border border-white/5 shadow-2xl">
              <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-10 flex items-center gap-2">
                <Globe size={14} className="text-blue-500" /> Core Identity
              </h2>
              
              <div className="space-y-10">
                {/* Name Input */}
                <div className="relative group">
                  <label className="text-[9px] text-gray-600 uppercase font-black tracking-widest absolute -top-2 left-4 px-2 bg-[#0c0c0c] z-10">Display Name</label>
                  <div className="flex items-center bg-white/[0.02] border border-white/10 rounded-2xl p-5 focus-within:border-blue-500/50 transition-all">
                    <User size={18} className="text-gray-600 mr-4" />
                    <input 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Input Identity"
                      className="w-full bg-transparent outline-none text-base font-bold placeholder:text-gray-800"
                    />
                  </div>
                </div>

                {/* Email Display */}
                <div className="relative opacity-40">
                  <label className="text-[9px] text-gray-700 uppercase font-black tracking-widest absolute -top-2 left-4 px-2 bg-[#0c0c0c] z-10">System Email</label>
                  <div className="flex items-center bg-transparent border border-white/5 rounded-2xl p-5">
                    <Shield size={18} className="text-gray-800 mr-4" />
                    <input 
                      value={session?.user?.email || ""} 
                      readOnly
                      disabled 
                      className="w-full bg-transparent outline-none text-sm font-mono text-gray-700 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Commit Action */}
            <button 
              type="button"
              onClick={handleGlobalSync}
              disabled={isUpdating}
              className="w-full py-6 bg-white text-black rounded-[2rem] font-black uppercase tracking-[0.3em] text-[12px] hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-3 shadow-2xl disabled:opacity-50 disabled:cursor-wait group active:scale-95"
            >
              {isUpdating ? (
                <span className="flex items-center gap-3">
                  <Zap size={20} className="animate-pulse text-blue-400" /> BROADCASTING DATA...
                </span>
              ) : (
                <>
                  <Save size={20} className="group-hover:rotate-12 transition-transform" /> 
                  EXECUTE GLOBAL SYNC
                </>
              )}
            </button>

            <p className="text-center text-gray-800 text-[10px] font-bold uppercase tracking-[0.4em] pt-6">
              Authenticated Session ID: {session?.user?.id?.slice(0, 12) || "ANON-UNSET"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}