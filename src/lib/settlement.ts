import { all, now, one, run } from "./db";
import { flutterwave } from "./payments";

const DAY = 86400000;

function transferFeeReserve(): number {
  const value = Number(process.env.PAYOUT_TRANSFER_FEE_KOBO);
  if (!Number.isSafeInteger(value) || value < 0) throw new Error("PAYOUT_TRANSFER_FEE_KOBO must be configured.");
  return value;
}

function transferState(status: string): string {
  const value = status.toLowerCase();
  return value === "successful" ? "PAID" : value === "failed" ? "NEEDS_REVIEW" : "TRANSFER_PENDING";
}

export async function processPayout(paymentId: string): Promise<void> {
  const payment = await one("select id, source_id, status, amount_settled, settlement_status, transfer_reference, transfer_requested_at from payments where id = ?", paymentId);
  if (payment.status !== "SUCCESS" || !["READY", "TRANSFER_REQUESTED", "TRANSFER_PENDING"].includes(payment.settlement_status)) return;
  const reference = payment.transfer_reference ?? `src_payout_${payment.id.replace(/-/g, "")}`;
  if (payment.settlement_status === "READY") {
    const locked = await run("update payments set settlement_status = 'TRANSFER_REQUESTED', transfer_reference = ?, transfer_requested_at = ? where id = ? and settlement_status = 'READY'", reference, now(), payment.id);
    if (!locked) return;
  } else {
    const existing = await flutterwave.findTransfer(reference);
    if (existing) {
      await run("update payments set provider_transfer_id = ?, settlement_status = ? where id = ? and settlement_status in ('TRANSFER_REQUESTED', 'TRANSFER_PENDING')", existing.id, transferState(existing.status), payment.id);
      return;
    }
    if (payment.settlement_status === "TRANSFER_PENDING" || Date.now() - Date.parse(payment.transfer_requested_at) < 5 * 60000) return;
  }
  const route = await one("select provider_beneficiary_id from payout_routes where source_id = ? and provider = 'FLUTTERWAVE' and status = 'ACTIVE'", payment.source_id);
  if (!Number.isSafeInteger(route.provider_beneficiary_id) || !Number.isSafeInteger(payment.amount_settled)) throw new Error("Payout details are incomplete.");
  const amount = payment.amount_settled - transferFeeReserve();
  if (amount < 10000) {
    await run("update payments set settlement_status = 'NEEDS_REVIEW' where id = ? and settlement_status = 'TRANSFER_REQUESTED'", payment.id);
    return;
  }
  const transfer = await flutterwave.transfer(route.provider_beneficiary_id, amount, reference);
  await run("update payments set provider_transfer_id = ?, settlement_status = ? where id = ? and settlement_status = 'TRANSFER_REQUESTED'", transfer.id, transferState(transfer.status), payment.id);
}

export async function requestRefund(paymentId: string): Promise<void> {
  const payment = await one("select id, status, settlement_status, provider_transaction_id, amount, refund_requested_at from payments where id = ?", paymentId);
  if (payment.status !== "SUCCESS") throw new Error("The payment has not been confirmed.");
  if (payment.settlement_status === "REFUND_PENDING" || payment.settlement_status === "REFUNDED") return;
  if (payment.settlement_status === "REFUND_REQUESTED") {
    const existing = await flutterwave.findRefund(payment.provider_transaction_id);
    if (existing) {
      await run("update payments set refund_id = ?, settlement_status = 'REFUND_PENDING' where id = ? and settlement_status = 'REFUND_REQUESTED'", existing.id, paymentId);
    } else if (Date.now() - Date.parse(payment.refund_requested_at) > 10 * 60000) {
      await run("update payments set settlement_status = 'NEEDS_REVIEW' where id = ? and settlement_status = 'REFUND_REQUESTED'", paymentId);
    }
    return;
  }
  const locked = await run("update payments set settlement_status = 'REFUND_REQUESTED', refund_requested_at = ? where id = ? and settlement_status = 'WAITING_CLAIM'", now(), paymentId);
  if (!locked) throw new Error("This payment is already being routed or refunded.");
  const refund = await flutterwave.refund(payment.provider_transaction_id, payment.amount);
  await run("update payments set refund_id = ?, settlement_status = 'REFUND_PENDING' where id = ? and settlement_status = 'REFUND_REQUESTED'", refund.id, paymentId);
}

export async function runSettlementQueue(): Promise<void> {
  const expired = await all<{ id: string }>("select id from payments where status = 'SUCCESS' and settlement_status = 'WAITING_CLAIM' and paid_at < ? limit 25", new Date(Date.now() - 14 * DAY).toISOString());
  for (const payment of expired) { try { await requestRefund(payment.id); } catch (error) { console.error("Refund queue error", payment.id, error); } }
  const refunds = await all("select id, provider_transaction_id, refund_id, settlement_status from payments where settlement_status in ('REFUND_REQUESTED', 'REFUND_PENDING') limit 25");
  for (const payment of refunds) {
    try {
      if (payment.settlement_status === "REFUND_REQUESTED") { await requestRefund(payment.id); continue; }
      const refund = await flutterwave.findRefund(payment.provider_transaction_id);
      if (!refund || refund.id !== payment.refund_id) continue;
      const status = refund.status.toLowerCase();
      if (["completed", "successful"].includes(status)) await run("update payments set settlement_status = 'REFUNDED', status = 'REFUNDED' where id = ? and settlement_status = 'REFUND_PENDING'", payment.id);
      if (status === "failed") await run("update payments set settlement_status = 'NEEDS_REVIEW' where id = ? and settlement_status = 'REFUND_PENDING'", payment.id);
    } catch (error) { console.error("Refund status error", payment.id, error); }
  }
  const payouts = await all<{ id: string }>("select id from payments where settlement_status in ('READY', 'TRANSFER_REQUESTED', 'TRANSFER_PENDING') limit 25");
  for (const payment of payouts) { try { await processPayout(payment.id); } catch (error) { console.error("Payout queue error", payment.id, error); } }
}
