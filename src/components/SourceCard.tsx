import type { Content, Source } from "@/lib/types";

export function SourceCard({ source, content }: { source: Source; content?: Content | null }) {
  return <div className="panel"><p className="section-label">YouTube source</p><div className="source-head">{source.avatar_url ? <img className="avatar" src={source.avatar_url} alt=""/> : <div className="avatar avatar-fallback">{source.display_name.charAt(0)}</div>}<div><h1>{source.display_name}</h1><p className="handle">{source.current_handle || "YouTube channel"}</p></div></div><span className={`badge ${source.verification_status !== "VERIFIED" ? "gray" : ""}`}>{source.verification_status === "VERIFIED" ? "Channel control verified" : "Not claimed yet"}</span>{content && <div className="video">{content.thumbnail_url && <img src={content.thumbnail_url} alt=""/>}<div><strong>{content.title}</strong><p>Source video</p></div></div>}</div>;
}
