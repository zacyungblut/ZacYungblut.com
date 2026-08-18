import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { refreshFanAccounts } from "@/lib/fan-accounts";

// Vercel Cron (see vercel.json) hits this once a day so the fan-portal
// numbers are never more than a day stale even if nobody opens /stats and
// clicks "Refresh stats" manually. Vercel signs cron requests with
// `Authorization: Bearer $CRON_SECRET` — verifying that is what stops
// anyone else from hitting this route and burning ScrapeCreators credits.
// Safe to run alongside manual refreshes: the underlying scrape upserts
// each post by its platform ID, so re-running it never double-counts,
// only overwrites stale counts with current ones.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const results = await refreshFanAccounts();
    revalidatePath("/stats");
    return NextResponse.json({ ok: true, results });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "refresh failed" }, { status: 500 });
  }
}
