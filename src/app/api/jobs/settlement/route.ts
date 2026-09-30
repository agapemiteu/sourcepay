import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { runSettlementQueue } from "@/lib/settlement";

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${env("CRON_SECRET")}`) return new NextResponse("Unauthorized", { status: 401 });
  await runSettlementQueue();
  return NextResponse.json({ processed: true });
}
