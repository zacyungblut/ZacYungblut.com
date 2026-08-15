"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { FeedSong } from "./supabase";

type PlayerState = {
  queue: FeedSong[];
  currentSong: FeedSong | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  hasNext: boolean;
  /** Starts playing `songId` from `queue`, from `startAt` seconds in (0 by
   * default). A no-op on playback position if that song is already the one
   * playing — so calling this to just update the queue (e.g. landing on a
   * song's page without pressing play) never interrupts what's already
   * going. */
  playSong: (queue: FeedSong[], songId: string, startAt?: number) => void;
  togglePlayPause: () => void;
  restart: () => void;
  skip: () => void;
  seekTo: (seconds: number) => void;
};

const PlayerContext = createContext<PlayerState | null>(null);

const VISITOR_ID_KEY = "zy_visitor_id";

function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_ID_KEY, id);
  }
  return id;
}

/** Logs one concluded listen — called when playback moves off a song (switch,
 * end, restart) or the tab closes, not continuously. `sendBeacon` is used
 * when available since it's the one delivery method reliable during unload;
 * `fetch(keepalive)` covers everything else. Silently drops anything under
 * a second — accidental taps aren't a "listen". */
function logPlay(song: FeedSong, listenedSeconds: number) {
  if (listenedSeconds < 1) return;
  const payload = JSON.stringify({
    songId: song.id,
    visitorId: getVisitorId(),
    listenedSeconds,
    songDurationSeconds: song.duration_seconds,
    referrer: document.referrer || null,
  });
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/track-play", new Blob([payload], { type: "application/json" }));
  } else {
    fetch("/api/track-play", { method: "POST", body: payload, keepalive: true }).catch(() => {});
  }
}

// Mounted once in the root layout so the <audio> element — and playback —
// survives client-side navigation between pages, instead of being torn down
// and recreated by whichever page happened to render it.
export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Consumed (and reset) by the src-swap effect below — lets playSong() hand
  // off a starting position (e.g. a lyric line's timestamp) without racing
  // the effect's own audio.currentTime = 0 reset.
  const startAtRef = useRef(0);
  const [queue, setQueue] = useState<FeedSong[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const currentIndex = useMemo(() => queue.findIndex((s) => s.id === currentId), [queue, currentId]);
  const currentSong = currentIndex >= 0 ? queue[currentIndex] : null;
  const hasNext = currentIndex >= 0 && currentIndex < queue.length - 1;

  useEffect(() => {
    if (!currentSong || !audioRef.current) return;
    const audio = audioRef.current;
    audio.src = currentSong.audio_url;
    const startAt = startAtRef.current;
    startAtRef.current = 0;
    audio.currentTime = startAt;
    setCurrentTime(startAt);
    audio.play().then(
      () => setIsPlaying(true),
      () => setIsPlaying(false)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSong?.id]);

  function playSong(newQueue: FeedSong[], songId: string, startAt = 0) {
    setQueue(newQueue);
    if (songId !== currentId) {
      if (currentSong && audioRef.current) logPlay(currentSong, audioRef.current.currentTime);
      startAtRef.current = startAt;
      setCurrentId(songId);
    }
  }

  function togglePlayPause() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(
        () => setIsPlaying(true),
        () => {}
      );
    }
  }

  function restart() {
    const audio = audioRef.current;
    if (!audio) return;
    if (currentSong) logPlay(currentSong, audio.currentTime);
    audio.currentTime = 0;
    setCurrentTime(0);
  }

  function skip() {
    const next = queue[currentIndex + 1];
    if (!next) return;
    if (currentSong && audioRef.current) logPlay(currentSong, audioRef.current.currentTime);
    setCurrentId(next.id);
  }

  function handleEnded() {
    if (currentSong && audioRef.current) logPlay(currentSong, audioRef.current.currentTime);
    const next = queue[currentIndex + 1];
    if (next) {
      setCurrentId(next.id);
    } else {
      setIsPlaying(false);
    }
  }

  // Client-side navigation between pages doesn't unload the document (that's
  // the whole point of the persistent player), so this is the one place a
  // truly-ending session — closed tab, hard navigation away from the site —
  // gets its in-progress listen logged.
  useEffect(() => {
    function handlePageHide() {
      if (currentSong && audioRef.current) logPlay(currentSong, audioRef.current.currentTime);
    }
    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [currentSong]);

  function seekTo(seconds: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = seconds;
    setCurrentTime(seconds);
    if (!isPlaying) {
      audio.play().then(
        () => setIsPlaying(true),
        () => {}
      );
    }
  }

  const value: PlayerState = {
    queue,
    currentSong,
    isPlaying,
    currentTime,
    duration,
    hasNext,
    playSong,
    togglePlayPause,
    restart,
    skip,
    seekTo,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={handleEnded}
      />
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerState {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within a PlayerProvider");
  return ctx;
}
