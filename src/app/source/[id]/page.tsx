import Link from "next/link";
import { first, one } from "@/lib/db";
import { SourceCard } from "@/components/SourceCard";
import { AmountFlow } from "@/components/AmountFlow";
import type { Content, Source } from "@/lib/types";

export default async function SourcePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ content?: string }> }) {
  const { id } = await params;
  const { content: contentId } = await searchParams;
  const source = await one<Source>("select id, platform_id, current_handle, display_name, avatar_url, verification_status from sources where id = ?", id);
  const content = contentId ? await first<Content>("select id, source_id, title, thumbnail_url, canonical_url from source_content where id = ? and source_id = ?", contentId, id) : null;
  return <main><div className="stack"><Link href="/" className="back">← Find another source</Link><SourceCard source={source} content={content}/>{source.verification_status === "SUSPENDED" ? <div className="panel"><p>This source is unavailable for payment.</p></div> : <AmountFlow source={source} contentId={content?.id} unclaimedPaymentsEnabled={process.env.ENABLE_UNCLAIMED_PAYMENTS === "true"}/>}</div></main>;
}
