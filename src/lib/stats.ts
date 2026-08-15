import "server-only";
import { supabaseAdmin } from "./supabase-admin";
import type { FeedSong } from "./supabase";

export type WebPlay = {
  id: number;
  song_id: string;
  visitor_id: string;
  started_at: string;
  listened_seconds: number;
  song_duration_seconds: number | null;
  country: string | null;
  region: string | null;
  city: string | null;
  referrer: string | null;
  user_agent: string | null;
};

/** Most recent plays first, capped well above what a solo artist's site
 * generates — revisit with real pagination if that ever stops being true. */
export async function getAllWebPlays(): Promise<WebPlay[]> {
  const { data, error } = await supabaseAdmin
    .from("web_plays")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(5000);
  if (error) {
    console.error(error);
    return [];
  }
  return data ?? [];
}

function completionPct(play: WebPlay): number | null {
  if (!play.song_duration_seconds || play.song_duration_seconds <= 0) return null;
  return Math.min(1, play.listened_seconds / play.song_duration_seconds) * 100;
}

export type SongStats = {
  songId: string;
  title: string;
  plays: number;
  uniqueVisitors: number;
  totalListenedSeconds: number;
  avgListenedSeconds: number;
  avgCompletionPct: number | null;
};

export function aggregateBySong(plays: WebPlay[], songs: Map<string, FeedSong>): SongStats[] {
  const map = new Map<
    string,
    { plays: number; visitors: Set<string>; totalListened: number; completionSum: number; completionCount: number }
  >();
  for (const p of plays) {
    let entry = map.get(p.song_id);
    if (!entry) {
      entry = { plays: 0, visitors: new Set(), totalListened: 0, completionSum: 0, completionCount: 0 };
      map.set(p.song_id, entry);
    }
    entry.plays += 1;
    entry.visitors.add(p.visitor_id);
    entry.totalListened += p.listened_seconds;
    const pct = completionPct(p);
    if (pct !== null) {
      entry.completionSum += pct;
      entry.completionCount += 1;
    }
  }
  return [...map.entries()]
    .map(([songId, e]) => ({
      songId,
      title: songs.get(songId)?.title ?? "Unknown song",
      plays: e.plays,
      uniqueVisitors: e.visitors.size,
      totalListenedSeconds: e.totalListened,
      avgListenedSeconds: e.totalListened / e.plays,
      avgCompletionPct: e.completionCount > 0 ? e.completionSum / e.completionCount : null,
    }))
    .sort((a, b) => b.plays - a.plays);
}

export type VisitorStats = {
  visitorId: string;
  plays: number;
  totalListenedSeconds: number;
  firstSeen: string;
  lastSeen: string;
  topSongTitle: string;
  countries: string[];
};

export function aggregateByVisitor(plays: WebPlay[], songs: Map<string, FeedSong>): VisitorStats[] {
  const map = new Map<
    string,
    { plays: number; totalListened: number; firstSeen: string; lastSeen: string; songCounts: Map<string, number>; countries: Set<string> }
  >();
  for (const p of plays) {
    let entry = map.get(p.visitor_id);
    if (!entry) {
      entry = { plays: 0, totalListened: 0, firstSeen: p.started_at, lastSeen: p.started_at, songCounts: new Map(), countries: new Set() };
      map.set(p.visitor_id, entry);
    }
    entry.plays += 1;
    entry.totalListened += p.listened_seconds;
    if (p.started_at < entry.firstSeen) entry.firstSeen = p.started_at;
    if (p.started_at > entry.lastSeen) entry.lastSeen = p.started_at;
    entry.songCounts.set(p.song_id, (entry.songCounts.get(p.song_id) ?? 0) + 1);
    if (p.country) entry.countries.add(p.country);
  }
  return [...map.entries()]
    .map(([visitorId, e]) => {
      const topSongId = [...e.songCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      return {
        visitorId,
        plays: e.plays,
        totalListenedSeconds: e.totalListened,
        firstSeen: e.firstSeen,
        lastSeen: e.lastSeen,
        topSongTitle: topSongId ? (songs.get(topSongId)?.title ?? "Unknown song") : "—",
        countries: [...e.countries],
      };
    })
    .sort((a, b) => b.plays - a.plays);
}

export type LocationStats = { location: string; plays: number; uniqueVisitors: number };

export function aggregateByLocation(plays: WebPlay[]): LocationStats[] {
  const map = new Map<string, { plays: number; visitors: Set<string> }>();
  for (const p of plays) {
    const label = [p.city, p.region, p.country].filter(Boolean).join(", ") || "Unknown";
    let entry = map.get(label);
    if (!entry) {
      entry = { plays: 0, visitors: new Set() };
      map.set(label, entry);
    }
    entry.plays += 1;
    entry.visitors.add(p.visitor_id);
  }
  return [...map.entries()]
    .map(([location, e]) => ({ location, plays: e.plays, uniqueVisitors: e.visitors.size }))
    .sort((a, b) => b.plays - a.plays);
}

export type ReferrerStats = { referrer: string; plays: number };

export function aggregateByReferrer(plays: WebPlay[]): ReferrerStats[] {
  const map = new Map<string, number>();
  for (const p of plays) {
    let label = "Direct / unknown";
    if (p.referrer) {
      try {
        label = new URL(p.referrer).hostname.replace(/^www\./, "");
      } catch {
        label = p.referrer;
      }
    }
    map.set(label, (map.get(label) ?? 0) + 1);
  }
  return [...map.entries()].map(([referrer, plays]) => ({ referrer, plays })).sort((a, b) => b.plays - a.plays);
}

/** Coarse browser/OS label parsed from the user-agent string, for a
 * readable "device" column instead of a raw UA blob. Not exhaustive — good
 * enough for an at-a-glance breakdown, not device fingerprinting. */
export function parseUserAgent(ua: string | null): string {
  if (!ua) return "Unknown";
  const os = /iPhone|iPad/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
      ? "Android"
      : /Mac OS X/.test(ua)
        ? "Mac"
        : /Windows/.test(ua)
          ? "Windows"
          : /Linux/.test(ua)
            ? "Linux"
            : "Unknown OS";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua)
      ? "Chrome"
      : /CriOS/.test(ua)
        ? "Chrome"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Unknown browser";
  return `${browser} on ${os}`;
}
