"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LayoutGrid, Terminal, Globe, LogIn, Sparkles } from "lucide-react";

export function Navigation() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isLoading = status === "loading";

  // Configuration for links
  const navItems = [
    {
      name: "Explore",
      href: "/explore",
      icon: Globe,
      show: true, // Always visible as the social hub
    },
    {
      name: "Playground",
      href: "/playground",
      icon: Terminal,
      show: !!session, // Only show for logged-in users
    },
    {
      name: "My Library",
      href: "/dashboard",
      icon: LayoutGrid,
      show: !!session,
    },
  ];

  return (
    <nav className="fixed left-0 top-0 h-screen w-64 bg-[#0a0a0a] border-r border-white/10 p-6 flex flex-col gap-8 z-50">
      {/* Logo Section */}
      <div className="flex items-center gap-3 px-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Sparkles size={18} className="text-white" />
        </div>
        <span className="font-bold text-xl tracking-tight text-white">YouPrompt</span>
      </div>

      {/* Links Section */}
      <div className="flex flex-col gap-2 flex-1">
        {isLoading ? (
          // Skeleton loader while session is checking
          [1, 2, 3].map((i) => (
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

      {/* Bottom Auth Action */}
      <div className="pt-6 border-t border-white/5">
        {!session && !isLoading ? (
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-white hover:bg-white/10 transition-all"
          >
            <LogIn size={16} />
            Sign In
          </Link>
        ) : session ? (
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white truncate w-32">
                {session.user.name}
              </span>
              <span className="text-[10px] text-gray-500 uppercase font-bold">
                {session.user.plan} Plan
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </nav>
  );
}