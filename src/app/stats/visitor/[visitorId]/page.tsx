import Link from "next/link";
import { redirect } from "next/navigation";
import { getAllSongsForLookup } from "@/lib/supabase";
import { aggregateBySong, getWebPlaysForVisitor, parseUserAgent, summarizeVisitor } from "@/lib/stats";
import { isStatsAuthed } from "@/lib/stats-auth";
import { formatClock, formatDurationLong, formatDate } from "@/lib/stats-format";
import { th, td, tdMuted, StatCard, Section } from "../../ui";

export const dynamic = "force-dynamic";

export default async function VisitorStatsPage({ params }: { params: Promise<{ visitorId: string }> }) {
  const { visitorId } = await params;

  const isAuthed = await isStatsAuthed();
  if (!isAuthed) redirect("/stats");

  const [plays, songs] = await Promise.all([getWebPlaysForVisitor(visitorId), getAllSongsForLookup()]);
  const songMap = new Map(songs.map((s) => [s.id, s]));

  if (plays.length === 0) {
    return (
      <main className="min-h-screen bg-[#11130F] px-5 pb-20 pt-10">
        <div className="mx-auto max-w-3xl">
          <BackLink />
          <p className="mt-8 text-sm text-[#82806F]">No plays found for this visitor.</p>
        </div>
      </main>
    );
  }

  const summary = summarizeVisitor(plays);
  const songDistribution = aggregateBySong(plays, songMap);
  const maxSongPlays = Math.max(...songDistribution.map((s) => s.plays));

  return (
    <main className="min-h-screen bg-[#11130F] px-5 pb-20 pt-10">
      <div className="mx-auto max-w-5xl">
        <BackLink />
        <h1 className="mt-2 font-display text-3xl uppercase text-[#F3ECDD]">
          Visitor <span className="font-mono text-2xl text-[#82806F]">{visitorId.slice(0, 8)}</span>
        </h1>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total plays" value={summary.plays.toLocaleString()} />
          <StatCard label="Total listening time" value={formatDurationLong(summary.totalListenedSeconds)} />
          <StatCard
            label="Avg. completion"
            value={summary.avgCompletionPct !== null ? `${Math.round(summary.avgCompletionPct)}%` : "—"}
          />
          <StatCard label="Distinct songs" value={songDistribution.length.toLocaleString()} />
          <StatCard label="First seen" value={formatDate(summary.firstSeen)} />
          <StatCard label="Last seen" value={formatDate(summary.lastSeen)} />
          <StatCard label="Location(s)" value={summary.countries.join(", ") || "—"} />
          <StatCard label="Device(s)" value={summary.devices.join(", ") || "—"} />
        </div>

        <Section title="Song distribution">
          <div className="rounded-lg border border-white/10 p-4">
            <div className="flex flex-col gap-3">
              {songDistribution.map((s) => (
                <div key={s.songId} className="flex items-center gap-3">
                  <div className="w-32 shrink-0 truncate text-sm text-[#F3ECDD] sm:w-48" title={s.title}>
                    {s.title}
                  </div>
                  <div className="relative h-2.5 flex-1 rounded-full bg-white/5">
                    <div
                      className="h-full rounded-r-full bg-[#FF9100]"
                      style={{ width: `${Math.max(2, (s.plays / maxSongPlays) * 100)}%` }}
                    />
                  </div>
                  <div className="w-16 shrink-0 text-right text-xs tabular-nums text-[#B9B6A6]">
                    {s.plays} {s.plays === 1 ? "play" : "plays"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section title="Song breakdown">
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full min-w-[560px] border-collapse">
              <thead className="bg-white/5">
                <tr>
                  <th className={th}>Song</th>
                  <th className={th}>Plays</th>
                  <th className={th}>Avg. listened</th>
                  <th className={th}>Avg. completion</th>
                  <th className={th}>Total time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {songDistribution.map((s) => (
                  <tr key={s.songId}>
                    <td className={td}>{s.title}</td>
                    <td className={tdMuted}>{s.plays}</td>
                    <td className={tdMuted}>{formatClock(s.avgListenedSeconds)}</td>
                    <td className={tdMuted}>{s.avgCompletionPct !== null ? `${Math.round(s.avgCompletionPct)}%` : "—"}</td>
                    <td className={tdMuted}>{formatDurationLong(s.totalListenedSeconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title={`All plays (${plays.length})`}>
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full min-w-[760px] border-collapse">
              <thead className="bg-white/5">
                <tr>
                  <th className={th}>When</th>
                  <th className={th}>Song</th>
                  <th className={th}>Listened</th>
                  <th className={th}>Completion</th>
                  <th className={th}>Location</th>
                  <th className={th}>Referrer</th>
                  <th className={th}>Device</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {plays.map((p) => {
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
      </div>
    </main>
  );
}

function BackLink() {
  return (
    <Link href="/stats" className="text-xs text-[#82806F] transition-colors hover:text-[#B9B6A6]">
      ← Back to stats
    </Link>
  );
}
