import Link from "next/link";
import { one } from "@/lib/db";
import { appUrl } from "@/lib/env";
import { confirmPayment } from "@/lib/confirm-payment";
import { claimToken, supporterToken } from "@/lib/security";
import { ShareActions } from "@/components/ShareActions";
import { RefundButton } from "@/components/RefundButton";

export default async function PaymentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tx_ref?: string; key?: string }> }) {
  const { id } = await params;
  const { tx_ref: reference, key } = await searchParams;
  const load = () => one("select id, source_id, source_content_id, claim_id, provider_reference, status, settlement_status, amount from payments where id = ?", id);
  let payment = await load();
  if (reference && reference === payment.provider_reference && payment.status !== "SUCCESS") {
    try { await confirmPayment(reference); } catch { /* Remain pending until the provider confirms. */ }
    payment = await load();
  }
  const source = await one("select display_name, current_handle from sources where id = ?", payment.source_id);
  const content = payment.source_content_id ? await one("select canonical_url from source_content where id = ?", payment.source_content_id) : null;
  const authorized = Boolean(key && key === supporterToken(payment.id));
  const paid = payment.status === "SUCCESS";
  const unclaimed = Boolean(payment.claim_id);
  const awaiting = paid && payment.settlement_status === "WAITING_CLAIM";
  const label = payment.status === "REFUNDED" ? "Refund confirmed" : paid ? awaiting ? "Payment received" : payment.settlement_status === "PAID" ? "Creator payout complete" : unclaimed ? "Payout in progress" : "Payment confirmed" : payment.status === "FAILED" ? "Payment could not start" : "Payment pending";
  const claimUrl = awaiting && authorized ? `${appUrl()}/c/${encodeURIComponent(claimToken(payment.claim_id))}` : "";
  const name = source.current_handle || source.display_name;
  const message = `I paid ₦${(payment.amount / 100).toLocaleString()} for your YouTube work through SourcePay. Verify your channel and connect your bank to receive it: ${claimUrl}`;
  return <main><div className="stack"><div className="panel"><span className="success-icon">{paid ? "✓" : "·"}</span><p className="section-label">{label}</p><h1>{paid ? `₦${(payment.amount / 100).toLocaleString()} for ${name}` : payment.status === "REFUNDED" ? "Your refund is complete" : "Waiting for payment confirmation"}</h1><p className="muted">{awaiting ? "Flutterwave confirmed your payment. The creator must verify this channel and connect a bank before a payout can be requested." : payment.settlement_status === "REFUND_PENDING" ? "Your refund was requested. Flutterwave will return it to the original payment method." : payment.settlement_status === "PAID" ? "Flutterwave reports the creator transfer as successful." : paid && unclaimed ? "Flutterwave is processing the creator payout. Bank credit timing depends on the provider." : paid ? "Flutterwave confirmed your payment. Settlement follows its schedule." : "We show success only after Flutterwave confirms the transaction. Refresh this page in a moment."}</p>{claimUrl && <><div className="divider"/><p className="section-label">Tell the creator</p><ShareActions claimUrl={claimUrl} videoUrl={content?.canonical_url} message={message}/><div className="divider"/><RefundButton paymentId={payment.id} token={key!}/></>}{awaiting && !authorized && <p className="notice">Open your original checkout return link to share the claim or request a refund.</p>}<Link href={`/source/${payment.source_id}`} className="button secondary">Back to source</Link></div></div></main>;
}
