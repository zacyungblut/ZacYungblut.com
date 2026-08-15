/** A human-readable, URL-safe slug from a song title — e.g. "Big Sky" ->
 * "big-sky". Not stored anywhere; computed the same way wherever a link is
 * built and wherever a URL is resolved back to a song, so it can never
 * drift out of sync with the title. */
export function slugify(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents (e.g. accented e -> e)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
