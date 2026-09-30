import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { all, now, one, run } from "@/lib/db";
import { creatorClaimId } from "@/lib/security";
import { flutterwave } from "@/lib/payments";
import { errorResponse } from "@/lib/http";
import { processPayout } from "@/lib/settlement";

export async function POST(request: NextRequest) {
  try {
    const claimId = await creatorClaimId();
    if (!claimId) return NextResponse.json({ error: "Verify your channel first." }, { status: 401 });
    const { bankCode, accountNumber, confirmedName, phone } = await request.json();
    if (!/^\d{3,6}$/.test(bankCode) || !/^\d{10}$/.test(accountNumber) || typeof confirmedName !== "string" || !/^\+?\d{10,15}$/.test(phone)) throw new Error("Check the bank details and contact phone.");
    const claim = await one("select id, source_id, status from claims where id = ?", claimId);
    if (claim.status !== "PLATFORM_VERIFIED") throw new Error("Channel verification is required.");
    const source = await one("select id, display_name, verification_status from sources where id = ?", claim.source_id);
    if (source.verification_status !== "UNCLAIMED") throw new Error("This source is already payable.");
    const banks = await flutterwave.listBanks();
    const bank = banks.find((item) => item.code === bankCode);
    if (!bank) throw new Error("Choose a supported bank.");
    const resolved = await flutterwave.resolveBank(bankCode, accountNumber);
    if (resolved.account_name !== confirmedName) throw new Error("Account name changed. Resolve the account again.");
    const destination = await flutterwave.createDestination(source.display_name, bankCode, accountNumber, phone);
    const beneficiary = await flutterwave.createBeneficiary(bankCode, accountNumber, resolved.account_name, bank.name);
    // The unique active-route index stops a second concurrent connect for the same source.
    await run(
      "insert into payout_routes (id, source_id, provider, provider_destination_id, provider_beneficiary_id, display_name, account_last4, bank_name) values (?, ?, 'FLUTTERWAVE', ?, ?, ?, ?, ?)",
      randomUUID(), source.id, destination.subaccount_code, beneficiary.id, resolved.account_name, accountNumber.slice(-4), bank.name,
    );
    if (!await run("update sources set verification_status = 'VERIFIED', updated_at = ? where id = ? and verification_status = 'UNCLAIMED'", now(), source.id)) throw new Error("This source is already payable.");
    await run("update claims set status = 'ACTIVE' where id = ?", claim.id);
    const readyPayments = await all<{ id: string }>("update payments set settlement_status = 'READY' where source_id = ? and status = 'SUCCESS' and settlement_status = 'WAITING_CLAIM' returning id", source.id);
    for (const payment of readyPayments) {
      try { await processPayout(payment.id); } catch (error) { console.error("Payout queued for retry", payment.id, error); }
    }
    return NextResponse.json({ sourceId: source.id });
  } catch (error) { return errorResponse(error); }
}
