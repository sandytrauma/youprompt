/**
 * Copyright 2026 Sandeep Kumar
 * YouPrompt Global Layout Engine v1.2
 * Patches: Accessibility Zooming, Font Fallbacks, and Hydration Safety.
 */

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";

// Configure Geist Sans with system fallbacks for reliability
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: true,
});

// Configure Geist Mono for code blocks and terminal vibes
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: true,
});

/**
 * Viewport Configuration
 * Note: maximumScale: 1 is removed to comply with accessibility standards (WCAG).
 * We allow user zooming while maintaining a professional 1:1 initial scale.
 */
export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
};

/**
 * Enhanced Metadata
 * Optimized for SEO and Social Graph (OpenGraph) sharing.
 */
export const metadata: Metadata = {
  title: {
    default: "YouPrompt | Vibe Code Your Next App",
    template: "%s | YouPrompt"
  },
  description: "Generate structured 7-step workflows and precise AI prompts to build apps at the speed of thought.",
  metadataBase: new URL("https://youprompt.vercel.app"),
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "YouPrompt",
    description: "Architect applications at the speed of thought.",
    url: "https://youprompt.vercel.app",
    siteName: "YouPrompt AI",
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark antialiased`}
      style={{ colorScheme: 'dark' }}
      suppressHydrationWarning 
    >
      <body className="bg-[#0a0a0a] text-white selection:bg-blue-500/30 min-h-screen font-sans">
        <Providers>
          {/* Core Layout Wrapper 
              The relative flex container ensures that sidebars (History/Explore) 
              can be positioned absolutely or fixed relative to the viewport.
          */}
          <div className="relative flex min-h-screen overflow-x-hidden">
            <main className="flex-1 w-full flex flex-col">
              {children}
            </main>
          </div>

          {/* Global Notification System 
              Customized to match the YouPrompt "Dark Vibe" aesthetic.
          */}
          <Toaster 
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#0d0d0d',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.08)',
                fontSize: '13px',
                fontWeight: '600',
                borderRadius: '16px',
                padding: '12px 16px',
                boxShadow: '0 10px 30px -5px rgba(0,0,0,0.5)',
              },
              success: {
                iconTheme: {
                  primary: '#2563eb', // Blue-600 to match branding
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}