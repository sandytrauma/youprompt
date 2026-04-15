"use client";

/**
 * Copyright 2026 Sandeep Kumar
 * Enterprise Navigation Architecture v2.2
 * Patches: Session Type Augmentation, Mobile-Responsive Blocking, and Hydration Safety.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  LayoutGrid, 
  Terminal, 
  Globe, 
  LogIn, 
  Sparkles,
  Menu,
  X 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Typesafety for custom session properties
interface CustomUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  plan?: string; // Standard, Pro, or Ultra
}

export function Navigation() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isLoading = status === "loading";
  const user = session?.user as CustomUser;

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navItems = [
    {
      name: "Explore",
      href: "/explore",
      icon: Globe,
      show: true,
    },
    {
      name: "Playground",
      href: "/playground",
      icon: Terminal,
      show: !!session,
    },
    {
      name: "My Library",
      href: "/dashboard",
      icon: LayoutGrid,
      show: !!session,
    },
  ];

  if (!mounted) return null;

  return (
    <>
      {/* Mobile Header Toggle (Visible only < 1024px) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0a0a0a] border-b border-white/10 px-6 flex items-center justify-between z-[60] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Sparkles size={18} className="text-white" />
          </div>
          <span className="font-bold text-lg text-white">YouPrompt</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <nav className={`
        fixed left-0 top-0 h-screen w-64 bg-[#0a0a0a] border-r border-white/10 p-6 flex flex-col gap-8 z-50
        transition-transform duration-300 lg:translate-x-0
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Logo Section (Desktop) */}
        <div className="hidden lg:flex items-center gap-3 px-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            <Sparkles size={18} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">YouPrompt</span>
        </div>

        {/* Links Section */}
        <div className="flex flex-col gap-2 flex-1 mt-16 lg:mt-0">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 w-full animate-pulse bg-white/5 rounded-xl" />
            ))
          ) : (
            navItems.map((item) => {
              if (!item.show) return null;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300
                    ${isActive 
                      ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.2)]" 
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }
                  `}
                >
                  <item.icon size={18} className={isActive ? "scale-110" : ""} />
                  {item.name}
                </Link>
              );
            })
          )}
        </div>

        {/* User / Auth Section */}
        <div className="pt-6 border-t border-white/5">
          {!session && !isLoading ? (
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white text-black font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all shadow-lg active:scale-95"
            >
              <LogIn size={16} />
              Sign In
            </Link>
          ) : session ? (
            <div className="flex items-center gap-3 px-2 bg-white/[0.03] p-3 rounded-2xl border border-white/5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex-shrink-0 border border-white/10" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-white truncate">
                  {user.name || "User Account"}
                </span>
                <span className="text-[9px] text-blue-400 uppercase font-black tracking-tighter mt-0.5">
                  {user.plan || "Free"} Plan
                </span>
              </div>
            </div>
          ) : (
            <div className="h-12 w-full animate-pulse bg-white/5 rounded-xl" />
          )}
        </div>
      </nav>

      {/* Overlay for mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>
    </>
  );
}