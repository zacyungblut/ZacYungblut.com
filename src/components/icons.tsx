export function PlayPauseIcon({ playing, className }: { playing: boolean; className?: string }) {
  if (playing) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <rect x="6" y="5" width="4" height="14" rx="1" />
        <rect x="14" y="5" width="4" height="14" rx="1" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

export function SkipIcon({ direction, className }: { direction: "back" | "forward"; className?: string }) {
  if (direction === "back") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <rect x="5" y="5" width="2.2" height="14" rx="1" />
        <path d="M18 5v14l-10-7z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M6 5v14l10-7z" />
      <rect x="16.8" y="5" width="2.2" height="14" rx="1" />
    </svg>
  );
}

function maskUrl(inner: string) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>${inner}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const PLAY_GLYPH = "<path d='M8 5v14l11-7z'/>";
const PAUSE_GLYPH = "<rect x='6' y='5' width='4' height='14' rx='1'/><rect x='14' y='5' width='4' height='14' rx='1'/>";

/** The web equivalent of the app's CamoIcon: fills the play/pause glyph with
 * the camo texture (via a CSS mask) instead of a flat color, same lightening
 * wash as CamoText/CamoIcon so it reads against the dark background. */
export function CamoPlayPauseIcon({ playing, size = 28, className }: { playing: boolean; size?: number; className?: string }) {
  const mask = maskUrl(playing ? PAUSE_GLYPH : PLAY_GLYPH);
  return (
    <span
      aria-hidden
      className={className}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.4), rgba(255,255,255,0.4)), url('/textures/camo.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        WebkitMaskImage: mask,
        maskImage: mask,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}
