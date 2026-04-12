"use client";

import { Heart, MessageSquare, Send, Loader2 } from "lucide-react";
import { toggleLike, toggleFollow, addComment } from "@/app/actions/social";
import { useState, useTransition, useOptimistic } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

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
  const [isPending, startTransition] = useTransition();
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);

  // Optimistic UI for Likes to make it feel instant
  const [optimisticLike, addOptimisticLike] = useOptimistic(
    { likesCount: initialLikes, liked: isLiked },
    (state, newLikedValue: boolean) => ({
      likesCount: newLikedValue ? state.likesCount + 1 : state.likesCount - 1,
      liked: newLikedValue,
    })
  );

  const handleLike = () => {
    // Prevent multiple clicks during transition
    if (isPending) return;

    startTransition(async () => {
      // Apply immediate UI change
      addOptimisticLike(!optimisticLike.liked);
      
      const result = await toggleLike(vibeId);
      if (result && !result.success) {
        toast.error("Failed to update like");
      }
    });
  };

  const handleFollow = () => {
    startTransition(async () => {
      const result = await toggleFollow(authorId);
      if (result && result.success) {
        toast.success(isFollowing ? "Unfollowed user" : "Following user");
      } else if (result?.error) {
        toast.error(result.error);
      }
    });
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim() || isCommenting) return;

    setIsCommenting(true);
    try {
      const result = await addComment(vibeId, commentText);
      if (result && result.success) {
        setCommentText("");
        setCommentOpen(false);
        toast.success("Comment added!");
      } else {
        toast.error("Failed to add comment");
      }
    } catch (error) {
      toast.error("Something went wrong");
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
          className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors group"
        >
          <motion.div whileTap={{ scale: 1.4 }}>
            <Heart
              size={18}
              className={`transition-all ${
                optimisticLike.liked
                  ? "fill-red-500 text-red-500"
                  : "group-hover:text-red-400"
              }`}
            />
          </motion.div>
          <span className="text-xs font-medium">{optimisticLike.likesCount}</span>
        </button>

        {/* Comment Toggle Button */}
        <button
          onClick={() => setCommentOpen(!commentOpen)}
          className={`flex items-center gap-2 transition-colors ${
            commentOpen ? "text-blue-400" : "text-gray-400 hover:text-blue-400"
          }`}
        >
          <MessageSquare size={18} />
          <span className="text-xs font-medium">Discuss</span>
        </button>

        {/* Follow Button - Only shown if not the author */}
        {currentUserId !== authorId && (
          <button
            onClick={handleFollow}
            disabled={isPending}
            className={`ml-auto px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 ${
              isFollowing
                ? "bg-white/10 text-gray-400 hover:bg-white/20"
                : "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:bg-blue-500"
            }`}
          >
            {isPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : isFollowing ? (
              "Following"
            ) : (
              "Follow"
            )}
          </button>
        )}
      </div>

      {/* Expandable Comment Input */}
      <AnimatePresence>
        {commentOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 mt-6">
              <input
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-xs focus:outline-none focus:border-blue-500/50 text-white placeholder:text-gray-600"
                placeholder="Share your thoughts..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCommentSubmit();
                }}
                disabled={isCommenting}
              />
              <button
                onClick={handleCommentSubmit}
                disabled={isCommenting || !commentText.trim()}
                className="p-2 bg-blue-600 rounded-full hover:bg-blue-500 transition-colors text-white disabled:bg-gray-700 disabled:text-gray-400"
              >
                {isCommenting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}