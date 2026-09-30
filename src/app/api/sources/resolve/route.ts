import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { now, one } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { resolveYouTube } from "@/lib/youtube";

export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json() as { input?: string };
    if (!input || typeof input !== "string" || input.length > 500) throw new Error("Paste a YouTube source.");
    const resolved = await resolveYouTube(input);
    const source = await one(
      `insert into sources (id, platform, platform_id, current_handle, display_name, avatar_url) values (?, 'YOUTUBE', ?, ?, ?, ?)
       on conflict (platform, platform_id) do update set current_handle = excluded.current_handle, display_name = excluded.display_name, avatar_url = excluded.avatar_url, updated_at = ?
       returning id`,
      randomUUID(), resolved.channelId, resolved.handle, resolved.name, resolved.avatar, now(),
    );
    let content = null;
    if (resolved.content) {
      content = await one(
        `insert into source_content (id, source_id, platform_content_id, type, title, thumbnail_url, canonical_url) values (?, ?, ?, ?, ?, ?, ?)
         on conflict (source_id, platform_content_id) do update set type = excluded.type, title = excluded.title, thumbnail_url = excluded.thumbnail_url, canonical_url = excluded.canonical_url
         returning id`,
        randomUUID(), source.id, resolved.content.videoId, resolved.content.type, resolved.content.title, resolved.content.thumbnail, resolved.content.url,
      );
    }
    return NextResponse.json({ sourceId: source.id, contentId: content?.id ?? null });
  } catch (error) { return errorResponse(error); }
}
