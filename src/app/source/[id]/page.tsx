import Link from "next/link";
import { db, one } from "@/lib/db";
import { SourceCard } from "@/components/SourceCard";
import { AmountFlow } from "@/components/AmountFlow";
import type { Content, Source } from "@/lib/types";

export default async function SourcePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ content?: string }> }) {
  const { id } = await params;
  const { content: contentId } = await searchParams;
  const database = db();
  const source = await one(database.from("sources").select("id,platform_id,current_handle,display_name,avatar_url,verification_status").eq("id", id).single()) as Source;
  const content = contentId ? await one(database.from("source_content").select("id,source_id,title,thumbnail_url,canonical_url").eq("id", contentId).eq("source_id", id).maybeSingle()) as Content | null : null;
  return <main><div className="stack"><Link href="/" className="back">← Find another source</Link><SourceCard source={source} content={content}/>{source.verification_status === "SUSPENDED" ? <div className="panel"><p>This source is unavailable for payment.</p></div> : <AmountFlow source={source} contentId={content?.id}/>}</div></main>;
}
