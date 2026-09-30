import { NextRequest, NextResponse } from "next/server";
import { db, one } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { resolveYouTube } from "@/lib/youtube";

export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json() as { input?: string };
    if (!input || typeof input !== "string" || input.length > 500) throw new Error("Paste a YouTube source.");
    const resolved = await resolveYouTube(input);
    const database = db();
    const existing = await database.from("sources").select("*").eq("platform", "YOUTUBE").eq("platform_id", resolved.channelId).maybeSingle();
    if (existing.error) throw new Error(existing.error.message);
    let source = existing.data;
    if (!source) {
      const inserted = await database.from("sources").upsert({ platform: "YOUTUBE", platform_id: resolved.channelId, current_handle: resolved.handle, display_name: resolved.name, avatar_url: resolved.avatar }, { onConflict: "platform,platform_id", ignoreDuplicates: true }).select("*").maybeSingle();
      if (inserted.error) throw new Error(inserted.error.message);
      source = inserted.data ?? await one(database.from("sources").select("*").eq("platform", "YOUTUBE").eq("platform_id", resolved.channelId).single());
    } else {
      await one(database.from("sources").update({ current_handle: resolved.handle, display_name: resolved.name, avatar_url: resolved.avatar, updated_at: new Date().toISOString() }).eq("id", source.id).select("id").single());
    }
    let content = null;
    if (resolved.content) {
      content = await one(database.from("source_content").upsert({ source_id: source.id, platform_content_id: resolved.content.videoId, type: resolved.content.type, title: resolved.content.title, thumbnail_url: resolved.content.thumbnail, canonical_url: resolved.content.url }, { onConflict: "source_id,platform_content_id" }).select("id").single());
    }
    return NextResponse.json({ sourceId: source.id, contentId: content?.id ?? null });
  } catch (error) { return errorResponse(error); }
}
