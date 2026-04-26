/**
 * lib/client-sanitizer.ts - CLIENT-SIDE SANITIZATION
 * 
 * This module uses DOMPurify in the browser for advanced HTML sanitization.
 * IMPORTANT: Only use this in client components ("use client")
 * Never import this in server-side code!
 */

"use client";

import DOMPurify from "dompurify";

/**
 * Client-side HTML sanitization using DOMPurify
 * Only works in browser, never call from server
 */
export function sanitizeHtml(html: string, type: "strict" | "permissive" = "strict"): string {
  if (!html) return "";
  
  if (type === "strict") {
    // Strict mode: no tags allowed
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });
  }
  
  // Permissive mode: allow some formatting tags
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "b", "i", "em", "strong", "a", "p", "br", "ul", "ol", "li",
      "code", "pre", "blockquote", "h1", "h2", "h3", "h4", "h5", "h6"
    ],
    ALLOWED_ATTR: ["href", "title", "target"],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize plain text comments (strip all HTML)
 */
export function sanitizeComment(text: string): string {
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize code vault content (allow pre/code tags)
 */
export function sanitizeCodeVault(code: string): string {
  return DOMPurify.sanitize(code, {
    ALLOWED_TAGS: ["code", "pre", "span", "div"],
    ALLOWED_ATTR: ["class"],
  });
}