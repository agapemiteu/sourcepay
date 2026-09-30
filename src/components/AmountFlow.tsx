"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Source } from "@/lib/types";

export function AmountFlow({ source, contentId }: { source: Source; contentId?: string | null }) {
  const router = useRouter();
  const [amount, setAmount] = useState(1000);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const verified = source.verification_status === "VERIFIED";
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch(verified ? "/api/payments/initialize" : "/api/pledges", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sourceId: source.id, contentId, amount: Math.round(amount * 100), email, supporterEmail: email || null }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (verified) window.location.assign(result.checkoutUrl);
      else router.push(`/pledge/${result.pledgeId}?claim=${encodeURIComponent(result.claimToken)}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not continue."); setBusy(false); }
  }
  return <form className="panel pay-panel" onSubmit={submit}><h2>{verified ? "Pay this source" : "Reserve your support"}</h2><p>{verified ? "Choose an amount to send through Paystack." : "No money is charged until this creator verifies their channel and connects a payout route."}</p><div className="amounts">{[500,1000,5000].map((value) => <button type="button" className={amount === value ? "selected" : ""} key={value} onClick={() => setAmount(value)}>₦{value.toLocaleString()}</button>)}</div><label className="field"><span>Other amount (₦)</span><input type="number" min="100" max="1000000" step="1" value={amount} onChange={(event) => setAmount(Number(event.target.value))}/></label><label className="field"><span>Email {verified ? "for Paystack checkout" : "for an optional reminder"}</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required={verified}/></label>{error && <p className="error">{error}</p>}<button className="button full" disabled={busy}>{busy ? "Please wait..." : verified ? `Pay ${source.current_handle || "source"} ↗` : `Pledge ₦${amount.toLocaleString()} ↗`}</button>{!verified && <p className="notice">Your money stays with you. This is an intent to pay, not a charge.</p>}</form>;
}
