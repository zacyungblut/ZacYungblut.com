export function Wordmark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 620 90" className={className} role="img" aria-label="Zac Yungblut">
      <defs>
        <pattern id="camoFill" patternUnits="userSpaceOnUse" width="90" height="90">
          <image href="/textures/camo.jpg" width="90" height="90" preserveAspectRatio="xMidYMid slice" />
        </pattern>
      </defs>
      <text
        x="50%"
        y="53%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="font-display"
        fontSize="64"
        letterSpacing="4"
        fill="url(#camoFill) #6b5a3d"
      >
        ZAC YUNGBLUT
      </text>
    </svg>
  );
}
