"use client";

import { useState } from "react";
import { Check } from "lucide-react";

interface CopyButtonProps {
  text: string;
  /** Accessible name before copying, e.g. "Copy link to this wallpaper" */
  label: string;
  /** Short visible label from sm up, e.g. "Copy link" */
  shortLabel: string;
  icon: React.ReactNode;
  className: string;
  /** Icon only at every size (label as tooltip) */
  compact?: boolean;
}

/** Copies text to the clipboard: icon-only on phones, labelled from sm, announces the result */
export function CopyButton({ text, label, shortLabel, icon, className, compact = false }: CopyButtonProps) {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const copied = copiedText === text;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setFailed(false);
      setCopiedText(text);
      setTimeout(() => setCopiedText((current) => (current === text ? null : current)), 2000);
    } catch {
      setFailed(true);
    }
  }

  return (
    <>
      <button
        onClick={copy}
        aria-label={copied ? `${shortLabel}: copied` : label}
        // If the clipboard is unavailable, at least show the text to copy by hand
        title={failed ? text : compact ? label : undefined}
        className={className}
      >
        {copied ? <Check className={compact ? "h-5 w-5" : "h-4 w-4"} aria-hidden /> : icon}
        {!compact && <span className="hidden sm:inline">{copied ? "Copied" : shortLabel}</span>}
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? `${shortLabel}: copied` : failed ? `Couldn't copy (${shortLabel})` : ""}
      </span>
    </>
  );
}
