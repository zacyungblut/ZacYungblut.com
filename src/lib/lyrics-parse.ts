import type { LyricLine } from "./supabase";

// Matches "[mm:ss]" or "[mm:ss.xx]" followed by the line text.
const LRC_LINE = /^\[(\d+):(\d+(?:\.\d+)?)\]\s*(.*)$/;

/** Parses a pasted lyrics block into LyricLine[] — either raw JSON
 * (`[{"t":12.3,"text":"..."}]`) or LRC (`[00:12.34]text` per line).
 * Both formats start with `[`, so JSON.parse is tried first and only
 * falls back to LRC parsing if that throws. Throws a user-facing Error on
 * malformed input rather than silently dropping lines. */
export function parseLyricsInput(raw: string): LyricLine[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    let parsed: unknown;
    let isJson = true;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      isJson = false;
    }
    if (isJson) {
      if (!Array.isArray(parsed)) {
        throw new Error('Lyrics JSON must be an array, e.g. [{"t":12.3,"text":"..."}].');
      }
      return parsed
        .map((item, i) => {
          if (
            typeof item !== "object" ||
            item === null ||
            typeof (item as Record<string, unknown>).t !== "number" ||
            typeof (item as Record<string, unknown>).text !== "string"
          ) {
            throw new Error(`Lyrics JSON entry ${i + 1} must look like {"t": <seconds>, "text": <string>}.`);
          }
          const obj = item as { t: number; text: string };
          return { t: obj.t, text: obj.text };
        })
        .sort((a, b) => a.t - b.t);
    }
  }

  const lines = trimmed
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return lines
    .map((line, i) => {
      const match = line.match(LRC_LINE);
      if (!match) {
        throw new Error(`Line ${i + 1} isn't valid LRC — expected "[mm:ss.xx] text" (or "[mm:ss] text"). Got: "${line}"`);
      }
      const minutes = Number(match[1]);
      const seconds = Number(match[2]);
      return { t: minutes * 60 + seconds, text: match[3].trim() };
    })
    .sort((a, b) => a.t - b.t);
}
