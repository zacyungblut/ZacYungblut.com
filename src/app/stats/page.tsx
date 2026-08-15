import { cookies } from "next/headers";
import { getAllSongsForLookup } from "@/lib/supabase";
import { aggregateByLocation, aggregateByReferrer, aggregateBySong, aggregateByVisitor, getAllWebPlays, parseUserAgent } from "@/lib/stats";
import { authenticate, signOut } from "./actions";

export const dynamic = "force-dynamic";

function formatClock(seconds: number): string {
  const s = Math.round(seconds);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function formatDurationLong(seconds: number): string {
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const th = "px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-[#82806F]";
const td = "px-3 py-2 text-sm text-[#F3ECDD] whitespace-nowrap";
const tdMuted = "px-3 py-2 text-sm text-[#B9B6A6] whitespace-nowrap";

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const expected = process.env.STATS_PASSWORD;
  const cookieStore = await cookies();
  const isAuthed = Boolean(expected) && cookieStore.get("stats_auth")?.value === expected;

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

  const [plays, songs] = await Promise.all([getAllWebPlays(), getAllSongsForLookup()]);
  const songMap = new Map(songs.map((s) => [s.id, s]));

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
                        <td className={`${td} font-mono text-xs`}>{v.visitorId.slice(0, 8)}</td>
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
                          <td className={`${tdMuted} font-mono text-xs`}>{p.visitor_id.slice(0, 8)}</td>
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
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-[#82806F]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[#F3ECDD]">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-10">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#FF9100]">{title}</h2>
      {children}
    </div>
  );
}
