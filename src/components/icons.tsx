function maskUrl(inner: string) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>${inner}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const PLAY_GLYPH = "<path d='M8 5v14l11-7z'/>";
const PAUSE_GLYPH = "<rect x='6' y='5' width='4' height='14' rx='1'/><rect x='14' y='5' width='4' height='14' rx='1'/>";
const SKIP_BACK_GLYPH = "<rect x='5' y='5' width='2.2' height='14' rx='1'/><path d='M18 5v14l-10-7z'/>";
const SKIP_FORWARD_GLYPH = "<path d='M6 5v14l10-7z'/><rect x='16.8' y='5' width='2.2' height='14' rx='1'/>";

/** The web equivalent of the app's CamoIcon: fills a glyph with the camo
 * texture (via a CSS mask) instead of a flat color, same lightening wash as
 * CamoText/CamoIcon so it reads against the dark background. */
function CamoGlyph({ glyph, size, className }: { glyph: string; size: number; className?: string }) {
  const mask = maskUrl(glyph);
  return (
    <span
      aria-hidden
      className={className}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.4), rgba(255,255,255,0.4)), url('/textures/camo.jpg')",
        // A fixed (not percentage) crop size, independent of the icon's own
        // size — so a small 16px icon still shows recognizably-sized camo
        // blotches instead of the whole pattern shrunk down to a blur.
        backgroundSize: "130px 130px",
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

export function CamoPlayPauseIcon({ playing, size = 28, className }: { playing: boolean; size?: number; className?: string }) {
  return <CamoGlyph glyph={playing ? PAUSE_GLYPH : PLAY_GLYPH} size={size} className={className} />;
}

export function CamoSkipIcon({ direction, size = 24, className }: { direction: "back" | "forward"; size?: number; className?: string }) {
  return <CamoGlyph glyph={direction === "back" ? SKIP_BACK_GLYPH : SKIP_FORWARD_GLYPH} size={size} className={className} />;
}
