import Link from "next/link";
import { getAllSongsForLookup } from "@/lib/supabase";
import { aggregateByLocation, aggregateByReferrer, aggregateBySong, aggregateByVisitor, getAllWebPlays, parseUserAgent } from "@/lib/stats";
import { isStatsAuthed } from "@/lib/stats-auth";
import { formatClock, formatCompact, formatDurationLong, formatDate } from "@/lib/stats-format";
import { aggregateByFanAccount, getApprovedFanAccounts, getFanPostsForAccounts, topFanPosts } from "@/lib/fan-accounts";
import { authenticate, signOut } from "./actions";
import { th, td, tdMuted, StatCard, Section } from "./ui";
import { RefreshFanButton } from "./RefreshFanButton";

export const dynamic = "force-dynamic";

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const expected = process.env.STATS_PASSWORD;
  const isAuthed = await isStatsAuthed();

  if (!isAuthed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#11130F] px-6">
        <form action={authenticate} className="w-full max-w-xs text-center">
          <h1 className="font-display text-2xl uppercase text-[#F3ECDD]">Stats</h1>
          <input
            type="password"
            name="password"
            placeholder="Password"
            autoFocus
            className="mt-6 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-[#F3ECDD] outline-none focus:border-[#FF9100]"
          />
          {error ? <p className="mt-2 text-xs text-[#E5484D]">Wrong password.</p> : null}
          {!expected ? (
            <p className="mt-2 text-xs text-[#82806F]">STATS_PASSWORD isn&apos;t set on the server yet.</p>
          ) : null}
          <button type="submit" className="mt-4 w-full rounded-lg bg-[#FF9100] py-2.5 text-sm font-bold text-[#11130F]">
            Enter
          </button>
        </form>
      </main>
    );
  }

  const [plays, songs, fanAccounts] = await Promise.all([getAllWebPlays(), getAllSongsForLookup(), getApprovedFanAccounts()]);
  const fanPosts = await getFanPostsForAccounts(fanAccounts.map((a) => a.id));
  const songMap = new Map(songs.map((s) => [s.id, s]));

  const fanAccountStats = aggregateByFanAccount(fanAccounts, fanPosts);
  const fanTotalViews = fanPosts.reduce((sum, p) => sum + p.view_count, 0);
  const fanWeeklyViews = fanAccountStats.reduce((sum, a) => sum + a.weeklyViews, 0);
  const topPosts = topFanPosts(fanAccounts, fanPosts, 20);

  const bySong = aggregateBySong(plays, songMap);
  const byVisitor = aggregateByVisitor(plays, songMap);
  const byLocation = aggregateByLocation(plays);
  const byReferrer = aggregateByReferrer(plays);

  const totalPlays = plays.length;
  const totalListenedSeconds = plays.reduce((sum, p) => sum + p.listened_seconds, 0);
  const uniqueVisitors = new Set(plays.map((p) => p.visitor_id)).size;
  const completions = bySong
    .filter((s) => s.avgCompletionPct !== null)
    .reduce((sum, s) => sum + (s.avgCompletionPct ?? 0) * s.plays, 0);
  const completionsWeight = bySong.filter((s) => s.avgCompletionPct !== null).reduce((sum, s) => sum + s.plays, 0);
  const avgCompletionPct = completionsWeight > 0 ? completions / completionsWeight : null;

  const recentPlays = plays.slice(0, 200);

  return (
    <main className="min-h-screen bg-[#11130F] px-5 pb-20 pt-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl uppercase text-[#F3ECDD]">Stats</h1>
          <form action={signOut}>
            <button type="submit" className="text-xs text-[#82806F] transition-colors hover:text-[#B9B6A6]">
              Sign out
            </button>
          </form>
        </div>

        {totalPlays === 0 ? (
          <p className="mt-8 text-sm text-[#82806F]">No plays logged yet.</p>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Total plays" value={totalPlays.toLocaleString()} />
              <StatCard label="Unique visitors" value={uniqueVisitors.toLocaleString()} />
              <StatCard label="Total listening time" value={formatDurationLong(totalListenedSeconds)} />
              <StatCard label="Avg. completion" value={avgCompletionPct !== null ? `${Math.round(avgCompletionPct)}%` : "—"} />
            </div>

            <Section title="By song">
              <div className="overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full min-w-[640px] border-collapse">
                  <thead className="bg-white/5">
                    <tr>
                      <th className={th}>Song</th>
                      <th className={th}>Plays</th>
                      <th className={th}>Unique listeners</th>
                      <th className={th}>Avg. listened</th>
                      <th className={th}>Avg. completion</th>
                      <th className={th}>Total time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {bySong.map((s) => (
                      <tr key={s.songId}>
                        <td className={td}>{s.title}</td>
                        <td className={tdMuted}>{s.plays}</td>
                        <td className={tdMuted}>{s.uniqueVisitors}</td>
                        <td className={tdMuted}>{formatClock(s.avgListenedSeconds)}</td>
                        <td className={tdMuted}>{s.avgCompletionPct !== null ? `${Math.round(s.avgCompletionPct)}%` : "—"}</td>
                        <td className={tdMuted}>{formatDurationLong(s.totalListenedSeconds)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="By location">
              <div className="overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full min-w-[420px] border-collapse">
                  <thead className="bg-white/5">
                    <tr>
                      <th className={th}>Location</th>
                      <th className={th}>Plays</th>
                      <th className={th}>Unique visitors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {byLocation.map((l) => (
                      <tr key={l.location}>
                        <td className={td}>{l.location}</td>
                        <td className={tdMuted}>{l.plays}</td>
                        <td className={tdMuted}>{l.uniqueVisitors}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="By referrer">
              <div className="overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full min-w-[320px] border-collapse">
                  <thead className="bg-white/5">
                    <tr>
                      <th className={th}>Referrer</th>
                      <th className={th}>Plays</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {byReferrer.map((r) => (
                      <tr key={r.referrer}>
                        <td className={td}>{r.referrer}</td>
                        <td className={tdMuted}>{r.plays}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="By visitor">
              <div className="overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full min-w-[720px] border-collapse">
                  <thead className="bg-white/5">
                    <tr>
                      <th className={th}>Visitor</th>
                      <th className={th}>Plays</th>
                      <th className={th}>Total listened</th>
                      <th className={th}>Favorite song</th>
                      <th className={th}>Location(s)</th>
                      <th className={th}>First seen</th>
                      <th className={th}>Last seen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {byVisitor.map((v) => (
                      <tr key={v.visitorId}>
                        <td className={`${td} font-mono text-xs`}>
                          <Link href={`/stats/visitor/${v.visitorId}`} className="text-[#FF9100] hover:underline">
                            {v.visitorId.slice(0, 8)}
                          </Link>
                        </td>
                        <td className={tdMuted}>{v.plays}</td>
                        <td className={tdMuted}>{formatDurationLong(v.totalListenedSeconds)}</td>
                        <td className={tdMuted}>{v.topSongTitle}</td>
                        <td className={tdMuted}>{v.countries.join(", ") || "—"}</td>
                        <td className={tdMuted}>{formatDate(v.firstSeen)}</td>
                        <td className={tdMuted}>{formatDate(v.lastSeen)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title={`Recent plays${plays.length > recentPlays.length ? ` (latest ${recentPlays.length} of ${plays.length})` : ""}`}>
              <div className="overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full min-w-[920px] border-collapse">
                  <thead className="bg-white/5">
                    <tr>
                      <th className={th}>When</th>
                      <th className={th}>Song</th>
                      <th className={th}>Visitor</th>
                      <th className={th}>Listened</th>
                      <th className={th}>Completion</th>
                      <th className={th}>Location</th>
                      <th className={th}>Referrer</th>
                      <th className={th}>Device</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {recentPlays.map((p) => {
                      const pct = p.song_duration_seconds ? Math.min(1, p.listened_seconds / p.song_duration_seconds) * 100 : null;
                      const location = [p.city, p.region, p.country].filter(Boolean).join(", ") || "Unknown";
                      let referrerLabel = "Direct";
                      if (p.referrer) {
                        try {
                          referrerLabel = new URL(p.referrer).hostname.replace(/^www\./, "");
                        } catch {
                          referrerLabel = p.referrer;
                        }
                      }
                      return (
                        <tr key={p.id}>
                          <td className={tdMuted}>{formatDate(p.started_at)}</td>
                          <td className={td}>{songMap.get(p.song_id)?.title ?? "Unknown song"}</td>
                          <td className={`${tdMuted} font-mono text-xs`}>
                            <Link href={`/stats/visitor/${p.visitor_id}`} className="text-[#FF9100] hover:underline">
                              {p.visitor_id.slice(0, 8)}
                            </Link>
                          </td>
                          <td className={tdMuted}>{formatClock(p.listened_seconds)}</td>
                          <td className={tdMuted}>{pct !== null ? `${Math.round(pct)}%` : "—"}</td>
                          <td className={tdMuted}>{location}</td>
                          <td className={tdMuted}>{referrerLabel}</td>
                          <td className={tdMuted}>{parseUserAgent(p.user_agent)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Section>
          </>
        )}

        <div className="mt-14">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#FF9100]">Fan portal</h2>
            <RefreshFanButton />
          </div>
          {fanAccounts.length === 0 ? (
            <p className="text-sm text-[#82806F]">No approved fan accounts yet.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Approved fan accounts" value={fanAccounts.length.toLocaleString()} />
                <StatCard label="Total posts" value={fanPosts.length.toLocaleString()} />
                <StatCard label="Total views" value={formatCompact(fanTotalViews)} />
                <StatCard label="Views this week (Mon-Sun)" value={formatCompact(fanWeeklyViews)} />
              </div>

              <div className="mt-6">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#82806F]">By account</h3>
                <div className="overflow-x-auto rounded-lg border border-white/10">
                  <table className="w-full min-w-[820px] border-collapse">
                    <thead className="bg-white/5">
                      <tr>
                        <th className={th}>Platform</th>
                        <th className={th}>Handle</th>
                        <th className={th}>Posts</th>
                        <th className={th}>Views this wk (mon-sun)</th>
                        <th className={th}>Total views</th>
                        <th className={th}>Total likes</th>
                        <th className={th}>Total comments</th>
                        <th className={th}>Avg. views/post</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {fanAccountStats.map((a) => (
                        <tr key={a.accountId}>
                          <td className={td}>{a.platform === "tiktok" ? "TikTok" : "Instagram"}</td>
                          <td className={td}>
                            {a.displayName ? `${a.displayName} ` : ""}
                            <span className="text-[#82806F]">@{a.username}</span>
                          </td>
                          <td className={tdMuted}>{a.posts}</td>
                          <td className={tdMuted}>{formatCompact(a.weeklyViews)}</td>
                          <td className={tdMuted}>{formatCompact(a.totalViews)}</td>
                          <td className={tdMuted}>{formatCompact(a.totalLikes)}</td>
                          <td className={tdMuted}>{formatCompact(a.totalComments)}</td>
                          <td className={tdMuted}>{formatCompact(Math.round(a.avgViewsPerPost))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {topPosts.length > 0 ? (
                <div className="mt-6">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#82806F]">Top posts</h3>
                  <div className="overflow-x-auto rounded-lg border border-white/10">
                    <table className="w-full min-w-[760px] border-collapse">
                      <thead className="bg-white/5">
                        <tr>
                          <th className={th}>Platform</th>
                          <th className={th}>Handle</th>
                          <th className={th}>Caption</th>
                          <th className={th}>Views</th>
                          <th className={th}>Likes</th>
                          <th className={th}>Comments</th>
                          <th className={th}>Posted</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {topPosts.map((p) => (
                          <tr key={p.id}>
                            <td className={td}>{p.platform === "tiktok" ? "TikTok" : "Instagram"}</td>
                            <td className={td}>@{p.username}</td>
                            <td className={`${tdMuted} max-w-[280px] overflow-hidden text-ellipsis`} title={p.caption ?? undefined}>
                              {p.permalink ? (
                                <a href={p.permalink} target="_blank" rel="noreferrer" className="text-[#FF9100] hover:underline">
                                  {p.caption || "View post"}
                                </a>
                              ) : (
                                p.caption || "—"
                              )}
                            </td>
                            <td className={tdMuted}>{formatCompact(p.view_count)}</td>
                            <td className={tdMuted}>{formatCompact(p.like_count)}</td>
                            <td className={tdMuted}>{formatCompact(p.comment_count)}</td>
                            <td className={tdMuted}>{p.posted_at ? formatDate(p.posted_at) : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
