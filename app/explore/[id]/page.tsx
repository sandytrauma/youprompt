import { getPublicVibe } from "@/app/actions/workflow";
import { notFound } from "next/navigation";

// Define the shape of your steps for better DX
interface VibeStep {
  objective: string;
  precisePrompt: string;
}

// In Next.js 14.x/15.x, params should be treated as a Promise
export default async function SharedVibePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // Await the params first
  const { id } = await params;

  // Use the public fetcher with the resolved ID
  const vibe = await getPublicVibe(id);

  if (!vibe) {
    notFound();
  }

  // Cast the JSONB field safely
  const steps = (vibe.steps as unknown as VibeStep[]) || [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12 lg:p-20 font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-3xl mx-auto">
        {/* Header Section */}
        <header className="mb-16">
          <div className="inline-block px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-6">
            Public Blueprint
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight italic uppercase">
            {vibe.title}
          </h1>
          <div className="h-1 w-20 bg-blue-600 mt-4 rounded-full" />
        </header>
        
        {/* Steps Logic */}
        <div className="space-y-12">
          {steps.length > 0 ? (
            steps.map((step, i) => (
              <div key={i} className="group relative">
                <div className="absolute -left-4 top-0 bottom-0 w-[2px] bg-gradient-to-b from-blue-600 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                
                <h2 className="text-blue-500 font-black uppercase text-[11px] tracking-[0.2em] mb-3">
                  Phase {i + 1} // {step.objective}
                </h2>
                
                <div className="bg-[#111] border border-white/5 rounded-2xl p-6 shadow-2xl overflow-hidden">
                  <pre className="text-gray-400 font-mono text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {step.precisePrompt}
                  </pre>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic">No steps defined for this blueprint.</p>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-white/5 text-center">
          <p className="text-gray-600 text-[10px] uppercase tracking-widest font-bold">
            Generated via YouPrompt Engine
          </p>
        </footer>
      </div>
    </div>
  );
}