import type { HostToast } from "../host.js";

export interface CopyToClipboardOptions {
  toast?: HostToast;
  toastMessage?: string;
}

/**
 * Robust cross-platform clipboard copy helper for Paseo plugins.
 * Works seamlessly across React Native (Hermes / mobile), web, and desktop.
 *
 * Precedence:
 * 1. React Native's Clipboard (react-native / react-native-web)
 * 2. Web navigator.clipboard.writeText (modern secure web contexts)
 * 3. Fallback: document.execCommand("copy") (older web / non-secure contexts)
 */
export async function copyToClipboard(
  text: string,
  options?: CopyToClipboardOptions,
): Promise<boolean> {
  if (text === null || text === undefined) return false;
  const str = String(text);
  let success = false;

  // 1. Try React Native Clipboard (works in React Native / react-native-web)
  try {
    const rn = require("react-native");
    if (rn?.Clipboard?.setString) {
      rn.Clipboard.setString(str);
      success = true;
    }
  } catch {
    // Ignore require error if not in RN context
  }

  // 2. Try modern Web navigator.clipboard
  if (!success) {
    try {
      const globalObj = typeof globalThis !== "undefined" ? (globalThis as any) : {};
      if (globalObj.navigator?.clipboard?.writeText) {
        await globalObj.navigator.clipboard.writeText(str);
        success = true;
      }
    } catch {
      // Ignore web clipboard error
    }
  }

  // 3. Try document.execCommand fallback
  if (!success) {
    try {
      const globalObj = typeof globalThis !== "undefined" ? (globalThis as any) : {};
      const doc = globalObj.document;
      if (doc?.createElement && doc?.body) {
        const textarea = doc.createElement("textarea");
        textarea.value = str;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        textarea.style.left = "-9999px";
        doc.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const res = doc.execCommand("copy");
        doc.body.removeChild(textarea);
        if (res) {
          success = true;
        }
      }
    } catch {
      // Ignore fallback error
    }
  }

  if (success && options?.toast) {
    try {
      const toastAny = options.toast as any;
      if (typeof toastAny.copied === "function") {
        toastAny.copied(options.toastMessage);
      } else if (typeof toastAny.show === "function") {
        const msg = options.toastMessage
          ? `Copied ${options.toastMessage} to clipboard`
          : "Copied to clipboard";
        toastAny.show(msg, { variant: "success" });
      }
    } catch {
      // Ignore toast failure
    }
  }

  return success;
}
