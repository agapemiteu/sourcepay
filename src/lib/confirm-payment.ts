import { now, one, run } from "./db";
import { flutterwave } from "./payments";

export async function confirmPayment(reference: string): Promise<boolean> {
  const payment = await one("select id, claim_id, amount, currency, status from payments where provider = 'FLUTTERWAVE' and provider_reference = ?", reference);
  if (payment.status === "SUCCESS") return true;
  const verified = await flutterwave.verify(reference);
  if (verified.status !== "successful" || verified.reference !== reference || !Number.isSafeInteger(verified.amount * 100) || verified.amount * 100 !== payment.amount || verified.currency !== payment.currency) return false;
  if (!Number.isSafeInteger(verified.id) || !Number.isSafeInteger(verified.amountSettled * 100) || verified.amountSettled <= 0) throw new Error("Flutterwave did not provide valid settlement details.");
  await run(
    "update payments set status = 'SUCCESS', paid_at = ?, provider_transaction_id = ?, amount_settled = ?, settlement_status = ? where id = ? and status in ('INITIALIZED', 'PENDING')",
    now(), verified.id, Math.round(verified.amountSettled * 100), payment.claim_id ? "WAITING_CLAIM" : "NONE", payment.id,
  );
  return true;
}
