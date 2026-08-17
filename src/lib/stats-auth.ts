import "server-only";
import { cookies } from "next/headers";

export async function isStatsAuthed(): Promise<boolean> {
  const expected = process.env.STATS_PASSWORD;
  const cookieStore = await cookies();
  return Boolean(expected) && cookieStore.get("stats_auth")?.value === expected;
}
