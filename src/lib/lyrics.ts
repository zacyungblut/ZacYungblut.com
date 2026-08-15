import type { LyricLine } from "./supabase";

/** Index of the lyric line active at `currentTime`, or -1 if before the first line. */
export function activeLyricIndex(lyrics: LyricLine[], currentTime: number): number {
  let index = -1;
  for (let i = 0; i < lyrics.length; i++) {
    if (lyrics[i].t <= currentTime) index = i;
    else break;
  }
  return index;
}
