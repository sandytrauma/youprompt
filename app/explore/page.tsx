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

import { db } from "@/db";
import { vibes, subscriptions, comments } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { VibeInteractions } from "../components/SocialActions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Sparkles, Terminal, MessageSquare, Calendar, User } from "lucide-react";

interface Step {
  objective: string;
  procedures: string[];
  precisePrompt: string;
}

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const currentUserId = session.user.id;

  try {
    const allVibes = await db.query.vibes.findMany({
      with: {
        author: true,
        likes: true,
        comments: {
          with: { author: true },
          orderBy: [desc(comments.createdAt)],
        },
      },
      orderBy: [desc(vibes.createdAt)],
    });

    const followingList = await db.query.subscriptions.findMany({
      where: eq(subscriptions.followerId, currentUserId),
    });

    const followingIds = new Set(followingList.map((s) => s.followingId));

    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white pt-8 pb-24 px-4 sm:px-6 font-[family-name:var(--font-geist-sans)]">
        <div className="max-w-2xl mx-auto space-y-8 sm:space-y-12">
          
          {/* Header */}
          <div className="space-y-4 sm:space-y-6">
            <Link 
              href="/playground" 
              className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-blue-400 transition-colors group"
            >
              <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
              Back to Playground
            </Link>

            <div className="border-b border-white/5 pb-6 sm:pb-8">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
                Explore Vibes
              </h1>
              <p className="text-gray-400 mt-3 flex items-center gap-2 text-xs sm:text-sm font-medium">
                <Sparkles size={14} className="text-blue-500 shrink-0" />
                Community-engineered master prompts.
              </p>
            </div>
          </div>

          {allVibes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 sm:py-32 border border-dashed border-white/10 rounded-[2rem] sm:rounded-[3rem] bg-white/[0.01]">
              <p className="text-gray-500 font-medium text-xs sm:text-sm italic">The vibe stream is currently empty...</p>
            </div>
          ) : (
            <div className="grid gap-10 sm:gap-16">
              {allVibes.map((vibe) => {
                const isLiked = vibe.likes?.some((l) => l.userId === currentUserId);
                const isFollowing = followingIds.has(vibe.creatorId ?? "");
                const workflowSteps = (vibe.steps as Step[]) || [];
                
                const fullMasterPrompt = workflowSteps.length > 0 
                  ? workflowSteps.map((s, i) => 
                      `### STEP ${i + 1}: ${s.objective?.toUpperCase()}\n${s.precisePrompt}`
                    ).join("\n\n---\n\n")
                  : "No architectural steps found.";

                return (
                  <article
                    key={vibe.id}
                    className="group relative p-5 sm:p-8 bg-white/[0.02] border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] hover:bg-white/[0.03] transition-all duration-500 overflow-hidden"
                  >
                    {/* Header: Author & Meta */}
                    <div className="flex items-center justify-between mb-6 sm:mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-xs sm:text-sm">
                          {vibe.author?.name?.charAt(0).toUpperCase() || <User size={14}/>}
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-gray-200 leading-none">{vibe.author?.name || "Anonymous"}</h4>
                          <div className="flex items-center gap-2 mt-1.5 opacity-50">
                            <Calendar size={10} />
                            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest">
                              {vibe.createdAt ? new Date(vibe.createdAt).toLocaleDateString() : 'Recent'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Vibe Title & Sub-prompt */}
                    <div className="mb-6 sm:mb-8">
                      <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 tracking-tight">{vibe.title}</h3>
                      <div className="bg-white/[0.03] border border-white/5 px-4 py-3 rounded-xl sm:rounded-2xl">
                        <p className="text-[10px] sm:text-[11px] text-gray-400 font-mono leading-relaxed break-words">
                          <span className="text-blue-500 mr-2 font-black uppercase tracking-tighter">Context:</span>
                          {vibe.prompt}
                        </p>
                      </div>
                    </div>

                    {/* Architectural Prompt Block */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-blue-500/80 px-1">
                        <Terminal size={12} />
                        Full Architecture Workflow
                      </div>
                      
                      <div className="relative group/code">
                        <div className="absolute inset-0 bg-blue-600/5 blur-3xl rounded-[2rem] opacity-0 group-hover/code:opacity-100 transition-opacity duration-700 pointer-events-none" />
                        <div className="relative bg-black/40 rounded-2xl sm:rounded-[2rem] border border-white/5 p-5 sm:p-8">
                          <pre className="font-mono text-[10px] sm:text-[11px] text-gray-300 leading-relaxed whitespace-pre-wrap max-h-[300px] sm:max-h-[400px] overflow-y-auto custom-scrollbar scroll-smooth break-words">
                            {fullMasterPrompt}
                          </pre>
                        </div>
                      </div>
                    </div>

                    {/* Social Interactions Section */}
                    <div className="mt-8 pt-6 border-t border-white/5">
                      <VibeInteractions
                        vibeId={vibe.id}
                        currentUserId={currentUserId}
                        initialLikes={vibe.likes?.length || 0}
                        isLiked={isLiked}
                        authorId={vibe.creatorId ?? ""}
                        isFollowing={isFollowing}
                      />
                    </div>

                    {/* Discussion Display Block */}
                    {vibe.comments && vibe.comments.length > 0 && (
                      <div className="mt-6 space-y-4">
                        <div className="flex items-center gap-2 px-1 opacity-50">
                            <MessageSquare size={12} className="text-blue-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Discussion Thread</span>
                        </div>
                        <div className="space-y-3">
                          {vibe.comments.map((comment) => (
                            <div key={comment.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 transition-all hover:bg-white/[0.04]">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-bold text-blue-400">{comment.author?.name || "Anon"}</span>
                                <span className="text-[8px] text-gray-600 uppercase tracking-tighter">
                                  {comment.createdAt ? new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                                </span>
                              </div>
                              <p className="text-xs text-gray-300 leading-relaxed">{comment.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Explore Page Error:", error);
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <div className="inline-block animate-pulse text-blue-500 font-mono text-sm px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20">
            [DATABASE_RECOVERY_MODE]
          </div>
          <p className="text-gray-500 text-xs sm:text-sm max-w-xs mx-auto">
            We're having trouble reaching the vibe stream. Please verify your connection to Neon.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="text-[10px] font-bold uppercase tracking-widest text-white bg-white/5 border border-white/10 px-6 py-2 rounded-full hover:bg-white/10 transition-all"
          >
            Retry Sync
          </button>
        </div>
      </div>
    );
  }
}