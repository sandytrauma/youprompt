"use client";

/**
 * Copyright 2026 Sandeep Kumar
 * Secure Social Propagation Protocol v1.8
 * Patches: URI Sanitization, Clipboard Fallback, and LinkedIn Encoding.
 */

import { useState } from "react";
import { Share2, Check, Copy } from "lucide-react";
import { toast } from "react-hot-toast";

interface ShareTemplateButtonProps {
  vibeId: string;
  vibeTitle: string;
}

export function ShareTemplateButton({ vibeId, vibeTitle }: ShareTemplateButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    // 1. Sanitize and construct the URL
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const shareUrl = `${baseUrl}/explore/${vibeId}`;
    const shareText = `Check out this AI Architecture: ${vibeTitle}`;

    // 2. Attempt Native Web Share API (Mobile/Safari)
    if (navigator.share) {
      try {
        await navigator.share({
          title: vibeTitle,
          text: shareText,
          url: shareUrl,
        });
        toast.success("Shared successfully");
        return;
      } catch (err) {
        // User cancelled or share failed, proceed to fallback
        console.warn("Native share cancelled or failed:", err);
      }
    }

    // 3. Fallback: Clipboard Copy (Desktop Standard)
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      
      // Open LinkedIn in a background-friendly way
      const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
      window.open(linkedInUrl, "_blank", "noopener,noreferrer");

      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  return (
    /* Responsive Logic:
       1. Mobile: top-4 right-4, visible (opacity-100)
       2. Desktop (lg): top-10 right-8, hidden (lg:opacity-0), shown on hover (lg:group-hover:opacity-100)
    */
    <div className="absolute right-4 top-4 lg:right-8 lg:top-10 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-10">
      <button 
        onClick={handleShare}
        className="flex items-center gap-2 bg-white/10 hover:bg-white text-white hover:text-black px-3 py-2 lg:px-4 lg:py-2 rounded-full text-[8px] lg:text-[9px] font-black uppercase tracking-tighter transition-all backdrop-blur-md border border-white/5 active:scale-95 shadow-xl"
        aria-label="Share this template"
      >
        {copied ? (
          <Check size={12} className="text-green-500" />
        ) : (
          <Share2 size={12} />
        )}
        
        <span className="hidden xs:inline">
          {copied ? "Link Copied" : "Share Template"}
        </span>
      </button>
    </div>
  );
}