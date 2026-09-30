import Link from "next/link";
import { first, one } from "@/lib/db";
import { tokenHash } from "@/lib/security";
import { ClaimButton } from "@/components/ClaimButton";
import { SourceCard } from "@/components/SourceCard";
import type { Claim, Source } from "@/lib/types";

export default async function ClaimPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const claim = await one<Claim>("select id, source_id, status, expires_at from claims where token_hash = ?", tokenHash(token));
  const source = await one<Source>("select id, platform_id, current_handle, display_name, avatar_url, verification_status from sources where id = ?", claim.source_id);
  const paid = await first("select amount, status, settlement_status from payments where claim_id = ?", claim.id);
  const waiting = paid?.status === "SUCCESS" && paid.settlement_status === "WAITING_CLAIM";
  const available = claim.status === "STARTED" && Date.parse(claim.expires_at) > Date.now() && source.verification_status === "UNCLAIMED" && waiting;
  const title = waiting ? `₦${(paid.amount / 100).toLocaleString()} paid for this source` : "Make this source payable";
  return <main><div className="stack"><Link href="/" className="back">← SourcePay</Link><SourceCard source={source}/><div className="panel pay-panel"><p className="section-label">Creator claim</p><h2>{title}</h2><p>Verify that you control this YouTube channel, then connect your Nigerian bank to receive the payout.</p>{available ? <ClaimButton token={token}/> : <p className="notice">This claim link is not active.</p>}</div></div></main>;
}
