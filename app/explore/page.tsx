import { db } from "@/db";
import { vibes, subscriptions, comments } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { VibeInteractions } from "../components/SocialActions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Sparkles, Terminal } from "lucide-react";

// Define a proper interface for your Step structure based on your JSON
interface Step {
  objective: string;
  procedures: string[];
  precisePrompt: string;
}

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
      <div className="min-h-screen bg-[#0a0a0a] text-white pt-12 pb-20 px-4 font-[family-name:var(--font-geist-sans)]">
        <div className="max-w-2xl mx-auto space-y-10">
          
          {/* Header */}
          <div className="space-y-6">
            <Link 
              href="/playground" 
              className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-blue-400 transition-colors group"
            >
              <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
              Back to Playground
            </Link>

            <div className="border-b border-white/5 pb-8">
              <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-white to-gray-600 bg-clip-text text-transparent">
                Explore Vibes
              </h1>
              <p className="text-gray-400 mt-2 flex items-center gap-2 text-sm">
                <Sparkles size={14} className="text-blue-500" />
                Community-engineered master prompts.
              </p>
            </div>
          </div>

          {allVibes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 border border-dashed border-white/10 rounded-[3rem] bg-white/[0.01]">
              <p className="text-gray-500 font-medium text-sm italic">The vibe stream is currently empty...</p>
            </div>
          ) : (
            <div className="grid gap-12">
              {allVibes.map((vibe) => {
                const isLiked = vibe.likes?.some((l) => l.userId === currentUserId);
                const isFollowing = followingIds.has(vibe.creatorId ?? "");
                
                // Safely cast and map your 7-step architecture
                const workflowSteps = (vibe.steps as Step[]) || [];
                
                const fullMasterPrompt = workflowSteps.length > 0 
                  ? workflowSteps.map((s, i) => 
                      `### STEP ${i + 1}: ${s.objective?.toUpperCase()}\n${s.precisePrompt}`
                    ).join("\n\n---\n\n")
                  : "No architectural steps found.";

                return (
                  <article
                    key={vibe.id}
                    className="group relative p-8 bg-white/[0.02] border border-white/10 rounded-[2.5rem] hover:bg-white/[0.03] transition-all duration-500"
                  >
                    {/* Header: Author & Meta */}
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-sm">
                          {vibe.author?.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-200">{vibe.author?.name || "Anonymous"}</h4>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                            {vibe.createdAt ? new Date(vibe.createdAt).toLocaleDateString() : 'Recent'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Vibe Title & Sub-prompt */}
                    <div className="mb-8">
                      <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">{vibe.title}</h3>
                      <div className="bg-white/[0.03] border border-white/5 px-4 py-2 rounded-2xl">
                        <p className="text-[11px] text-gray-400 font-mono leading-relaxed">
                          <span className="text-blue-500 mr-2 font-bold">CONTEXT:</span>
                          {vibe.prompt}
                        </p>
                      </div>
                    </div>

                    {/* Architectural Prompt Block */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500/80">
                          <Terminal size={12} />
                          Full Architecture Workflow
                        </div>
                      </div>
                      
                      <div className="relative group/code">
                        <div className="absolute inset-0 bg-blue-600/5 blur-3xl rounded-[2rem] opacity-0 group-hover/code:opacity-100 transition-opacity duration-700 pointer-events-none" />
                        <div className="relative bg-black/40 rounded-[2rem] border border-white/5 p-8 overflow-hidden">
                          <pre className="font-mono text-[11px] text-gray-300 leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto custom-scrollbar scroll-smooth">
                            {fullMasterPrompt}
                          </pre>
                        </div>
                      </div>
                    </div>

                    {/* Social Interactions */}
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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-pulse text-blue-500 font-mono text-sm">[SYNCING_DATABASE]</div>
          <p className="text-gray-600 text-xs">If this persists, please check your Neon connection.</p>
        </div>
      </div>
    );
  }
}