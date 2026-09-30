import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { confirmPayment } from "@/lib/confirm-payment";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("verif-hash") ?? "";
  const expected = env("FLUTTERWAVE_WEBHOOK_SECRET");
  const givenBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  if (givenBytes.length !== expectedBytes.length || !timingSafeEqual(givenBytes, expectedBytes)) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let event: { event?: string; data?: { tx_ref?: string; status?: string } };
  try { event = await request.json(); }
  catch { return new NextResponse("Invalid payload", { status: 400 }); }

  if (event.event === "charge.completed" && event.data?.status === "successful" && event.data.tx_ref) {
    try { await confirmPayment(event.data.tx_ref); }
    catch { return new NextResponse("Retry", { status: 500 }); }
  }
  return NextResponse.json({ received: true });
}
