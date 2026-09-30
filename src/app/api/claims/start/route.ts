import { randomBytes, createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { first, one } from "@/lib/db";
import { env } from "@/lib/env";
import { errorResponse } from "@/lib/http";
import { secureCookie, sign, tokenHash } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    if (typeof token !== "string" || token.length > 100) throw new Error("Invalid claim link.");
    const claim = await one("select id, status, expires_at from claims where token_hash = ?", tokenHash(token));
    if (claim.status !== "STARTED" || Date.parse(claim.expires_at) < Date.now()) throw new Error("This claim link has expired.");
    const linkedPayment = await first("select status, settlement_status from payments where claim_id = ?", claim.id);
    if (linkedPayment && (linkedPayment.status !== "SUCCESS" || linkedPayment.settlement_status !== "WAITING_CLAIM")) throw new Error("This payment is not available to claim.");
    const verifier = randomBytes(32).toString("base64url");
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    const nonce = randomBytes(16).toString("base64url");
    const state = sign(`${claim.id}:${nonce}:${Date.now() + 600000}`);
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", env("GOOGLE_CLIENT_ID"));
    url.searchParams.set("redirect_uri", env("GOOGLE_REDIRECT_URI"));
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "https://www.googleapis.com/auth/youtube.readonly");
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge", challenge);
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("prompt", "select_account");
    const response = NextResponse.json({ authorizationUrl: url.toString() });
    response.cookies.set("sourcepay_oauth", sign(`${nonce}:${verifier}`), { ...secureCookie, maxAge: 600 });
    return response;
  } catch (error) { return errorResponse(error); }
}
