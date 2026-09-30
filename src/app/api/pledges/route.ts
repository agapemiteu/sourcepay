import { NextRequest, NextResponse } from "next/server";
import { db, one } from "@/lib/db";
import { amountInKobo, errorResponse, isEmail, isUuid } from "@/lib/http";
import { randomToken, tokenHash } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    const { sourceId, contentId, amount, supporterEmail } = await request.json();
    if (!isUuid(sourceId) || (contentId && !isUuid(contentId))) throw new Error("Invalid source.");
    const kobo = amountInKobo(amount);
    if (supporterEmail && !isEmail(supporterEmail)) throw new Error("Enter a valid email or leave it empty.");
    const database = db();
    const source = await one(database.from("sources").select("id,verification_status").eq("id", sourceId).single());
    if (source.verification_status !== "UNCLAIMED") throw new Error("This source is now payable. Refresh to pay directly.");
    if (contentId) {
      const content = await one(database.from("source_content").select("id,source_id").eq("id", contentId).single());
      if (content.source_id !== sourceId) throw new Error("Content does not belong to this source.");
    }
    const pledge = await one(database.from("pledges").insert({ source_id: sourceId, source_content_id: contentId || null, amount: kobo, supporter_email: supporterEmail || null }).select("id").single());
    const token = randomToken();
    await one(database.from("claims").insert({ source_id: sourceId, token_hash: tokenHash(token), expires_at: new Date(Date.now() + 30 * 86400000).toISOString() }).select("id").single());
    return NextResponse.json({ pledgeId: pledge.id, claimToken: token });
  } catch (error) { return errorResponse(error); }
}
