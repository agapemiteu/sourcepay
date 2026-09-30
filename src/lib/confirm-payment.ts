import { db, one } from "./db";
import { flutterwave } from "./payments";

export async function confirmPayment(reference: string): Promise<boolean> {
  const database = db();
  const payment = await one(database.from("payments").select("id,source_id,pledge_id,amount,currency,status,payout_destination_id").eq("provider", "FLUTTERWAVE").eq("provider_reference", reference).single());
  if (payment.status === "SUCCESS") return true;
  const verified = await flutterwave.verify(reference);
  if (verified.status !== "successful" || verified.reference !== reference || !Number.isSafeInteger(verified.amount * 100) || verified.amount * 100 !== payment.amount || verified.currency !== payment.currency) return false;
  const { data, error } = await database.from("payments").update({ status: "SUCCESS", paid_at: new Date().toISOString() }).eq("id", payment.id).neq("status", "SUCCESS").select("id").maybeSingle();
  if (error) throw new Error(error.message);
  if (data && payment.pledge_id) {
    const { error: pledgeError } = await database.from("pledges").update({ status: "CONVERTED" }).eq("id", payment.pledge_id).eq("status", "READY_TO_PAY");
    if (pledgeError) throw new Error(pledgeError.message);
  }
  return true;
}
