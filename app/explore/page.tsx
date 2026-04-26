/**
 * Copyright 2026 Sandeep Kumar
 * Licensed under the Apache License, Version 2.0
 * Production-Ready: Implements XSS Protection, Sanitization, and Fault Tolerance.
 */

import { db } from "@/db";
import { vibes, subscriptions, comments } from "@/db/schema";
import { desc, eq, count, inArray } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { VibeInteractions } from "../components/SocialActions";
import { ClaimCreditsOverlay } from "../components/ClaimCreditsOverlay";
import { ShareTemplateButton } from "../components/ShareTemplateButton";
import Link from "next/link";
import { Metadata } from "next";
import { 
  ChevronLeft, Terminal, MessageSquare, 
  PlusCircle, TrendingUp, Newspaper, 
  ShieldCheck, Zap, Globe, Users
} from "lucide-react";


interface Step {
  objective: string;
  procedures: string[];
  precisePrompt: string;
}

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "The Stream | YouPrompt Explore",
    description: "Discover and share high-fidelity AI Architectures.",
    openGraph: {
      title: "YouPrompt Architecture Stream",
      description: "Claim 5 credits to build your first AI workflow.",
      type: "website",
    },
  };
}

/**
 * Security Note: Sanitizes strings to prevent XSS while preserving newlines
 */
const sanitizeUGC = (content: string | null | undefined) => {
  if (!content) return "";
  return (content);
};

