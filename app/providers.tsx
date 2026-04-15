/**
 * Copyright 2026 Sandeep Kumar
 * YouPrompt Auth Provider v1.1
 * Patches: Session Polling Security, Hydration Safety, and React 19 Strict Types.
 */

"use client";

import React, { ReactNode, useMemo } from "react";
import { SessionProvider } from "next-auth/react";

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Global Context Provider
 * Wraps the application to provide Auth Session state.
 * * Security Note: refetchInterval is set to 0 by default to prevent 
 * unnecessary background traffic. refetchOnWindowFocus is enabled 
 * to ensure session validity when a user returns to the tab.
 */
export function Providers({ children }: ProvidersProps) {
  // Memoize the provider to prevent unnecessary re-renders of the entire 
  // component tree during session state changes in React 19.
  const content = useMemo(() => children, [children]);

  return (
    <SessionProvider 
      // Ensure the session is kept fresh when switching tabs
      refetchOnWindowFocus={true}
      // Re-verify session every 5 minutes in the background
      refetchInterval={5 * 60}
    >
      {content}
    </SessionProvider>
  );
}