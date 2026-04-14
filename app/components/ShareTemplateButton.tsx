"use client";

import { Share2 } from "lucide-react";

interface ShareTemplateButtonProps {
  vibeId: string;
  vibeTitle: string;
}

export function ShareTemplateButton({ vibeId, vibeTitle }: ShareTemplateButtonProps) {
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
    <div className="absolute right-8 top-10 opacity-0 group-hover:opacity-100 transition-opacity">
      <button 
        onClick={handleShare}
        className="flex items-center gap-2 bg-white/10 hover:bg-white text-white hover:text-black px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all"
      >
        <Share2 size={12} /> Share Template
      </button>
    </div>
  );
}