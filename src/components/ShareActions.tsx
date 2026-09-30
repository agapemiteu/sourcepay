"use client";
import { useState } from "react";

export function ShareActions({ claimUrl, videoUrl, message }: { claimUrl: string; videoUrl?: string | null; message: string }) {
  const [copied, setCopied] = useState("");
  async function copy(value: string, label: string) { await navigator.clipboard.writeText(value); setCopied(label); }
  return <div className="share-grid"><button onClick={() => copy(claimUrl, "link")}>{copied === "link" ? "Claim link copied" : "Copy claim link"}</button><button onClick={() => copy(message, "message")}>{copied === "message" ? "Message copied" : "Copy message"}</button>{videoUrl && <a href={videoUrl} target="_blank" rel="noreferrer">Open YouTube video ↗</a>}<a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">Share on WhatsApp ↗</a><a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">Share on X ↗</a></div>;
}
