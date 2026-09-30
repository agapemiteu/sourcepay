import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { appUrl, env } from "@/lib/env";
import { one, run } from "@/lib/db";
import { amountInKobo, errorResponse, isEmail, isUuid } from "@/lib/http";
import { flutterwave } from "@/lib/payments";
import { claimToken, supporterToken, tokenHash } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    const { sourceId, contentId, amount, email } = await request.json();
    if (!isUuid(sourceId) || !isEmail(email)) throw new Error("Enter a valid email to continue to Flutterwave.");
    if (contentId && !isUuid(contentId)) throw new Error("Invalid video.");
    const kobo = amountInKobo(amount);
    const source = await one("select id, verification_status from sources where id = ?", sourceId);
    if (source.verification_status === "SUSPENDED") throw new Error("This source is unavailable.");
    const unclaimed = source.verification_status === "UNCLAIMED";
    if (unclaimed && process.env.ENABLE_UNCLAIMED_PAYMENTS !== "true") throw new Error("Payments before a creator claims are not available yet.");
    if (unclaimed) { env("CRON_SECRET"); env("PAYOUT_TRANSFER_FEE_KOBO"); }
    const route = unclaimed ? null : await one("select provider_destination_id from payout_routes where source_id = ? and provider = 'FLUTTERWAVE' and status = 'ACTIVE'", sourceId);
    if (contentId) {
      const content = await one("select source_id from source_content where id = ?", contentId);
      if (content.source_id !== sourceId) throw new Error("Video does not belong to this source.");
    }
    const reference = `src_${randomUUID().replace(/-/g, "")}`;
    const claimId = unclaimed ? randomUUID() : null;
    if (claimId) await run("insert into claims (id, source_id, token_hash, expires_at) values (?, ?, ?, ?)", claimId, sourceId, tokenHash(claimToken(claimId)), new Date(Date.now() + 14 * 86400000).toISOString());
    const paymentId = randomUUID();
    await run(
      "insert into payments (id, source_id, source_content_id, claim_id, supporter_email, amount, provider, payout_destination_id, provider_reference) values (?, ?, ?, ?, ?, ?, 'FLUTTERWAVE', ?, ?)",
      paymentId, sourceId, contentId || null, claimId, email, kobo, route?.provider_destination_id ?? null, reference,
    );
    try {
      const checkout = await flutterwave.initialize({ email, amount: kobo, reference, subaccount: route?.provider_destination_id, callbackUrl: `${appUrl()}/payment/${paymentId}${unclaimed ? `?key=${encodeURIComponent(supporterToken(paymentId))}` : ""}`, metadata: { sourcepay_payment_id: paymentId, source_id: sourceId } });
      await run("update payments set status = 'PENDING' where id = ? and status = 'INITIALIZED'", paymentId);
      return NextResponse.json({ checkoutUrl: checkout.authorization_url });
    } catch (error) {
      await run("update payments set status = 'FAILED' where id = ? and status = 'INITIALIZED'", paymentId);
      throw error;
    }
  } catch (error) { return errorResponse(error); }
}
