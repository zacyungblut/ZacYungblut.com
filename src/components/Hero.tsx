import Image from "next/image";
import { APPLE_MUSIC_URL, SPOTIFY_URL } from "@/lib/links";

export function Hero() {
  return (
    <section className="mx-auto flex max-w-md flex-col items-center px-6 pt-14 pb-20 text-center">
      <div className="w-56 overflow-hidden rounded-sm shadow-[0_8px_30px_rgba(0,0,0,0.12)] sm:w-64">
        <Image
          src="/images/hero-days-before.jpg"
          alt='Zac Yungblut with a cigar box guitar, roadside, next to a hand-painted "Days Before" sign.'
          width={900}
          height={900}
          priority
          className="h-full w-full object-cover"
        />
      </div>

      <h1 className="emboss font-display mt-10 text-[40px] leading-[0.95] uppercase sm:text-[48px]">
        Listen to his
        <br />
        unreleased music.
      </h1>

      <p className="text-ink-soft mt-5 text-[15px] leading-relaxed">
        Get the Zac Yungblut app to listen to unreleased music, the most played song gets released next.
      </p>

      <a
        href="#"
        className="bg-ink mt-8 inline-flex items-center justify-center rounded-full px-8 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-85 active:scale-[0.97]"
      >
        Download the App
      </a>
      <span className="text-ink-soft/70 mt-3 text-xs tracking-wide">iPhone &middot; Coming soon</span>

      <div className="text-ink-soft mt-9 flex items-center gap-3 text-[13px]">
        <a href={SPOTIFY_URL} target="_blank" rel="noopener" className="hover:text-ink transition-colors">
          Spotify
        </a>
        <span aria-hidden="true">&middot;</span>
        <a href={APPLE_MUSIC_URL} target="_blank" rel="noopener" className="hover:text-ink transition-colors">
          Apple Music
        </a>
      </div>
    </section>
  );
}
