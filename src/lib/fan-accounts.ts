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
};

export function aggregateByFanAccount(accounts: FanAccount[], posts: FanPost[]): FanAccountStats[] {
  const map = new Map<string, { posts: number; views: number; likes: number; comments: number }>();
  for (const p of posts) {
    let entry = map.get(p.fan_account_id);
    if (!entry) {
      entry = { posts: 0, views: 0, likes: 0, comments: 0 };
      map.set(p.fan_account_id, entry);
    }
    entry.posts += 1;
    entry.views += p.view_count;
    entry.likes += p.like_count;
    entry.comments += p.comment_count;
  }
  return accounts
    .map((a) => {
      const e = map.get(a.id) ?? { posts: 0, views: 0, likes: 0, comments: 0 };
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
      };
    })
    .sort((a, b) => b.totalViews - a.totalViews);
}

/** Sum of view_count across posts published in the last 7 days. Posts are
 * counted once at scrape time (view_count is a snapshot, not a delta), so
 * this is "views on recent posts," not a true week-over-week growth figure. */
export function weeklyFanViews(posts: FanPost[]): number {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return posts.filter((p) => p.posted_at && new Date(p.posted_at).getTime() >= weekAgo).reduce((sum, p) => sum + p.view_count, 0);
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
