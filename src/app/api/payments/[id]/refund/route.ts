import { NextRequest, NextResponse } from "next/server";
import { one } from "@/lib/db";
import { errorResponse, isUuid } from "@/lib/http";
import { supporterToken } from "@/lib/security";
import { requestRefund } from "@/lib/settlement";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { token } = await request.json();
    if (!isUuid(id) || typeof token !== "string" || token !== supporterToken(id)) return NextResponse.json({ error: "Invalid supporter link." }, { status: 403 });
    const payment = await one("select claim_id from payments where id = ?", id);
    if (!payment.claim_id) throw new Error("This payment went directly to a verified creator.");
    await requestRefund(id);
    return NextResponse.json({ requested: true });
  } catch (error) { return errorResponse(error); }
}
