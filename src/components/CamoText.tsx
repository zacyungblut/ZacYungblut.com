// The web equivalent of the app's CamoText: fills text with the camo
// texture instead of a flat color, via background-clip: text. The source
// texture is dark, which reads poorly against the near-black background, so
// a translucent white wash is layered over it (same fix the app makes).
const camoStyle = {
  backgroundImage: "linear-gradient(rgba(255,255,255,0.4), rgba(255,255,255,0.4)), url('/textures/camo.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
};

export function CamoText({
  as,
  className,
  children,
}: {
  as?: "h1" | "h2" | "span";
  className?: string;
  children: React.ReactNode;
}) {
  const Tag = as ?? "span";
  return (
    <Tag className={`bg-clip-text text-transparent ${className ?? ""}`} style={camoStyle}>
      {children}
    </Tag>
  );
}
