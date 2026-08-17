import "server-only";
import { supabaseAdmin } from "./supabase-admin";

export type FanPlatform = "tiktok" | "instagram";

export type FanAccount = {
  id: string;
  platform: FanPlatform;
  username: string;
  display_name: string | null;
};

export type FanPost = {
  id: string;
  fan_account_id: string;
  permalink: string | null;
  caption: string | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  posted_at: string | null;
};

export async function getApprovedFanAccounts(): Promise<FanAccount[]> {
  const { data, error } = await supabaseAdmin
    .from("fan_accounts")
    .select("id, platform, username, display_name")
    .eq("status", "approved");
  if (error) {
    console.error(error);
    return [];
  }
  return data ?? [];
}

export async function getFanPostsForAccounts(accountIds: string[]): Promise<FanPost[]> {
  if (accountIds.length === 0) return [];
  const { data, error } = await supabaseAdmin
    .from("fan_posts")
    .select("id, fan_account_id, permalink, caption, view_count, like_count, comment_count, posted_at")
    .in("fan_account_id", accountIds)
    .order("posted_at", { ascending: false });
  if (error) {
    console.error(error);
    return [];
  }
  return data ?? [];
}

function nyCalendarKey(date: Date): number {
  const [y, m, d] = date.toLocaleDateString("en-CA", { timeZone: "America/New_York" }).split("-").map(Number);
  return y * 10000 + m * 100 + d;
}

function nyWeekdayNumber(date: Date): number {
  const map: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  return map[date.toLocaleDateString("en-US", { timeZone: "America/New_York", weekday: "short" })];
}

/** Shifts a YYYYMMDD calendar key by whole days. Only ever compares/shifts
 * calendar dates, never clock instants, so it's DST-safe without any
 * UTC-offset math. */
function shiftCalendarKey(key: number, days: number): number {
  const y = Math.floor(key / 10000);
  const m = Math.floor((key % 10000) / 100) - 1;
  const d = key % 100;
  const shifted = new Date(Date.UTC(y, m, d + days));
  return shifted.getUTCFullYear() * 10000 + (shifted.getUTCMonth() + 1) * 100 + shifted.getUTCDate();
}

/** Whether an ISO timestamp falls in the current Mon-Sun calendar week,
 * evaluated in US Eastern time (the site's display timezone). */
function isThisEasternWeek(iso: string | null, now: Date): boolean {
  if (!iso) return false;
  const todayKey = nyCalendarKey(now);
  const mondayKey = shiftCalendarKey(todayKey, -(nyWeekdayNumber(now) - 1));
  const sundayKey = shiftCalendarKey(mondayKey, 6);
  const postKey = nyCalendarKey(new Date(iso));
  return postKey >= mondayKey && postKey <= sundayKey;
}

export type FanAccountStats = {
  accountId: string;
  platform: FanPlatform;
  username: string;
  displayName: string | null;
  posts: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  avgViewsPerPost: number;
  weeklyViews: number;
  views24h: number;
};

export function aggregateByFanAccount(accounts: FanAccount[], posts: FanPost[]): FanAccountStats[] {
  const now = new Date();
  const dayAgo = now.getTime() - 24 * 60 * 60 * 1000;
  const map = new Map<string, { posts: number; views: number; likes: number; comments: number; weeklyViews: number; views24h: number }>();
  for (const p of posts) {
    let entry = map.get(p.fan_account_id);
    if (!entry) {
      entry = { posts: 0, views: 0, likes: 0, comments: 0, weeklyViews: 0, views24h: 0 };
      map.set(p.fan_account_id, entry);
    }
    entry.posts += 1;
    entry.views += p.view_count;
    entry.likes += p.like_count;
    entry.comments += p.comment_count;
    if (isThisEasternWeek(p.posted_at, now)) entry.weeklyViews += p.view_count;
    if (p.posted_at && new Date(p.posted_at).getTime() >= dayAgo) entry.views24h += p.view_count;
  }
  return accounts
    .map((a) => {
      const e = map.get(a.id) ?? { posts: 0, views: 0, likes: 0, comments: 0, weeklyViews: 0, views24h: 0 };
      return {
        accountId: a.id,
        platform: a.platform,
        username: a.username,
        displayName: a.display_name,
        posts: e.posts,
        totalViews: e.views,
        totalLikes: e.likes,
        totalComments: e.comments,
        avgViewsPerPost: e.posts > 0 ? e.views / e.posts : 0,
        weeklyViews: e.weeklyViews,
        views24h: e.views24h,
      };
    })
    .sort((a, b) => b.totalViews - a.totalViews);
}

export type FanRefreshResult = { id: string; username: string; ok: boolean; postsSynced?: number; error?: string };

/** Rescrapes every approved fan account's TikTok/Instagram post stats — the
 * same scrape-fan-accounts Edge Function the app's admin "Refresh all"
 * button calls. The artist signs into the app via Google OAuth (no
 * password), so this site can't authenticate as a real user session like
 * the app does — instead it proves itself with a shared secret the Edge
 * Function checks before falling back to its normal user-session check. */
export async function refreshFanAccounts(): Promise<FanRefreshResult[]> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const refreshSecret = process.env.FAN_REFRESH_SECRET;
  if (!supabaseUrl || !supabaseAnonKey) throw new Error("SUPABASE_URL / SUPABASE_ANON_KEY are not set on the server.");
  if (!refreshSecret) throw new Error("FAN_REFRESH_SECRET is not set on the server.");

  const res = await fetch(`${supabaseUrl}/functions/v1/scrape-fan-accounts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseAnonKey}`,
      apikey: supabaseAnonKey,
      "x-refresh-secret": refreshSecret,
    },
    body: JSON.stringify({}),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error ?? `scrape-fan-accounts returned ${res.status}`);
  return (json?.results ?? []) as FanRefreshResult[];
}

export type TopFanPost = FanPost & { platform: FanPlatform; username: string; displayName: string | null };

export function topFanPosts(accounts: FanAccount[], posts: FanPost[], limit: number): TopFanPost[] {
  const accountMap = new Map(accounts.map((a) => [a.id, a]));
  return posts
    .map((p) => {
      const account = accountMap.get(p.fan_account_id);
      return {
        ...p,
        platform: account?.platform ?? "tiktok",
        username: account?.username ?? "unknown",
        displayName: account?.display_name ?? null,
      };
    })
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, limit);
}
