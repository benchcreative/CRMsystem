"use client";

import { useState } from "react";

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — nothing to do.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="border border-dash-line px-3 py-1.5 text-xs text-dash-ink transition-colors hover:border-dash-ink"
    >
      {copied ? "Copied!" : label}
    </button>
  );
}
