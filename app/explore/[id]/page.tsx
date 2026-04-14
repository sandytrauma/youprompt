import { getPublicVibe } from "@/app/actions/workflow";
import { notFound } from "next/navigation";

export default async function SharedVibePage({ params }: { params: { id: string } }) {
  // Use the public fetcher
  const vibe = await getPublicVibe(params.id);

  if (!vibe) {
    notFound(); // This handles the 404 if the ID is wrong
  }

  const steps = vibe.steps as any[];

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-black mb-10 tracking-tight">
          {vibe.title}
        </h1>
        
        <div className="space-y-8">
          {steps.map((step, i) => (
            <div key={i} className="border-l-2 border-blue-600 pl-6 py-2">
              <h2 className="text-blue-400 font-bold uppercase text-xs tracking-widest mb-2">
                Step {i + 1}: {step.objective}
              </h2>
              <p className="text-gray-400 font-mono text-sm leading-relaxed">
                {step.precisePrompt}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}