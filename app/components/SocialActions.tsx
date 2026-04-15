"use client";

/**
 * Copyright 2026 Sandeep Kumar
 * High-Concurrency Social Interaction Protocol v3.1
 * Patches: Race-Condition handling, Input Sanitization, and State Synchronization.
 */

import { useState, useTransition, useOptimistic, useEffect } from "react";
import { Heart, MessageSquare, Send, Loader2 } from "lucide-react";
import { toggleLike, toggleFollow, addComment } from "@/app/actions/social";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface InteractionProps {
  vibeId: string;
  initialLikes: number;
  isLiked: boolean;
  authorId: string;
  isFollowing: boolean;
  currentUserId: string;
}

export function VibeInteractions({
  vibeId,
  initialLikes,
  isLiked,
  authorId,
  isFollowing,
  currentUserId,
}: InteractionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);

  // Optimistic UI for Likes
  const [optimisticLike, addOptimisticLike] = useOptimistic(
    { likesCount: initialLikes, liked: isLiked },
    (state, newLikedValue: boolean) => ({
      likesCount: newLikedValue ? state.likesCount + 1 : state.likesCount - 1,
      liked: newLikedValue,
    })
  );

  // Handle Like with synchronization
  const handleLike = async () => {
    if (isPending) return;

    // Trigger optimistic update
    const nextLikedState = !optimisticLike.liked;
    
    startTransition(async () => {
      addOptimisticLike(nextLikedState);
      
      try {
        const result = await toggleLike(vibeId);
        if (!result?.success) {
          toast.error(result?.error || "Unable to update like");
          router.refresh(); // Sync back to server state
        }
      } catch (error) {
        toast.error("Network error. Please try again.");
        router.refresh();
      }
    });
  };

  // Handle Follow
  const handleFollow = () => {
    startTransition(async () => {
      try {
        const result = await toggleFollow(authorId);
        if (result?.success) {
          toast.success(isFollowing ? "Unfollowed" : "Following");
          router.refresh(); // Ensure UI reflects database state
        } else {
          toast.error(result?.error || "Action failed");
        }
      } catch (error) {
        toast.error("An unexpected error occurred");
      }
    });
  };

  // Handle Comment with Sanitization
  const handleCommentSubmit = async () => {
    const sanitizedComment = commentText.trim();
    if (!sanitizedComment || isCommenting) return;
    
    if (sanitizedComment.length > 500) {
      toast.error("Comment is too long (max 500 characters)");
      return;
    }

    setIsCommenting(true);
    try {
      const result = await addComment(vibeId, sanitizedComment);
      if (result?.success) {
        setCommentText("");
        setCommentOpen(false);
        toast.success("Comment posted");
        router.refresh();
      } else {
        toast.error(result?.error || "Failed to post comment");
      }
    } catch (error) {
      toast.error("Service unavailable");
    } finally {
      setIsCommenting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-6">
        {/* Like Button */}
        <button
          onClick={handleLike}
          disabled={isPending}
          className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors group outline-none"
          aria-label={optimisticLike.liked ? "Unlike" : "Like"}
        >
          <motion.div whileTap={{ scale: 1.4 }} transition={{ type: "spring", stiffness: 400 }}>
            <Heart
              size={18}
              className={`transition-all duration-300 ${
                optimisticLike.liked
                  ? "fill-red-500 text-red-500"
                  : "group-hover:text-red-400"
              }`}
            />
          </motion.div>
          <span className="text-xs font-black tracking-tighter">
            {optimisticLike.likesCount.toLocaleString()}
          </span>
        </button>

        {/* Comment Toggle */}
        <button
          onClick={() => setCommentOpen(!commentOpen)}
          className={`flex items-center gap-2 transition-all font-bold uppercase tracking-widest text-[10px] ${
            commentOpen ? "text-blue-400" : "text-gray-500 hover:text-blue-400"
          }`}
        >
          <MessageSquare size={16} />
          <span>Discuss</span>
        </button>

        {/* Follow Button */}
        {currentUserId !== authorId && (
          <button
            onClick={handleFollow}
            disabled={isPending}
            className={`ml-auto px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 ${
              isFollowing
                ? "bg-white/5 text-gray-500 border border-white/10 hover:bg-white/10"
                : "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500"
            }`}
          >
            {isPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : isFollowing ? (
              "Following"
            ) : (
              "Follow Author"
            )}
          </button>
        )}
      </div>

      {/* Comment Section */}
      <AnimatePresence>
        {commentOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -10 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -10 }}
            className="overflow-hidden"
          >
            <div className="flex gap-3 mt-6 items-center">
              <input
                className="flex-1 bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-xs focus:outline-none focus:border-blue-500/40 text-white placeholder:text-gray-600 transition-all"
                placeholder="Join the discussion..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCommentSubmit()}
                disabled={isCommenting}
                maxLength={500}
              />
              <button
                onClick={handleCommentSubmit}
                disabled={isCommenting || !commentText.trim()}
                className="w-10 h-10 flex items-center justify-center bg-blue-600 rounded-2xl hover:bg-blue-500 transition-all text-white disabled:bg-white/5 disabled:text-gray-600 shadow-lg shadow-blue-600/10"
              >
                {isCommenting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}