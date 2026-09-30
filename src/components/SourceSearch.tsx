"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function SourceSearch() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setError("");
    try {
      const response = await fetch("/api/sources/resolve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      router.push(`/source/${result.sourceId}${result.contentId ? `?content=${result.contentId}` : ""}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not find this source."); }
    finally { setLoading(false); }
  }
  return <><form className="search-box" onSubmit={submit}><input aria-label="YouTube video or handle" value={input} onChange={(event) => setInput(event.target.value)} placeholder="YouTube video or @handle" required/><button disabled={loading}>{loading ? "Finding source..." : "Find source ↗"}</button></form>{error && <p className="error">{error}</p>}</>;
}
