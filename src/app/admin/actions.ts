"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isAdminAuthed } from "@/lib/admin-auth";
import { createUploadTarget, insertSong, nextTrackNumber, setSongFeatured, setSongRetired, type UploadTarget } from "@/lib/songs-admin";
import type { LyricLine } from "@/lib/supabase";

// A shared-secret cookie is enough here — same reasoning as /stats, this
// gates one owner-only page on a solo-artist site, not a multi-user account
// system. Unlike /stats though, this page can *write* the catalog, so every
// action re-checks isAdminAuthed() itself rather than trusting that the
// page only rendered the form to an authed owner.
export async function authenticateAdmin(formData: FormData) {
  const password = formData.get("password");
  const expected = process.env.ADMIN_PASSWORD;

  if (expected && password === expected) {
    (await cookies()).set("admin_auth", expected, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    redirect("/admin");
  }

  redirect("/admin?error=1");
}

export async function signOutAdmin() {
  (await cookies()).delete("admin_auth");
  redirect("/admin");
}

export async function getSuggestedTrackNumber(): Promise<number> {
  if (!(await isAdminAuthed())) throw new Error("Not authenticated.");
  return nextTrackNumber();
}

/** Step 1 of an upload: get somewhere to PUT the file bytes directly from
 * the browser. Extension is sanitized here since it ends up in a storage
 * path built from otherwise-trusted server state. */
export async function requestUploadUrl(kind: "audio" | "cover", extension: string): Promise<UploadTarget> {
  if (!(await isAdminAuthed())) throw new Error("Not authenticated.");
  const fallback = kind === "audio" ? "mp3" : "jpg";
  const clean = extension.replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 8) || fallback;
  return createUploadTarget(kind, clean);
}

export type NewSongPayload = {
  title: string;
  artist: string;
  description: string;
  trackNumber: number | null;
  durationSeconds: number | null;
  coverUrl: string | null;
  audioUrl: string;
  lyrics: LyricLine[];
  featured: boolean;
};

export type SubmitSongResult = { ok: true; id: string } | { ok: false; error: string };

/** Step 2: the metadata + the URLs step 1's uploads landed at. Called
 * directly from the client (not as a <form action>) since it's the last
 * step of a multi-step upload flow, not a standalone form submission. */
export async function submitSong(payload: NewSongPayload): Promise<SubmitSongResult> {
  if (!(await isAdminAuthed())) return { ok: false, error: "Not authenticated." };

  const title = payload.title.trim();
  const artist = payload.artist.trim();
  if (!title || !artist || !payload.audioUrl) {
    return { ok: false, error: "Title, artist, and an uploaded audio file are required." };
  }

  try {
    const id = await insertSong({
      title,
      artist,
      description: payload.description.trim() || null,
      trackNumber: payload.trackNumber,
      durationSeconds: payload.durationSeconds,
      coverUrl: payload.coverUrl,
      audioUrl: payload.audioUrl,
      lyrics: payload.lyrics.length > 0 ? payload.lyrics : null,
      featured: payload.featured,
    });
    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save the song." };
  }
}

/** Inline one-button toggles used from the admin catalog table — plain
 * <form action> targets, same shape as authenticateAdmin/signOutAdmin. */
export async function toggleFeatured(formData: FormData) {
  if (!(await isAdminAuthed())) return;
  await setSongFeatured(String(formData.get("id")), formData.get("next") === "true");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function toggleRetired(formData: FormData) {
  if (!(await isAdminAuthed())) return;
  await setSongRetired(String(formData.get("id")), formData.get("next") === "true");
  revalidatePath("/admin");
  revalidatePath("/");
}
