"use client";
import { useState } from "react";
import type { Source } from "@/lib/types";

export function AmountFlow({ source, contentId, unclaimedPaymentsEnabled }: { source: Source; contentId?: string | null; unclaimedPaymentsEnabled: boolean }) {
  const [amount, setAmount] = useState(1000);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const verified = source.verification_status === "VERIFIED";
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/payments/initialize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sourceId: source.id, contentId, amount: Math.round(amount * 100), email }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      window.location.assign(result.checkoutUrl);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Payment could not start."); setBusy(false); }
  }
  return <form className="panel pay-panel" onSubmit={submit}>
    <h2>Pay this source</h2>
    <p>{verified ? "Choose an amount to send through Flutterwave." : "Pay now, then share a claim link. The creator receives the payout after verifying this channel and connecting a bank."}</p>
    <div className="amounts">{[500, 1000, 5000].map((value) => <button type="button" className={amount === value ? "selected" : ""} key={value} onClick={() => setAmount(value)}>₦{value.toLocaleString()}</button>)}</div>
    <label className="field"><span>Other amount (₦)</span><input type="number" min="100" max="1000000" step="1" value={amount} onChange={(event) => setAmount(Number(event.target.value))}/></label>
    <label className="field"><span>Email for checkout and refund access</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required/></label>
    {error && <p className="error">{error}</p>}
    <button className="button full" disabled={busy || (!verified && !unclaimedPaymentsEnabled)}>{busy ? "Please wait..." : `Pay ₦${amount.toLocaleString()} ↗`}</button>
    {!verified && <p className="notice">{unclaimedPaymentsEnabled ? "If this channel stays unclaimed, request a refund any time or we will start one after 14 days. Provider fees come from the creator payout." : "Payments to unclaimed channels will open after transfer and refund setup is verified."}</p>}
  </form>;
}
