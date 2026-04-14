"use client";
import { Share2 } from "lucide-react";

export function ShareTemplateButton({ vibeId, vibeTitle }: { vibeId: string, vibeTitle: string }) {
  const handleShare = () => {
    const shareUrl = `${window.location.origin}/explore/${vibeId}`;
    if (navigator.share) {
      navigator.share({ 
        title: vibeTitle, 
        text: `Check out this AI Architecture: ${vibeTitle}`,
        url: shareUrl 
      }).catch(() => {});
    } else {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`);
    }
  };

  return (
    /* Change: 
       1. Added 'lg:opacity-0' -> Hidden by default only on large screens.
       2. Added 'opacity-100' -> Visible by default on mobile.
       3. Adjusted positioning for mobile (top-4 right-4).
    */
    <div className="absolute right-4 top-4 lg:right-8 lg:top-10 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-10">
      <button 
        onClick={handleShare}
        className="flex items-center gap-2 bg-white/10 hover:bg-white text-white hover:text-black px-3 py-2 lg:px-4 lg:py-2 rounded-full text-[8px] lg:text-[9px] font-black uppercase tracking-tighter transition-all backdrop-blur-md border border-white/5"
      >
        <Share2 size={12} /> <span className="hidden xs:inline">Share Template</span>
      </button>
    </div>
  );
}