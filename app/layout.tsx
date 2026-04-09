import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast"; // Or your preferred toast library

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "YouPrompt | Vibe Code Your Next App",
  description: "Generate structured 7-step workflows and precise AI prompts to build apps at the speed of thought.",
  icons: {
    icon: "/favicon.ico", // Ensure you have this in your /public folder
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
      suppressHydrationWarning // Prevents hydration mismatch warnings with dark mode/extensions
    >
      <body className="bg-[#0a0a0a] text-white selection:bg-blue-500/30 min-h-screen">
        <Providers>
          {children}
          {/* Global Toast notifications for Auth and Workflow errors */}
          <Toaster 
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#111',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: '14px',
                borderRadius: '12px'
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}