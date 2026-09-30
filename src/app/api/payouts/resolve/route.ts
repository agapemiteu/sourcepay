import { NextRequest, NextResponse } from "next/server";
import { creatorClaimId } from "@/lib/security";
import { paystack } from "@/lib/payments";
import { errorResponse } from "@/lib/http";

export async function POST(request: NextRequest) {
  try {
    if (!await creatorClaimId()) return NextResponse.json({ error: "Verify your channel first." }, { status: 401 });
    const { bankCode, accountNumber } = await request.json();
    if (!/^\d{3,6}$/.test(bankCode) || !/^\d{10}$/.test(accountNumber)) throw new Error("Choose a bank and enter a 10 digit account number.");
    const account = await paystack.resolveBank(bankCode, accountNumber);
    return NextResponse.json({ accountName: account.account_name, last4: accountNumber.slice(-4) });
  } catch (error) { return errorResponse(error); }
}
