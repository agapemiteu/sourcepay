"use client";
import { useState } from "react";
import type { Pledge, Source } from "@/lib/types";

export function PledgePayment({ pledge, source }: { pledge: Pledge; source: Source }) {
  const [email, setEmail] = useState(pledge.supporter_email || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function pay(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/payments/initialize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sourceId: source.id, pledgeId: pledge.id, amount: pledge.amount, email }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      window.location.assign(result.checkoutUrl);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Payment could not start."); setBusy(false); }
  }
  return <form className="panel pay-panel" onSubmit={pay}><span className="success-icon">✓</span><p className="section-label">Source verified</p><h2>{source.current_handle || source.display_name} is ready to receive.</h2><p>Your pledge of ₦{(pledge.amount / 100).toLocaleString()} is ready. Paystack will collect the payment now.</p><label className="field"><span>Email for Paystack checkout</span><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)}/></label>{error && <p className="error">{error}</p>}<button className="button full" disabled={busy}>{busy ? "Starting checkout..." : `Complete ₦${(pledge.amount / 100).toLocaleString()} payment ↗`}</button></form>;
}
