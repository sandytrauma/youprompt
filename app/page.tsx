"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Code2, Zap, Layers, ChevronRight, ShieldAlert, BrainCircuit, Activity } from "lucide-react";
import DemoModal from "./components/ViewDemo";

/**
 * ScrambledRain Component
 * Vertical shower with stable, non-bright colors.
 * Characters fade in from top and remain at a constant, soft opacity.
 */
function ScrambledRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";
    const fontSize = 14;
    const columns = Math.floor(width / fontSize);
    const drops: number[] = new Array(columns).fill(0);

    const draw = () => {
      // Stable background refresh
      ctx.fillStyle = "rgba(10, 10, 10, 0.15)";
      ctx.fillRect(0, 0, width, height);

      // Set a stable, subtle blue (no shadows or glow)
      ctx.font = `${fontSize}px monospace`;
      
      for (let i = 0; i < drops.length; i++) {
        const text = characters.charAt(Math.floor(Math.random() * characters.length));
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Calculate a smooth alpha that is stable once it leaves the very top
        const opacity = Math.min((y / height) * 0.3, 0.2); 
        
        ctx.fillStyle = `rgba(37, 99, 235, ${opacity})`;
        ctx.fillText(text, x, y);

        // Reset drop to top
        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 50);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
}

export default function LandingPage() {
  const [isDemoOpen, setIsDemoOpen] = useState(false);

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
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center overflow-x-hidden selection:bg-blue-500/30 relative">
      
      {/* Scrambled Alphabet Shower */}
      <ScrambledRain />

      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[800px] pointer-events-none z-1">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[300px] sm:w-[1000px] h-[300px] sm:h-[600px] bg-blue-600/10 blur-[80px] sm:blur-[120px] rounded-full" />
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full p-4 md:p-6 flex justify-between items-center max-w-7xl z-50 backdrop-blur-md bg-[#0a0a0a]/50 border-b border-white/[0.05]">
        <div className="flex items-center gap-2 font-bold text-lg md:text-xl tracking-tighter">
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            <Zap size={16} fill="white" />
          </div>
          YouPrompt
        </div>
        <div className="flex items-center gap-3 md:gap-6">
          <Link href="/documentation" className="hidden md:block text-sm text-gray-400 hover:text-white transition-colors">Documentation</Link>
          <Link 
            href="/login" 
            className="text-xs md:text-sm font-medium hover:bg-white/10 transition-all bg-white/5 px-4 md:px-5 py-2 md:py-2.5 rounded-full border border-white/10"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 text-center px-4 md:px-6 pt-24 md:pt-48 pb-20 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, base: [0.16, 1, 0.3, 1] }}
        >
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] md:text-xs font-medium mb-6 md:mb-8 cursor-default"
          >
            <Sparkles size={12} /> The Future of Vibe Coding is here
          </motion.div>
          
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold tracking-tight mb-6 md:mb-8 bg-gradient-to-b from-white via-white to-white/30 bg-clip-text text-transparent leading-[1.1]">
            Prompt your vision. <br className="hidden sm:block" />
            <span className="text-blue-500">Code with vibes.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-gray-400 text-base md:text-xl mb-10 md:mb-12 leading-relaxed">
            Stop struggling with syntax. Generate structured 7-step workflows and precise 
            AI prompts that turn your ideas into production-ready code instantly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 md:mb-24">
            <Link href="/playground" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-10 py-4 md:py-5 bg-white text-black font-bold rounded-full flex items-center justify-center gap-2 hover:bg-gray-200 hover:scale-[1.02] active:scale-95 transition-all group shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                Start Vibe Coding <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <button 
              onClick={() => setIsDemoOpen(true)}
              className="w-full sm:w-auto px-10 py-4 md:py-5 bg-transparent border border-white/10 hover:bg-white/5 rounded-full font-semibold transition-all flex items-center justify-center gap-2 group"
            >
              View Demo <ChevronRight size={18} className="opacity-50 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </motion.div>

        {/* Marketing Section: Emergent Risk Analysis */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto mb-20 md:mb-32 relative group w-full"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-[2rem] md:rounded-[3rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
          <div className="relative bg-[#111] border border-white/10 rounded-[2rem] md:rounded-[3rem] p-6 md:p-16 overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-10 md:gap-12 items-center">
              <div className="text-left order-2 lg:order-1">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-red-500/10 rounded-xl md:rounded-2xl flex items-center justify-center mb-6 border border-red-500/20">
                  <ShieldAlert className="text-red-500" size={20} />
                </div>
                <h2 className="text-2xl md:text-5xl font-bold mb-4 md:mb-6 leading-tight">
                  Don't just code. <br />
                  <span className="text-red-500">Anticipate.</span>
                </h2>
                <p className="text-gray-400 text-sm md:text-lg mb-6 md:mb-8 leading-relaxed">
                  Most AI tools generate code blindly. YouPrompt includes an <strong>Emergent Risk Engine</strong> that analyzes your architecture for security flaws, scalability bottlenecks, and technical debt.
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 md:gap-4">
                  {[
                    { icon: <BrainCircuit size={16} />, text: "Predictive scaling analysis" },
                    { icon: <Activity size={16} />, text: "Real-time vulnerability detection" },
                    { icon: <Layers size={16} />, text: "Architectural integrity checks" }
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-xs md:text-sm font-medium text-gray-300">
                      <span className="text-red-500/80 shrink-0">{item.icon}</span>
                      {item.text}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative order-1 lg:order-2">
                <div className="bg-black/50 border border-white/5 rounded-xl md:rounded-2xl p-4 md:p-6 backdrop-blur-xl shadow-2xl lg:rotate-2 group-hover:rotate-0 transition-transform duration-500">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                    </div>
                    <span className="text-[8px] md:text-[10px] text-gray-500 font-mono uppercase tracking-widest">Risk Scan v2.4</span>
                  </div>
                  <div className="space-y-3 md:space-y-4 text-left">
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: "85%" }}
                        transition={{ duration: 1.5, delay: 0.5 }}
                        className="h-full bg-red-500/50" 
                      />
                    </div>
                    <div className="p-2 md:p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                      <p className="text-[9px] md:text-[11px] text-red-400 font-mono leading-tight">CRITICAL: Neon Serverless connection limit exceeded at 10k users. Consider PgBouncer.</p>
                    </div>
                    <div className="p-2 md:p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                      <p className="text-[9px] md:text-[11px] text-blue-400 font-mono leading-tight">ADVICE: Middleware Edge-runtime detected. Use Jose instead of JsonWebToken.</p>
                    </div>
                  </div>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 md:w-64 h-48 md:h-64 bg-red-600/20 blur-[60px] md:blur-[80px] -z-10" />
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto w-full"
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

      <footer className="w-full max-w-7xl mt-auto py-8 md:py-12 px-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-gray-500 text-xs md:text-sm relative z-10">
        <div className="flex items-center gap-2 font-bold text-white opacity-80">
          <Zap size={14} className="text-blue-500" /> YouPrompt
        </div>
        <div className="flex gap-6 md:gap-8">
          <Link href="#" className="hover:text-white transition-colors">Twitter</Link>
          <Link href="#" className="hover:text-white transition-colors">GitHub</Link>
          <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
        </div>
        <p className="text-center md:text-right">© 2026 YouPrompt AI. All rights reserved.</p>
      </footer>

      {/* Separated Demo Modal Component */}
      <DemoModal isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />
    </div>
  );
}

function FeatureCard({ icon, title, desc, variants }: { icon: React.ReactNode, title: string, desc: string, variants: any }) {
  return (
    <motion.div 
      variants={variants}
      className="p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] bg-white/[0.03] border border-white/[0.08] text-left hover:bg-white/[0.05] hover:border-blue-500/20 transition-all group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity hidden sm:block">
        {icon}
      </div>
      <div className="mb-4 md:mb-6 p-3 md:p-4 bg-white/5 rounded-xl md:rounded-2xl w-fit group-hover:scale-110 group-hover:bg-blue-500/10 transition-all duration-500">
        {icon}
      </div>
      <h3 className="text-lg md:text-xl font-semibold mb-2 md:mb-3">{title}</h3>
      <p className="text-gray-500 text-sm md:text-base leading-relaxed">{desc}</p>
    </motion.div>
  );
}