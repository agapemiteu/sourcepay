import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { confirmPayment } from "@/lib/confirm-payment";

export async function POST(request: NextRequest) {
  const raw = await request.text();
  const signature = request.headers.get("x-paystack-signature") ?? "";
  const expected = createHmac("sha512", env("PAYSTACK_SECRET_KEY")).update(raw).digest();
  const given = Buffer.from(signature, "hex");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return new NextResponse("Invalid signature", { status: 401 });
  const event = JSON.parse(raw) as { event?: string; data?: { reference?: string } };
  if (event.event === "charge.success" && event.data?.reference) {
    try { await confirmPayment(event.data.reference); }
    catch { return new NextResponse("Retry", { status: 500 }); }
  }
  return NextResponse.json({ received: true });
}
