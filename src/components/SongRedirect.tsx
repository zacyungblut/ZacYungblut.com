"use client";

import { useEffect } from "react";

/** Best-effort attempt to hand off to the app if it's installed — fires once
 * on load and fails silently if the scheme isn't registered, leaving the
 * rest of the page (which always renders regardless) as the fallback. */
export function SongRedirect({ songId }: { songId: string }) {
  useEffect(() => {
    window.location.href = `fanszy://song/${songId}`;
  }, [songId]);

  return null;
}
