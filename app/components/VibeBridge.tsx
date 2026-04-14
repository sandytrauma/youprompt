// components/VibeBridge.tsx
"use client";

import { ExternalLink, Terminal, Cpu, Zap, Box } from "lucide-react";
import { toast } from "sonner";

export function VibeBridge({ fullPrompt }: { fullPrompt: string }) {
  const shipToTool = (url: string, toolName: string) => {
    if (!fullPrompt) {
      toast.error("No vibe generated yet!");
      return;
    }
    navigator.clipboard.writeText(fullPrompt);
    toast.success(`Copied for ${toolName}!`, {
      description: "Opening tool... paste the prompt to start building.",
    });
    setTimeout(() => window.open(url, "_blank"), 800);
  };

  const bridgeTools = [
    { name: "v0.dev", url: "https://v0.dev", icon: <Terminal size={14} />, color: "text-pink-500", border: "hover:border-pink-500/50" },
    { name: "Bolt.new", url: "https://bolt.new", icon: <Zap size={14} />, color: "text-orange-500", border: "hover:border-orange-500/50" },
    { name: "Cursor", url: "https://cursor.com", icon: <Cpu size={14} />, color: "text-cyan-400", border: "hover:border-cyan-500/50" },
    { name: "Lovable", url: "https://lovable.dev", icon: <Box size={14} />, color: "text-yellow-400", border: "hover:border-yellow-500/50" },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Deploy to IDE</h3>
      <div className="grid grid-cols-2 gap-2">
        {bridgeTools.map((tool) => (
          <button 
            key={tool.name}
            onClick={() => shipToTool(tool.url, tool.name)}
            className={`flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 transition-all group ${tool.border}`}
          >
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tighter">
              <span className={tool.color}>{tool.icon}</span> {tool.name}
            </div>
            <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 text-gray-500" />
          </button>
        ))}
      </div>
    </div>
  );
}