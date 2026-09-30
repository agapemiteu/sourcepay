import Link from "next/link";
import { one } from "@/lib/db";
import { creatorClaimId } from "@/lib/security";

export default async function CompletePage() {
  const claimId = await creatorClaimId();
  if (!claimId) return <main><div className="stack"><div className="panel">Your creator session has expired.</div></div></main>;
  const claim = await one("select source_id, status from claims where id = ?", claimId);
  if (claim.status !== "ACTIVE") return <main><div className="stack"><div className="panel">The payout route is not active yet.</div></div></main>;
  const source = await one("select display_name, current_handle from sources where id = ?", claim.source_id);
  return <main><div className="stack"><div className="panel"><span className="success-icon">✓</span><p className="section-label">Source verified</p><h1>{source.current_handle || source.display_name} is now payable.</h1><p className="muted">Your YouTube channel is connected to a payout route. Supporters can pay without seeing your bank account.</p><Link href={`/source/${claim.source_id}`} className="button">View payable source ↗</Link></div></div></main>;
}
