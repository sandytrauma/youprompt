import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitizes user input for the Code Vault or Comments.
 * For code, we allow some tags; for comments, we strip everything.
 */
export function sanitizeInput(content: string, type: "code" | "text" = "text") {
  if (type === "text") {
    return DOMPurify.sanitize(content, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  }
  // For Code Vault: allow basic structure but strip <script> and event handlers (onmouseover, etc.)
  return DOMPurify.sanitize(content, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["script", "iframe", "object", "embed"],
    FORBID_ATTR: ["onerror", "onclick", "onload"],
  });
}