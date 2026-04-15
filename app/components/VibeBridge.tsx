"use client";

/**
 * Copyright 2026 Sandeep Kumar
 * IDE Deployment Bridge v2.0
 * Patches: Opener-Security (Tab-Nabbing), Async Clipboard Sync, and SSR Safety.
 */

import { ExternalLink, Terminal, Cpu, Zap, Box } from "lucide-react";
import { toast } from "sonner";

interface VibeBridgeProps {
  fullPrompt: string | null | undefined;
}

export function VibeBridge({ fullPrompt }: VibeBridgeProps) {
  /**
   * Securely handles the transfer of data to external IDEs.
   * Prevents window.opener hijacking and ensures clipboard persistence.
   */
  const shipToTool = async (url: string, toolName: string) => {
    // 1. Validation & Input Sanitization
    const sanitizedPrompt = fullPrompt?.trim();

    if (!sanitizedPrompt) {
      toast.error("No vibe generated yet!", {
        description: "Generate a complete architecture before deploying.",
      });
      return;
    }

    try {
      // 2. Async Clipboard Write with high-priority feedback
      await navigator.clipboard.writeText(sanitizedPrompt);
      
      toast.success(`Copied for ${toolName}!`, {
        description: "Opening tool... paste the prompt to start building.",
      });

      // 3. Secure Window Redirection (rel="noopener noreferrer" simulation)
      // Using a small delay to ensure the toast and clipboard operation complete
      setTimeout(() => {
        const newWindow = window.open(url, "_blank", "noopener,noreferrer");
        if (newWindow) {
          newWindow.focus();
        } else {
          toast.error("Popup blocked!", {
            description: "Please allow popups to deploy to IDEs automatically.",
          });
        }
      }, 600);
      
    } catch (err) {
      console.error("[BRIDGE_ERROR]:", err);
      toast.error("Action Failed", {
        description: "Browser denied clipboard access. Please copy manually.",
      });
    }
  };

  const bridgeTools = [
    { 
      name: "v0.dev", 
      url: "https://v0.dev", 
      icon: <Terminal size={14} />, 
      color: "text-pink-500", 
      border: "hover:border-pink-500/50" 
    },
    { 
      name: "Bolt.new", 
      url: "https://bolt.new", 
      icon: <Zap size={14} />, 
      color: "text-orange-500", 
      border: "hover:border-orange-500/50" 
    },
    { 
      name: "Cursor", 
      url: "https://cursor.com", 
      icon: <Cpu size={14} />, 
      color: "text-cyan-400", 
      border: "hover:border-cyan-500/50" 
    },
    { 
      name: "Lovable", 
      url: "https://lovable.dev", 
      icon: <Box size={14} />, 
      color: "text-yellow-400", 
      border: "hover:border-yellow-500/50" 
    },
  ] as const;

  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">
        Deploy to IDE
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {bridgeTools.map((tool) => (
          <button 
            key={tool.name}
            onClick={() => shipToTool(tool.url, tool.name)}
            className={`
              flex items-center justify-between p-3 rounded-xl bg-white/[0.03] 
              border border-white/5 transition-all group outline-none 
              focus:ring-1 focus:ring-white/20 active:scale-95 ${tool.border}
            `}
          >
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tighter">
              <span className={tool.color}>{tool.icon}</span> 
              <span className="text-gray-300 group-hover:text-white transition-colors">
                {tool.name}
              </span>
            </div>
            <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 text-gray-500 transition-opacity" />
          </button>
        ))}
      </div>
    </div>
  );
}