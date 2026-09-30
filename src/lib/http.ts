import { NextResponse } from "next/server";

export function errorResponse(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : "Something went wrong";
  return NextResponse.json({ error: message }, { status });
}

export function isEmail(value: unknown): value is string {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function amountInKobo(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 10000 || (value as number) > 100000000) throw new Error("Choose an amount from ₦100 to ₦1,000,000.");
  return value as number;
}
