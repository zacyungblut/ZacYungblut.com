"use client";

import { useState } from "react";
import { requestUploadUrl, submitSong } from "@/app/admin/actions";
import { parseLyricsInput } from "@/lib/lyrics-parse";

type Status = "idle" | "uploading" | "saving" | "success" | "error";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#F3ECDD] outline-none focus:border-[#FF9100]";
const labelClass = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#82806F]";

async function uploadFile(file: File, kind: "audio" | "cover"): Promise<string> {
  const ext = file.name.split(".").pop() ?? "";
  const target = await requestUploadUrl(kind, ext);
  // Straight to Supabase Storage, not through this site's server — a
  // full-length song upload would otherwise have to fit inside Vercel's
  // request body limit.
  const res = await fetch(target.signedUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type || "application/octet-stream" },
  });
  if (!res.ok) throw new Error(`${kind === "audio" ? "Audio" : "Cover"} upload failed (${res.status}).`);
  return target.publicUrl;
}

export function SongUploadForm({ suggestedTrackNumber }: { suggestedTrackNumber: number }) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("Zac Yungblut");
  const [description, setDescription] = useState("");
  const [trackNumber, setTrackNumber] = useState(suggestedTrackNumber);
  const [featured, setFeatured] = useState(false);

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  const [lyricsText, setLyricsText] = useState("");

  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  function handleAudioChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioFile(file);
    setAudioUrl(file ? URL.createObjectURL(file) : null);
    setDuration(null);
  }

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (coverUrl) URL.revokeObjectURL(coverUrl);
    setCoverFile(file);
    setCoverUrl(file ? URL.createObjectURL(file) : null);
  }

  function resetForm(nextTrackNumber: number) {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    if (coverUrl) URL.revokeObjectURL(coverUrl);
    setTitle("");
    setDescription("");
    setTrackNumber(nextTrackNumber);
    setFeatured(false);
    setAudioFile(null);
    setAudioUrl(null);
    setDuration(null);
    setCoverFile(null);
    setCoverUrl(null);
    setLyricsText("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !artist.trim() || !audioFile) {
      setStatus("error");
      setMessage("Title, artist, and an audio file are required.");
      return;
    }

    setMessage(null);

    let lyrics;
    try {
      lyrics = parseLyricsInput(lyricsText);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Could not parse lyrics.");
      return;
    }

    try {
      setStatus("uploading");
      const uploadedAudioUrl = await uploadFile(audioFile, "audio");
      const uploadedCoverUrl = coverFile ? await uploadFile(coverFile, "cover") : null;

      setStatus("saving");
      const result = await submitSong({
        title,
        artist,
        description,
        trackNumber: Number.isFinite(trackNumber) ? trackNumber : null,
        durationSeconds: duration !== null ? Math.round(duration) : null,
        coverUrl: uploadedCoverUrl,
        audioUrl: uploadedAudioUrl,
        lyrics,
        featured,
      });

      if (result.ok) {
        setStatus("success");
        setMessage(`"${title}" saved.`);
        resetForm(trackNumber + 1);
      } else {
        setStatus("error");
        setMessage(result.error);
      }
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  const isBusy = status === "uploading" || status === "saving";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {audioUrl ? (
        <audio src={audioUrl} onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)} className="hidden" />
      ) : null}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Artist</label>
          <input value={artist} onChange={(e) => setArtist(e.target.value)} required className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Track number</label>
          <input
            type="number"
            value={trackNumber}
            onChange={(e) => setTrackNumber(Number(e.target.value))}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Duration</label>
          <div className="flex h-[38px] items-center text-sm text-[#B9B6A6]">
            {duration !== null ? `${Math.floor(duration / 60)}:${Math.round(duration % 60).toString().padStart(2, "0")}` : "Detected from audio file"}
          </div>
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs text-[#82806F]">
        <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
        Featured — shows in the homepage&apos;s Featured section
      </label>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Audio file</label>
          <input type="file" accept="audio/*" onChange={handleAudioChange} required className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-2 file:py-1 file:text-[#F3ECDD]`} />
        </div>
        <div>
          <label className={labelClass}>Cover image</label>
          <input type="file" accept="image/*" onChange={handleCoverChange} className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-2 file:py-1 file:text-[#F3ECDD]`} />
        </div>
      </div>

      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- local blob: preview, not an optimizable remote image
        <img src={coverUrl} alt="Cover preview" className="h-24 w-24 rounded-lg object-cover" />
      ) : null}

      <div>
        <label className={labelClass}>Lyrics (optional)</label>
        <textarea
          value={lyricsText}
          onChange={(e) => setLyricsText(e.target.value)}
          rows={8}
          placeholder={'Paste LRC ("[00:12.34] line" per line) or JSON ([{"t":12.3,"text":"..."}])'}
          className={inputClass}
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isBusy}
          className="rounded-lg bg-[#FF9100] px-5 py-2.5 text-sm font-bold text-[#11130F] disabled:opacity-50"
        >
          {status === "uploading" ? "Uploading…" : status === "saving" ? "Saving…" : "Upload song"}
        </button>
        {message ? (
          <span className={`text-xs ${status === "error" ? "text-[#E5484D]" : "text-[#7FA06F]"}`}>{message}</span>
        ) : null}
      </div>
    </form>
  );
}
