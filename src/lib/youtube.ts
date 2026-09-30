import { env } from "./env";

type Snippet = {
  channelId?: string;
  channelTitle?: string;
  title?: string;
  customUrl?: string;
  thumbnails?: { default?: { url: string }; medium?: { url: string }; high?: { url: string } };
};
type YouTubeItem = { id: string; snippet: Snippet };

async function youtube(path: string, params: Record<string, string>, accessToken?: string): Promise<YouTubeItem[]> {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  if (!accessToken) url.searchParams.set("key", env("YOUTUBE_API_KEY"));
  const response = await fetch(url, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    cache: "no-store",
  });
  if (!response.ok) throw new Error("YouTube could not resolve this source right now.");
  const json = await response.json() as { items?: YouTubeItem[] };
  return json.items ?? [];
}

export type ResolvedSource = {
  channelId: string;
  handle: string | null;
  name: string;
  avatar: string | null;
  content: null | { videoId: string; type: "VIDEO" | "SHORT"; title: string; thumbnail: string | null; url: string };
};

export function parseYouTubeInput(raw: string): { kind: "video" | "short" | "channel" | "handle"; id: string } {
  const input = raw.trim();
  if (/^@[\w.-]{3,30}$/.test(input)) return { kind: "handle", id: input };
  let url: URL;
  try { url = new URL(input); } catch { throw new Error("Paste a YouTube video, Short, channel URL or @handle."); }
  const host = url.hostname.toLowerCase();
  const parts = url.pathname.split("/").filter(Boolean);
  if (host === "youtu.be" && /^[\w-]{11}$/.test(parts[0] ?? "")) return { kind: "video", id: parts[0] };
  if (!["youtube.com", "www.youtube.com", "m.youtube.com"].includes(host)) throw new Error("Paste a YouTube source.");
  if (parts[0] === "watch" && /^[\w-]{11}$/.test(url.searchParams.get("v") ?? "")) return { kind: "video", id: url.searchParams.get("v")! };
  if (parts[0] === "shorts" && /^[\w-]{11}$/.test(parts[1] ?? "")) return { kind: "short", id: parts[1] };
  if (parts[0] === "channel" && /^UC[\w-]{22}$/.test(parts[1] ?? "")) return { kind: "channel", id: parts[1] };
  if (/^@[\w.-]{3,30}$/.test(parts[0] ?? "")) return { kind: "handle", id: parts[0] };
  throw new Error("Paste a YouTube video, Short, channel URL or @handle.");
}

export async function resolveYouTube(raw: string): Promise<ResolvedSource> {
  const parsed = parseYouTubeInput(raw);
  let video: YouTubeItem | undefined;
  let channelId = parsed.id;
  if (parsed.kind === "video" || parsed.kind === "short") {
    video = (await youtube("videos", { part: "snippet", id: parsed.id }))[0];
    if (!video?.snippet.channelId) throw new Error("This video is not publicly resolvable. Try the creator's channel.");
    channelId = video.snippet.channelId;
  }
  const channel = (await youtube("channels", {
    part: "snippet",
    [parsed.kind === "handle" ? "forHandle" : "id"]: parsed.kind === "handle" ? parsed.id : channelId,
  }))[0];
  if (!channel) throw new Error("We could not find that YouTube channel.");
  return {
    channelId: channel.id,
    handle: channel.snippet.customUrl ? `@${channel.snippet.customUrl.replace(/^@/, "")}` : parsed.kind === "handle" ? parsed.id : null,
    name: channel.snippet.title ?? video?.snippet.channelTitle ?? "YouTube creator",
    avatar: channel.snippet.thumbnails?.high?.url ?? channel.snippet.thumbnails?.default?.url ?? null,
    content: video ? {
      videoId: parsed.id,
      type: parsed.kind === "short" ? "SHORT" : "VIDEO",
      title: video.snippet.title ?? "YouTube video",
      thumbnail: video.snippet.thumbnails?.high?.url ?? video.snippet.thumbnails?.medium?.url ?? null,
      url: `https://www.youtube.com/${parsed.kind === "short" ? "shorts/" : "watch?v="}${parsed.id}`,
    } : null,
  };
}

export async function authenticatedChannelIds(accessToken: string): Promise<string[]> {
  return (await youtube("channels", { part: "id", mine: "true" }, accessToken)).map((item) => item.id);
}
