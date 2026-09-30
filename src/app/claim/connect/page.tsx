import { redirect } from "next/navigation";
import { db, one } from "@/lib/db";
import { creatorClaimId } from "@/lib/security";
import { SourceCard } from "@/components/SourceCard";
import { BankConnect } from "@/components/BankConnect";
import type { Source } from "@/lib/types";

export default async function ConnectPage() {
  const claimId = await creatorClaimId();
  if (!claimId) redirect("/");
  const database = db();
  const claim = await one(database.from("claims").select("source_id,status").eq("id", claimId).single());
  if (claim.status !== "PLATFORM_VERIFIED") redirect("/");
  const source = await one(database.from("sources").select("id,platform_id,current_handle,display_name,avatar_url,verification_status").eq("id", claim.source_id).single()) as Source;
  return <main><div className="stack"><SourceCard source={source}/><div className="panel pay-panel"><p className="section-label">Channel control verified</p><h2>Now choose where value should go.</h2><p>Connect a Nigerian bank. Your bank details stay private.</p><BankConnect/></div></div></main>;
}
