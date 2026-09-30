import Link from "next/link";
import { db, one } from "@/lib/db";
import { appUrl } from "@/lib/env";
import { SourceCard } from "@/components/SourceCard";
import { ShareActions } from "@/components/ShareActions";
import { PledgePayment } from "@/components/PledgePayment";
import type { Content, Pledge, Source } from "@/lib/types";

export default async function PledgePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ claim?: string }> }) {
  const { id } = await params;
  const { claim: token } = await searchParams;
  const database = db();
  const pledge = await one(database.from("pledges").select("id,source_id,source_content_id,supporter_email,amount,status,expires_at").eq("id", id).single()) as Pledge;
  const source = await one(database.from("sources").select("id,platform_id,current_handle,display_name,avatar_url,verification_status").eq("id", pledge.source_id).single()) as Source;
  const content = pledge.source_content_id ? await one(database.from("source_content").select("id,source_id,title,thumbnail_url,canonical_url").eq("id", pledge.source_content_id).single()) as Content : null;
  const amount = `₦${(pledge.amount / 100).toLocaleString()}`;
  const claimUrl = token ? `${appUrl()}/c/${encodeURIComponent(token)}` : "";
  const message = `I want to send you ${amount} for your YouTube work through SourcePay. No money has been charged yet. Verify your channel to receive it: ${claimUrl}`;
  return <main><div className="stack"><Link href="/" className="back">← SourcePay</Link><SourceCard source={source} content={content}/>{pledge.status === "READY_TO_PAY" && source.verification_status === "VERIFIED" ? <PledgePayment pledge={pledge} source={source}/> : <div className="panel"><span className="success-icon">✓</span><p className="section-label">Support reserved</p><h1>{amount} pledged for {source.current_handle || source.display_name}.</h1><p className="muted">No money has been charged yet. The creator needs to verify this channel before you can pay.</p>{claimUrl && <><div className="divider"/><p className="section-label">Help the creator find it</p><ShareActions claimUrl={claimUrl} videoUrl={content?.canonical_url} message={message}/></>}{!claimUrl && <p className="notice">Use the original pledge link to share the creator claim page.</p>}</div>}</div></main>;
}
