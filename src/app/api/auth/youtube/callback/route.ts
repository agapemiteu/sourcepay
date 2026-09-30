import { NextRequest, NextResponse } from "next/server";
import { db, one } from "@/lib/db";
import { appUrl, env } from "@/lib/env";
import { authenticatedChannelIds } from "@/lib/youtube";
import { secureCookie, sign, unsign } from "@/lib/security";

export async function GET(request: NextRequest) {
  const fail = (message: string) => NextResponse.redirect(`${appUrl()}/claim/error?message=${encodeURIComponent(message)}`);
  try {
    const code = request.nextUrl.searchParams.get("code");
    const state = unsign(request.nextUrl.searchParams.get("state") ?? undefined);
    const oauth = unsign(request.cookies.get("sourcepay_oauth")?.value);
    if (!code || !state || !oauth) return fail("YouTube verification expired. Try again.");
    const [claimId, nonce, expires] = state.split(":");
    const [cookieNonce, verifier] = oauth.split(":");
    if (nonce !== cookieNonce || Number(expires) < Date.now()) return fail("YouTube verification expired. Try again.");
    const database = db();
    const claim = await one(database.from("claims").select("id,source_id,status,expires_at").eq("id", claimId).single());
    if (claim.status !== "STARTED" || Date.parse(claim.expires_at) < Date.now()) return fail("This claim link has expired.");
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: env("GOOGLE_CLIENT_ID"), client_secret: env("GOOGLE_CLIENT_SECRET"), redirect_uri: env("GOOGLE_REDIRECT_URI"), grant_type: "authorization_code", code_verifier: verifier }),
      cache: "no-store",
    });
    if (!response.ok) return fail("Google could not verify this channel. Try again.");
    const tokens = await response.json() as { access_token?: string };
    if (!tokens.access_token) return fail("Google did not return channel access.");
    const source = await one(database.from("sources").select("id,platform_id,verification_status").eq("id", claim.source_id).single());
    if (source.verification_status !== "UNCLAIMED") return fail("This channel has already been claimed.");
    const ids = await authenticatedChannelIds(tokens.access_token);
    if (!ids.includes(source.platform_id)) return fail("This Google account does not control that YouTube channel. Try another account.");
    await one(database.from("claims").update({ status: "PLATFORM_VERIFIED", verified_platform_id: source.platform_id, verified_at: new Date().toISOString() }).eq("id", claim.id).eq("status", "STARTED").select("id").single());
    const redirect = NextResponse.redirect(`${appUrl()}/claim/connect`);
    redirect.cookies.set("sourcepay_creator", sign(`${claim.id}:${Date.now() + 3600000}`), { ...secureCookie, maxAge: 3600 });
    redirect.cookies.delete("sourcepay_oauth");
    return redirect;
  } catch { return fail("YouTube verification could not be completed."); }
}
