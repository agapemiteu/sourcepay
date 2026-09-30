import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { appUrl } from "@/lib/env";
import { db, one } from "@/lib/db";
import { amountInKobo, errorResponse, isEmail, isUuid } from "@/lib/http";
import { paystack } from "@/lib/payments";

export async function POST(request: NextRequest) {
  try {
    const { sourceId, contentId, pledgeId, amount, email } = await request.json();
    if (!isUuid(sourceId) || !isEmail(email)) throw new Error("Enter a valid email to continue to Paystack.");
    if (contentId && !isUuid(contentId)) throw new Error("Invalid video.");
    if (pledgeId && !isUuid(pledgeId)) throw new Error("Invalid pledge.");
    const database = db();
    const source = await one(database.from("sources").select("id,verification_status").eq("id", sourceId).single());
    if (source.verification_status !== "VERIFIED") throw new Error("This source is not ready for payment.");
    const route = await one(database.from("payout_routes").select("provider_destination_id").eq("source_id", sourceId).eq("status", "ACTIVE").single());
    let kobo: number;
    let actualContentId = contentId || null;
    if (pledgeId) {
      const pledge = await one(database.from("pledges").select("source_id,source_content_id,amount,status,expires_at,supporter_email").eq("id", pledgeId).single());
      if (pledge.source_id !== sourceId || pledge.status !== "READY_TO_PAY" || Date.parse(pledge.expires_at) < Date.now()) throw new Error("This pledge is not ready to pay.");
      if (pledge.supporter_email && pledge.supporter_email.toLowerCase() !== email.toLowerCase()) throw new Error("Use the email attached to this pledge.");
      kobo = pledge.amount;
      actualContentId = pledge.source_content_id;
    } else {
      kobo = amountInKobo(amount);
    }
    if (!pledgeId && actualContentId) {
      const content = await one(database.from("source_content").select("source_id").eq("id", actualContentId).single());
      if (content.source_id !== sourceId) throw new Error("Video does not belong to this source.");
    }
    const reference = `src_${randomUUID().replace(/-/g, "")}`;
    const payment = await one(database.from("payments").insert({ source_id: sourceId, source_content_id: actualContentId, pledge_id: pledgeId || null, supporter_email: email, amount: kobo, payout_destination_id: route.provider_destination_id, provider_reference: reference }).select("id").single());
    try {
      const checkout = await paystack.initialize({ email, amount: kobo, reference, subaccount: route.provider_destination_id, callbackUrl: `${appUrl()}/payment/${payment.id}`, metadata: { sourcepay_payment_id: payment.id, source_id: sourceId, pledge_id: pledgeId || null } });
      const { error: statusError } = await database.from("payments").update({ status: "PENDING" }).eq("id", payment.id).eq("status", "INITIALIZED");
      if (statusError) throw new Error(statusError.message);
      return NextResponse.json({ checkoutUrl: checkout.authorization_url });
    } catch (error) {
      await database.from("payments").update({ status: "FAILED" }).eq("id", payment.id).eq("status", "INITIALIZED");
      throw error;
    }
  } catch (error) { return errorResponse(error); }
}
