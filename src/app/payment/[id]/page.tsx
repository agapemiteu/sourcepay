import Link from "next/link";
import { db, one } from "@/lib/db";
import { confirmPayment } from "@/lib/confirm-payment";

export default async function PaymentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ reference?: string }> }) {
  const { id } = await params;
  const { reference } = await searchParams;
  const database = db();
  let payment = await one(database.from("payments").select("id,source_id,provider_reference,status,amount").eq("id", id).single());
  if (reference && reference === payment.provider_reference && payment.status !== "SUCCESS") {
    try { await confirmPayment(reference); } catch { /* The page remains pending until Paystack confirms. */ }
    payment = await one(database.from("payments").select("id,source_id,provider_reference,status,amount").eq("id", id).single());
  }
  const source = await one(database.from("sources").select("display_name,current_handle").eq("id", payment.source_id).single());
  const success = payment.status === "SUCCESS";
  const failed = payment.status === "FAILED";
  return <main><div className="stack"><div className="panel"><span className="success-icon">{success ? "✓" : "·"}</span><p className="section-label">{success ? "Payment confirmed" : failed ? "Payment could not start" : "Payment pending"}</p><h1>{success ? `₦${(payment.amount / 100).toLocaleString()} to ${source.current_handle || source.display_name}` : failed ? "Please try payment again" : "Waiting for payment confirmation"}</h1><p className="muted">{success ? "Paystack accepted your payment and routed it for settlement to the creator's connected payout. Bank settlement may take more time." : failed ? "No payment was confirmed. Return to the source and try again." : "We will show success only after Paystack confirms the transaction. Refresh this page in a moment."}</p><Link href={`/source/${payment.source_id}`} className="button secondary">Back to source</Link></div></div></main>;
}
