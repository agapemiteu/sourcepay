import Link from "next/link";
import { db, one } from "@/lib/db";
import { tokenHash } from "@/lib/security";
import { ClaimButton } from "@/components/ClaimButton";
import { SourceCard } from "@/components/SourceCard";
import type { Claim, Source } from "@/lib/types";

export default async function ClaimPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const database = db();
  const claim = await one(database.from("claims").select("id,source_id,status,expires_at").eq("token_hash", tokenHash(token)).single()) as Claim;
  const source = await one(database.from("sources").select("id,platform_id,current_handle,display_name,avatar_url,verification_status").eq("id", claim.source_id).single()) as Source;
  const { data: pledges } = await database.from("pledges").select("amount").eq("source_id", source.id).eq("status", "WAITING_FOR_SOURCE");
  const total = (pledges ?? []).reduce((sum, item) => sum + item.amount, 0);
  const available = claim.status === "STARTED" && Date.parse(claim.expires_at) > Date.now() && source.verification_status === "UNCLAIMED";
  return <main><div className="stack"><Link href="/" className="back">← SourcePay</Link><SourceCard source={source}/><div className="panel pay-panel"><p className="section-label">Creator claim</p><h2>{total ? `Supporters pledged ₦${(total / 100).toLocaleString()}` : "Make this source payable"}</h2><p>Prove you control this YouTube channel, then connect where payments go. Pledges have not been charged.</p>{available ? <ClaimButton token={token}/> : <p className="notice">This claim link is no longer active.</p>}</div></div></main>;
}
