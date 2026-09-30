"use client";
import { useState } from "react";

export function ClaimButton({ token }: { token: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function start() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/claims/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      window.location.assign(result.authorizationUrl);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Claim could not start."); setBusy(false); }
  }
  return <>{error && <p className="error">{error}</p>}<button className="button full" onClick={start} disabled={busy}>{busy ? "Opening YouTube..." : "Continue with YouTube ↗"}</button></>;
}