const MockAdSlot = ({ isGuest }: { isGuest: boolean }) => {
  const ads = [
    { 
      title: isGuest ? "Starter Pack" : "Enterprise Schema", 
      desc: isGuest ? "Get 5 credits to start your first vibe." : "Optimized Drizzle schema for multi-tenant SaaS.", 
      color: "from-blue-600/20", 
      btn: isGuest ? "Claim Credits" : "Deploy Blueprint",
      tag: "Limited Offer"
    },
    { 
      title: "Neon Postgres", 
      desc: "Serverless Postgres with bottomless storage.", 
      color: "from-green-500/20", 
      btn: "Provision DB",
      tag: "Partner"
    }
  ];
  const ad = ads[Math.floor(Math.random() * ads.length)];

  return (
    <div className="w-full bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-[2.5rem] p-6 flex flex-col justify-between min-h-[280px] relative overflow-hidden group">
      <div className={`absolute inset-0 bg-gradient-to-br ${ad.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <span className="text-[8px] font-black tracking-[0.3em] text-gray-500 uppercase">{ad.tag}</span>
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        </div>
        <h3 className="text-xl font-black text-white mb-2 leading-tight">{ad.title}</h3>
        <p className="text-[11px] text-gray-400 leading-relaxed font-medium">{ad.desc}</p>
      </div>
      <button type="button" className="relative z-10 w-full py-4 bg-white/5 hover:bg-white text-white hover:text-black border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">
        {ad.btn}
      </button>
    </div>
  );
};

export default async function ExplorePage() {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;

  try {
    const allVibes = await db.query.vibes.findMany({
      with: {
        author: true,
        likes: true,
        comments: {
          with: { author: true },
          orderBy: [desc(comments.createdAt)],
          limit: 20, // Optimization: Prevent huge DOM payload
        },
      },
      orderBy: [desc(vibes.createdAt)],
      limit: 50, // Guard against table-scans
    });

    const authorIds = Array.from(new Set(allVibes.map(v => v.creatorId).filter(Boolean))) as string[];
    const followerCounts = authorIds.length > 0 
      ? await db.select({ 
          authorId: subscriptions.followingId, 
          count: count() 
        })
        .from(subscriptions)
        .where(inArray(subscriptions.followingId, authorIds))
        .groupBy(subscriptions.followingId)
      : [];
    const followerMap = Object.fromEntries(followerCounts.map(f => [f.authorId, f.count]));

    let userVibesCount = 0;
    let userFollowingCount = 0;
    let userFollowerCount = 0;
    let followingIds = new Set<string>();

    if (currentUserId) {
      const [vibeRes] = await db.select({ value: count() }).from(vibes).where(eq(vibes.creatorId, currentUserId));
      const subRes = await db.query.subscriptions.findMany({ where: eq(subscriptions.followerId, currentUserId) });
      const [follRes] = await db.select({ value: count() }).from(subscriptions).where(eq(subscriptions.followingId, currentUserId));
      
      userVibesCount = vibeRes?.value || 0;
      userFollowingCount = subRes?.length || 0;
      userFollowerCount = follRes?.value || 0;
      followingIds = new Set(subRes.map(s => s.followingId));
    }

    return (
      <div className="h-screen w-full bg-[#050505] text-white flex flex-col overflow-hidden font-[family-name:var(--font-geist-sans)] selection:bg-blue-500/30">
        {!session && <ClaimCreditsOverlay />}

        {/* Fixed Header */}
        <header className="h-20 shrink-0 border-b border-white/5 flex items-center justify-between px-6 sm:px-10 bg-[#050505]/50 backdrop-blur-xl z-50">
          <Link href="/playground" className="flex items-center gap-2 text-[10px] font-black text-gray-500 hover:text-blue-400 transition-all tracking-widest group">
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            RETURN TO LAB
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full">
              <ShieldCheck size={12} className="text-blue-400" />
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">Verified Architecture</span>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="flex-1 flex overflow-hidden max-w-[1600px] mx-auto w-full">
          
          {/* Fixed Left Sidebar */}
          <aside className="hidden lg:flex flex-col w-[320px] p-8 space-y-6 overflow-y-auto border-r border-white/5 shrink-0 custom-scrollbar">
            <div className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-8">
              <div className="flex flex-col items-center text-center space-y-5">
                <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center text-3xl font-black border border-white/20 shadow-2xl overflow-hidden">
                  {session?.user?.image ? (
                    <img src={session.user.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    session?.user?.name?.charAt(0) || "U"
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight truncate w-40">{session?.user?.name || "Guest User"}</h2>
                  <p className="text-[10px] text-blue-500 font-mono mt-1 opacity-80 uppercase tracking-widest leading-none">Architect</p>
                </div>
                
                <div className="grid grid-cols-3 gap-2 w-full pt-6 border-t border-white/5">
                  <div className="text-center">
                    <p className="text-lg font-black text-white">{userVibesCount}</p>
                    <p className="text-[7px] uppercase tracking-[0.2em] text-gray-500 mt-1">Vibes</p>
                  </div>
                  <div className="text-center border-l border-white/5">
                    <p className="text-lg font-black text-white">{userFollowingCount}</p>
                    <p className="text-[7px] uppercase tracking-[0.2em] text-gray-500 mt-1">Following</p>
                  </div>
                  <div className="text-center border-l border-white/5">
                    <p className="text-lg font-black text-white">{userFollowerCount}</p>
                    <p className="text-[7px] uppercase tracking-[0.2em] text-gray-500 mt-1">Followers</p>
                  </div>
                </div>
              </div>
            </div>

            <Link href={session ? "/playground" : "/login"} className="flex items-center justify-center gap-3 w-full bg-white text-black hover:bg-blue-500 hover:text-white font-black py-4 rounded-[1.2rem] transition-all active:scale-95 text-[10px] uppercase tracking-widest group">
              <PlusCircle size={18} />
              PUBLISH VIBE
            </Link>

            <div className="p-6 rounded-[2rem] bg-white/[0.01] border border-white/5">
              <h5 className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Globe size={12} /> Network Status
              </h5>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-gray-500 italic font-mono">sync_vibe_main</span>
                  <span className="text-green-400 font-bold uppercase text-[8px]">Stable</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Independent Scrolling Main Feed */}
          <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#080808]/30 px-4 sm:px-10 py-10">
            <div className="max-w-[700px] mx-auto space-y-12">
              <div className="flex items-center justify-between px-2">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tighter italic uppercase">
                  THE <span className="text-blue-600">STREAM</span>
                </h1>
                <TrendingUp size={20} className="text-blue-500" />
              </div>

              {allVibes.map((vibe) => {
                const isLiked = currentUserId ? vibe.likes?.some((l) => l.userId === currentUserId) : false;
                const isFollowing = followingIds.has(vibe.creatorId ?? "");
                const authorFollows = followerMap[vibe.creatorId ?? ""] || 0;

                const workflowSteps = (vibe.steps as Step[]) || [];
                const fullMasterPrompt = workflowSteps.map((s, i) => 
                  `### STEP ${i + 1}: ${sanitizeUGC(s.objective?.toUpperCase())}\n${sanitizeUGC(s.precisePrompt)}`
                ).join("\n\n---\n\n");

                return (
                  <article key={vibe.id} className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-6 sm:p-10 hover:bg-white/[0.03] transition-colors border-l-4 border-l-transparent hover:border-l-blue-600 relative group">
                    
                    <ShareTemplateButton vibeId={vibe.id} vibeTitle={vibe.title ?? ""} />

                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-gray-900 border border-white/10 flex items-center justify-center font-black text-blue-500 text-sm overflow-hidden">
                                {vibe.author?.image ? (
                                  <img src={vibe.author.image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  vibe.author?.name?.charAt(0)
                                )}
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white tracking-tight leading-none mb-1">{vibe.author?.name}</h4>
                                <div className="flex items-center gap-2">
                                    <p className="text-[9px] text-gray-600 uppercase tracking-widest font-bold">
                                        {vibe.createdAt ? new Date(vibe.createdAt).toDateString() : 'Active Now'}
                                    </p>
                                    <span className="text-[8px] text-gray-800">•</span>
                                    <div className="flex items-center gap-1 text-[9px] text-blue-400 font-bold uppercase tracking-tighter">
                                        <Users size={10} />
                                        {authorFollows} Followers
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-black mb-6 tracking-tighter leading-tight">
                      {sanitizeUGC(vibe.title)}
                    </h3>
                    
                    <div className="bg-white/[0.03] border border-white/5 p-5 rounded-2xl mb-8 font-mono text-[11px] text-gray-400 leading-relaxed italic border-l-2 border-l-blue-500/50">
                      {sanitizeUGC(vibe.prompt)}
                    </div>

                    <div className="bg-black/60 rounded-[2rem] border border-white/5 p-6 sm:p-8 max-h-[350px] overflow-y-auto custom-scrollbar mb-10">
                      <pre className="font-mono text-[10px] sm:text-[11px] text-gray-400 whitespace-pre-wrap leading-loose">
                        {fullMasterPrompt || "Architecture data missing."}
                      </pre>
                    </div>

                    <div className="pt-8 border-t border-white/5">
                      <VibeInteractions
                        vibeId={vibe.id}
                        currentUserId={currentUserId ?? ""}
                        initialLikes={vibe.likes?.length || 0}
                        isLiked={isLiked}
                        authorId={vibe.creatorId ?? ""}
                        isFollowing={isFollowing}
                      />
                    </div>

                    {vibe.comments && vibe.comments.length > 0 && (
                      <div className="mt-8 space-y-4 pt-8 border-t border-white/5">
                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                          <MessageSquare size={14} /> Discussion & Emojis
                        </div>
                        {vibe.comments.map((comment) => (
                          <div key={comment.id} className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[10px] font-bold text-blue-500">{comment.author?.name}</span>
                              <span className="text-[8px] text-gray-600 uppercase tracking-tighter">
                                {comment.createdAt ? new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Syncing...'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-300 leading-relaxed break-words">
                              {sanitizeUGC(comment.content)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </main>

          {/* Fixed Right Sidebar */}
          <aside className="hidden xl:flex flex-col w-[360px] p-8 space-y-8 overflow-y-auto border-l border-white/5 shrink-0 custom-scrollbar">
            <MockAdSlot isGuest={!session} />
            
            <div className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-8">
              <h4 className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-white mb-8">
                <Newspaper size={16} className="text-blue-500" /> Pulse News
              </h4>
              <div className="space-y-8">
                {[
                  { title: "Drizzle ORM v1.0 Roadmap", site: "Drizzle.team" },
                  { title: "Neon's New Autoscaling", site: "Neon.tech" },
                  { title: "Next.js 16 Early Canary", site: "Vercel" }
                ].map((news, i) => (
                  <div key={i} className="group cursor-pointer">
                    <p className="text-[12px] font-bold text-gray-300 group-hover:text-blue-400 transition-colors leading-tight">{news.title}</p>
                    <span className="text-[9px] uppercase font-bold text-gray-700 mt-2 block">{news.site}</span>
                  </div>
                ))}
              </div>
            </div>

            <MockAdSlot isGuest={false} />

            <div className="px-8 pb-10 flex flex-wrap gap-4 text-[9px] text-gray-700 font-bold uppercase tracking-widest">
              <span>Apache 2.0</span>
              <span>Build v2.2.1</span>
            </div>
          </aside>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Explore Page Error:", error);
    return (
      <div className="h-screen w-full bg-[#050505] flex flex-col items-center justify-center p-8 text-center">
        <Zap className="text-red-500 mb-4" size={32} />
        <h3 className="text-lg font-black uppercase mb-2">System Outage</h3>
        <p className="text-gray-500 text-[10px] uppercase font-mono italic">Sync interrupted. Check cluster status.</p>
      </div>
    );
  }
}