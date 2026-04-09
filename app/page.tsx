"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Code2, Zap, Layers, ChevronRight, ShieldAlert, BrainCircuit, Activity } from "lucide-react";

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center overflow-x-hidden selection:bg-blue-500/30">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[800px] pointer-events-none">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full p-6 flex justify-between items-center max-w-7xl z-50 backdrop-blur-md bg-[#0a0a0a]/50 border-b border-white/[0.05]">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            <Zap size={18} fill="white" />
          </div>
          YouPrompt
        </div>
        <div className="flex items-center gap-6">
          <Link href="/documentation" className="hidden md:block text-sm text-gray-400 hover:text-white transition-colors">Documentation</Link>
          <Link 
            href="/login" 
            className="text-sm font-medium hover:bg-white/10 transition-all bg-white/5 px-5 py-2.5 rounded-full border border-white/10"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 text-center px-6 pt-32 md:pt-48 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-8 cursor-default"
          >
            <Sparkles size={12} /> The Future of Vibe Coding is here
          </motion.div>
          
          <h1 className="text-5xl md:text-8xl font-bold tracking-tight mb-8 bg-gradient-to-b from-white via-white to-white/30 bg-clip-text text-transparent">
            Prompt your vision. <br />
            <span className="text-blue-500">Code with vibes.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-gray-400 text-lg md:text-xl mb-12 leading-relaxed">
            Stop struggling with syntax. Generate structured 7-step workflows and precise 
            AI prompts that turn your ideas into production-ready code instantly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-24">
            <Link href="/playground">
              <button className="px-10 py-5 bg-white text-black font-bold rounded-full flex items-center gap-2 hover:bg-gray-200 hover:scale-[1.02] active:scale-95 transition-all group shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                Start Vibe Coding <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <button className="px-10 py-5 bg-transparent border border-white/10 hover:bg-white/5 rounded-full font-semibold transition-all flex items-center gap-2 group">
              View Demo <ChevronRight size={18} className="opacity-50 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </motion.div>

        {/* Major Marketing Section: Emergent Risk Analysis */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto mb-32 relative group"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-[3rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
          <div className="relative bg-[#111] border border-white/10 rounded-[3rem] p-8 md:p-16 overflow-hidden">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="text-left">
                <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20">
                  <ShieldAlert className="text-red-500" size={24} />
                </div>
                <h2 className="text-3xl md:text-5xl font-bold mb-6">
                  Don't just code. <br />
                  <span className="text-red-500">Anticipate.</span>
                </h2>
                <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                  Most AI tools generate code blindly. YouPrompt includes an <strong>Emergent Risk Engine</strong> that analyzes your architecture for security flaws, scalability bottlenecks, and technical debt before you write a single line.
                </p>
                <ul className="space-y-4">
                  {[
                    { icon: <BrainCircuit size={16} />, text: "Predictive scaling analysis" },
                    { icon: <Activity size={16} />, text: "Real-time vulnerability detection" },
                    { icon: <Layers size={16} />, text: "Architectural integrity checks" }
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-medium text-gray-300">
                      <span className="text-red-500/80">{item.icon}</span>
                      {item.text}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                 {/* Mock Risk Analysis UI Element */}
                <div className="bg-black/50 border border-white/5 rounded-2xl p-6 backdrop-blur-xl shadow-2xl rotate-2 group-hover:rotate-0 transition-transform duration-500">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Risk Scan v2.4</span>
                  </div>
                  <div className="space-y-4">
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: "85%" }}
                        transition={{ duration: 1.5, delay: 0.5 }}
                        className="h-full bg-red-500/50" 
                      />
                    </div>
                    <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                      <p className="text-[11px] text-red-400 font-mono">CRITICAL: Neon Serverless connection limit exceeded at 10k users. Consider PgBouncer integration in Step 3.</p>
                    </div>
                    <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                      <p className="text-[11px] text-blue-400 font-mono">ADVICE: Middleware Edge-runtime detected. Use Jose instead of JsonWebToken for Auth.</p>
                    </div>
                  </div>
                </div>
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-600/20 blur-[80px] -z-10" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto"
        >
          <FeatureCard 
            variants={itemVariants}
            icon={<Layers className="text-blue-400" />}
            title="7-Step Roadmaps"
            desc="Structured processes designed to keep AI generators focused and accurate, eliminating hallucinations."
          />
          <FeatureCard 
            variants={itemVariants}
            icon={<Code2 className="text-purple-400" />}
            title="Precise Prompts"
            desc="Expertly crafted prompts optimized for tools like v0, Bolt, or Lovable to ensure 1:1 code execution."
          />
          <FeatureCard 
            variants={itemVariants}
            icon={<Zap className="text-yellow-400" />}
            title="Milestone History"
            desc="Auto-versioning for your vibes. Roll back to any design stage or branch out into new ideas instantly."
          />
        </motion.div>
      </main>

      <footer className="w-full max-w-7xl mt-auto py-12 px-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-gray-500 text-sm">
        <div className="flex items-center gap-2 font-bold text-white opacity-80">
          <Zap size={14} className="text-blue-500" /> YouPrompt
        </div>
        <div className="flex gap-8">
          <Link href="#" className="hover:text-white transition-colors">Twitter</Link>
          <Link href="#" className="hover:text-white transition-colors">GitHub</Link>
          <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
        </div>
        <p>© 2026 YouPrompt AI. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc, variants }: { icon: React.ReactNode, title: string, desc: string, variants: any }) {
  return (
    <motion.div 
      variants={variants}
      className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/[0.08] text-left hover:bg-white/[0.05] hover:border-blue-500/20 transition-all group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
        {icon}
      </div>
      <div className="mb-6 p-4 bg-white/5 rounded-2xl w-fit group-hover:scale-110 group-hover:bg-blue-500/10 transition-all duration-500">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-gray-500 text-base leading-relaxed">{desc}</p>
    </motion.div>
  );
}