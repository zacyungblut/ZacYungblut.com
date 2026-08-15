import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type TrackPlayBody = {
  songId?: unknown;
  visitorId?: unknown;
  listenedSeconds?: unknown;
  songDurationSeconds?: unknown;
  referrer?: unknown;
};

// Called via sendBeacon/fetch(keepalive) from the player whenever a listen
// concludes (song switches, ends, or the tab closes). Geo comes from
// Vercel's edge headers, not anything the client reports — trivially
// spoofable client input isn't trustworthy for that.
export async function POST(req: NextRequest) {
  let body: TrackPlayBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const { songId, visitorId, listenedSeconds, songDurationSeconds, referrer } = body;
  if (typeof songId !== "string" || typeof visitorId !== "string" || typeof listenedSeconds !== "number") {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const country = req.headers.get("x-vercel-ip-country");
  const region = req.headers.get("x-vercel-ip-country-region");
  const city = req.headers.get("x-vercel-ip-city");

  const { error } = await supabase.from("web_plays").insert({
    song_id: songId,
    visitor_id: visitorId,
    listened_seconds: Math.max(0, Math.round(listenedSeconds)),
    song_duration_seconds: typeof songDurationSeconds === "number" ? songDurationSeconds : null,
    country: country ? decodeURIComponent(country) : null,
    region: region ? decodeURIComponent(region) : null,
    city: city ? decodeURIComponent(city) : null,
    referrer: typeof referrer === "string" ? referrer.slice(0, 500) : null,
    user_agent: req.headers.get("user-agent"),
  });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "insert failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
