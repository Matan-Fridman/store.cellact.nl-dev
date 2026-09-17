interface GradientGlowProps {
  size?: number;
  opacity?: number;
  /** Override the auto-calculated blur (px). Default: size * 0.2 */
  blur?: number;
  className?: string;
}

/**
 * A soft radial ambient glow using the brand gradient.
 * Always positioned by the parent (absolute/relative) via className.
 * Never used as a button fill — purely atmospheric.
 */
export function GradientGlow({
  size = 600,
  opacity = 0.18,
  blur,
  className = "",
}: GradientGlowProps) {
  const blurPx = blur ?? Math.round(size * 0.2);

  return (
    <div
      aria-hidden
      className={`pointer-events-none select-none shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background:
          "radial-gradient(circle, #8fd4ff 0%, #4aa3f5 40%, transparent 100%)",
        opacity,
        filter: `blur(${blurPx}px)`,
      }}
    />
  );
}
