/**
 * lib/sanitizer.ts - SERVER-SAFE SANITIZATION
 * 
 * This module provides basic server-side text sanitization
 * that doesn't depend on DOM or jsdom.
 * 
 * For advanced HTML sanitization, use client-side sanitization
 * with DOMPurify in browser (see lib/client-sanitizer.ts)
 */

/**
 * Basic server-side text sanitization
 * Strips common XSS patterns without DOM parsing
 */
export function sanitizeInput(content: string, type: "code" | "text" = "text"): string {
  if (!content) return "";
  
  if (type === "text") {
    // For plain text: remove script tags and event handlers
    let sanitized = content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove <script> tags
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "") // Remove event handlers like onclick="..."
      .replace(/on\w+\s*=\s*[^\s>]*/gi, "") // Remove event handlers without quotes
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "") // Remove iframes
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "") // Remove object tags
      .replace(/<embed\b[^<]*\/?>/gi, ""); // Remove embed tags
    
    return sanitized;
  }
  
  // For code type: more permissive but still strip dangerous patterns
  let sanitized = content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/on\w+\s*=\s*[^\s>]*/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");
  
  return sanitized;
}

/**
 * Escape HTML special characters for safe text display
 * Use this when you DON'T want to render HTML at all
 */
export function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Check if content looks suspicious (heuristic check)
 * Use for validation before storing in DB
 */
export function isSuspiciousContent(content: string): boolean {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\(/i,
    /expression\(/i,
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(content));
}