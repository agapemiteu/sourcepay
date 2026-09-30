import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "./env";

export function randomToken(): string { return randomBytes(32).toString("base64url"); }
export function tokenHash(token: string): string { return createHash("sha256").update(token).digest("hex"); }

export function sign(value: string): string {
  const signature = createHmac("sha256", env("CLAIM_TOKEN_SECRET")).update(value).digest("base64url");
  return `${value}.${signature}`;
}

export function unsign(signed: string | undefined): string | null {
  if (!signed) return null;
  const dot = signed.lastIndexOf(".");
  if (dot < 0) return null;
  const value = signed.slice(0, dot);
  const given = Buffer.from(signed.slice(dot + 1), "base64url");
  const expected = createHmac("sha256", env("CLAIM_TOKEN_SECRET")).update(value).digest();
  return given.length === expected.length && timingSafeEqual(given, expected) ? value : null;
}

export async function creatorClaimId(): Promise<string | null> {
  const raw = unsign((await cookies()).get("sourcepay_creator")?.value);
  if (!raw) return null;
  const [claimId, expires] = raw.split(":");
  return /^[0-9a-f-]{36}$/.test(claimId) && Number(expires) > Date.now() ? claimId : null;
}

export const secureCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
