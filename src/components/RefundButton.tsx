"use client";
import { useState } from "react";

export function RefundButton({ paymentId, token }: { paymentId: string; token: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function requestRefund() {
    setBusy(true);
    try {
      const response = await fetch(`/api/payments/${paymentId}/refund`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessage("Refund requested. Flutterwave will return the payment to your original payment method.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Refund could not start."); }
    setBusy(false);
  }
  return <div><button className="button secondary" type="button" disabled={busy} onClick={requestRefund}>{busy ? "Requesting..." : "Withdraw support"}</button>{message && <p className="notice">{message}</p>}</div>;
}
