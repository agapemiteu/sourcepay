import { NextRequest, NextResponse } from "next/server";
import { db, one } from "@/lib/db";
import { creatorClaimId } from "@/lib/security";
import { flutterwave } from "@/lib/payments";
import { errorResponse } from "@/lib/http";
import { notifyReadyPledges } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const claimId = await creatorClaimId();
    if (!claimId) return NextResponse.json({ error: "Verify your channel first." }, { status: 401 });
    const { bankCode, accountNumber, confirmedName, phone } = await request.json();
    if (!/^\d{3,6}$/.test(bankCode) || !/^\d{10}$/.test(accountNumber) || typeof confirmedName !== "string" || !/^\+?\d{10,15}$/.test(phone)) throw new Error("Check the bank details and contact phone.");
    const database = db();
    const claim = await one(database.from("claims").select("id,source_id,status").eq("id", claimId).single());
    if (claim.status !== "PLATFORM_VERIFIED") throw new Error("Channel verification is required.");
    const source = await one(database.from("sources").select("id,display_name,verification_status").eq("id", claim.source_id).single());
    if (source.verification_status !== "UNCLAIMED") throw new Error("This source is already payable.");
    const banks = await flutterwave.listBanks();
    const bank = banks.find((item) => item.code === bankCode);
    if (!bank) throw new Error("Choose a supported bank.");
    const resolved = await flutterwave.resolveBank(bankCode, accountNumber);
    if (resolved.account_name !== confirmedName) throw new Error("Account name changed. Resolve the account again.");
    const destination = await flutterwave.createDestination(source.display_name, bankCode, accountNumber, phone);
    await one(database.from("payout_routes").insert({ source_id: source.id, provider: "FLUTTERWAVE", provider_destination_id: destination.subaccount_code, display_name: resolved.account_name, account_last4: accountNumber.slice(-4), bank_name: bank.name }).select("id").single());
    await one(database.from("sources").update({ verification_status: "VERIFIED", updated_at: new Date().toISOString() }).eq("id", source.id).eq("verification_status", "UNCLAIMED").select("id").single());
    await one(database.from("claims").update({ status: "ACTIVE" }).eq("id", claim.id).select("id").single());
    const { data: readyPledges, error } = await database.from("pledges").update({ status: "READY_TO_PAY" }).eq("source_id", source.id).eq("status", "WAITING_FOR_SOURCE").select("id,amount,supporter_email");
    if (error) throw new Error(error.message);
    await notifyReadyPledges(source.display_name, readyPledges ?? []);
    return NextResponse.json({ sourceId: source.id });
  } catch (error) { return errorResponse(error); }
}
