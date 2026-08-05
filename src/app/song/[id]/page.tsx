import type { Metadata } from "next";
import Image from "next/image";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SongRedirect } from "@/components/SongRedirect";
import { getPublicSong } from "@/lib/supabase";
import { APPLE_MUSIC_URL, SPOTIFY_URL } from "@/lib/links";

const FALLBACK_TITLE = "A song from Zac Yungblut";
const FALLBACK_DESCRIPTION =
  "Someone shared a song with you from the Zac Yungblut app. Get the app to listen — unreleased music drops there first.";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const song = await getPublicSong(id);

  if (!song) {
    return { title: FALLBACK_TITLE, description: FALLBACK_DESCRIPTION };
  }

  const title = `"${song.title}" — Zac Yungblut`;
  const description = song.retired_at
    ? `${song.artist} — out now. Stream it, or get the app to help decide what's next.`
    : `${song.artist} — unreleased. Get the app to hear it first.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: song.cover_url ? [song.cover_url] : undefined,
    },
  };
}

export default async function SongPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const song = await getPublicSong(id);
  const isReleased = Boolean(song?.retired_at);

  return (
    <>
      <Nav />
      <main className="flex flex-1 items-center justify-center">
        <section className="mx-auto flex max-w-md flex-col items-center px-6 pt-6 pb-20 text-center">
          <SongRedirect songId={id} />

          {song?.cover_url ? (
            <div className="w-56 overflow-hidden rounded-sm shadow-[0_8px_30px_rgba(0,0,0,0.12)] sm:w-64">
              <Image
                src={song.cover_url}
                alt={`"${song.title}" cover art`}
                width={640}
                height={640}
                priority
                className="h-full w-full object-cover"
              />
            </div>
          ) : null}

          <h1 className="emboss font-display mt-8 text-[40px] leading-[0.95] uppercase sm:text-[48px]">
            {song ? (
              song.title
            ) : (
              <>
                Someone shared
                <br />a song with you
              </>
            )}
          </h1>
          {song ? <p className="text-ink-soft mt-2 text-[15px]">{song.artist}</p> : null}

          <p className="text-ink-soft mt-5 text-[15px] leading-relaxed">
            {isReleased
              ? "This one's already out — stream it below, or get the app to help decide what drops next."
              : "This one hasn't dropped yet. Get the Zac Yungblut app to hear it — the most played unreleased songs get released next."}
          </p>

          <a
            href="#"
            className="bg-ink mt-8 inline-flex items-center justify-center rounded-full px-8 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-85 active:scale-[0.97]"
          >
            Download the App
          </a>

          <p className="text-ink-soft/70 mt-10 text-xs tracking-wide">
            {isReleased ? "Stream it on" : "Already released? Listen on"}
          </p>

          <div className="text-ink-soft mt-3 flex items-center gap-6 text-[13px]">
            <a
              href={SPOTIFY_URL}
              target="_blank"
              rel="noopener"
              className="hover:text-ink flex items-center gap-2 transition-colors"
            >
              <span className="border-ink/15 flex h-9 w-9 items-center justify-center rounded-lg border">
                <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-current">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
              </span>
              Spotify
            </a>
            <a
              href={APPLE_MUSIC_URL}
              target="_blank"
              rel="noopener"
              className="hover:text-ink flex items-center gap-2 transition-colors"
            >
              <span className="border-ink/15 flex h-9 w-9 items-center justify-center rounded-lg border">
                <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-current">
                  <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.801.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03a12.5 12.5 0 001.57-.1c.822-.106 1.596-.35 2.295-.81a5.046 5.046 0 001.88-2.207c.186-.42.293-.87.37-1.324.113-.675.138-1.358.137-2.04-.002-3.8 0-7.595-.003-11.393zm-6.423 3.99v5.712c0 .417-.058.827-.244 1.206-.29.59-.76.962-1.388 1.14-.35.1-.706.157-1.07.173-.95.045-1.773-.6-1.943-1.536a1.88 1.88 0 011.038-2.022c.323-.16.67-.25 1.018-.324.378-.082.758-.153 1.134-.24.274-.063.457-.23.51-.516a.904.904 0 00.02-.193c0-1.815 0-3.63-.002-5.443a.725.725 0 00-.026-.185c-.04-.15-.15-.243-.304-.234-.16.01-.318.035-.475.066-.76.15-1.52.303-2.28.456l-2.325.47-1.374.278c-.016.003-.032.01-.048.013-.277.077-.377.203-.39.49-.002.042 0 .086 0 .13-.002 2.602 0 5.204-.003 7.805 0 .42-.047.836-.215 1.227-.278.64-.77 1.04-1.434 1.233-.35.1-.71.16-1.075.172-.96.036-1.755-.6-1.92-1.544-.14-.812.23-1.685 1.154-2.075.357-.15.73-.232 1.108-.31.287-.06.575-.116.86-.177.383-.083.583-.323.6-.714v-.15c0-2.96 0-5.922.002-8.882 0-.123.013-.25.042-.37.07-.285.273-.448.546-.518.255-.066.515-.112.774-.165.733-.15 1.466-.296 2.2-.444l2.27-.46c.67-.134 1.34-.27 2.01-.403.22-.043.442-.088.663-.106.31-.025.523.17.554.482.008.073.012.148.012.223.002 1.91.002 3.822 0 5.732z" />
                </svg>
              </span>
              Apple Music
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
