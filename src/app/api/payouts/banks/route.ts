import { NextResponse } from "next/server";
import { creatorClaimId } from "@/lib/security";
import { flutterwave } from "@/lib/payments";
import { errorResponse } from "@/lib/http";

export async function GET() {
  try {
    if (!await creatorClaimId()) return NextResponse.json({ error: "Verify your channel first." }, { status: 401 });
    const banks = await flutterwave.listBanks();
    return NextResponse.json({ banks: banks.map(({ name, code }) => ({ name, code })) });
  } catch (error) { return errorResponse(error, 502); }
}
