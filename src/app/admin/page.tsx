import { getAllSongsForLookup } from "@/lib/supabase";
import { isAdminAuthed } from "@/lib/admin-auth";
import { SongUploadForm } from "@/components/admin/SongUploadForm";
import { authenticateAdmin, getSuggestedTrackNumber, signOutAdmin, toggleFeatured, toggleRetired } from "./actions";

// The catalog and queue order change from here — never serve a stale
// snapshot of either the gate or the current-queue listing below.
export const dynamic = "force-dynamic";

const th = "px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-[#82806F]";
const td = "px-3 py-2 text-sm text-[#F3ECDD]";
const tdMuted = "px-3 py-2 text-sm text-[#B9B6A6]";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const expected = process.env.ADMIN_PASSWORD;
  const isAuthed = await isAdminAuthed();

  if (!isAuthed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#11130F] px-6">
        <form action={authenticateAdmin} className="w-full max-w-xs text-center">
          <h1 className="font-display text-2xl uppercase text-[#F3ECDD]">Admin</h1>
          <input
            type="password"
            name="password"
            placeholder="Password"
            autoFocus
            className="mt-6 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-[#F3ECDD] outline-none focus:border-[#FF9100]"
          />
          {error ? <p className="mt-2 text-xs text-[#E5484D]">Wrong password.</p> : null}
          {!expected ? (
            <p className="mt-2 text-xs text-[#82806F]">ADMIN_PASSWORD isn&apos;t set on the server yet.</p>
          ) : null}
          <button type="submit" className="mt-4 w-full rounded-lg bg-[#FF9100] py-2.5 text-sm font-bold text-[#11130F]">
            Enter
          </button>
        </form>
      </main>
    );
  }

  const [allSongs, suggestedTrackNumber] = await Promise.all([getAllSongsForLookup(), getSuggestedTrackNumber()]);
  const feed = [...allSongs].sort((a, b) => (a.track_number ?? 0) - (b.track_number ?? 0));

  return (
    <main className="min-h-screen bg-[#11130F] px-5 pb-20 pt-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl uppercase text-[#F3ECDD]">Upload a song</h1>
          <form action={signOutAdmin}>
            <button type="submit" className="text-xs text-[#82806F] transition-colors hover:text-[#B9B6A6]">
              Sign out
            </button>
          </form>
        </div>

        <div className="mt-8">
          <SongUploadForm suggestedTrackNumber={suggestedTrackNumber} />
        </div>

        <div className="mt-14">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#FF9100]">Catalog</h2>
          {feed.length === 0 ? (
            <p className="text-sm text-[#82806F]">No songs yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full min-w-[640px] border-collapse">
                <thead className="bg-white/5">
                  <tr>
                    <th className={th}>#</th>
                    <th className={th}>Title</th>
                    <th className={th}>Artist</th>
                    <th className={th}>Lyrics</th>
                    <th className={th}>Featured</th>
                    <th className={th}>Retired</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {feed.map((s) => (
                    <tr key={s.id}>
                      <td className={tdMuted}>{s.track_number ?? "—"}</td>
                      <td className={td}>{s.title}</td>
                      <td className={tdMuted}>{s.artist}</td>
                      <td className={tdMuted}>{s.lyrics && s.lyrics.length > 0 ? `${s.lyrics.length} lines` : "—"}</td>
                      <td className={tdMuted}>
                        <form action={toggleFeatured}>
                          <input type="hidden" name="id" value={s.id} />
                          <input type="hidden" name="next" value={String(!s.featured)} />
                          <button type="submit" className="text-xs font-bold uppercase tracking-wide text-[#FF9100] hover:underline">
                            {s.featured ? "★ Featured" : "Feature"}
                          </button>
                        </form>
                      </td>
                      <td className={tdMuted}>
                        <form action={toggleRetired}>
                          <input type="hidden" name="id" value={s.id} />
                          <input type="hidden" name="next" value={String(!s.retired_at)} />
                          <button type="submit" className="text-xs text-[#82806F] hover:text-[#B9B6A6]">
                            {s.retired_at ? "Unretire" : "Retire"}
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
