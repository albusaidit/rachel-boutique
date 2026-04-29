type Size = "xs" | "sm" | "md" | "lg" | "hero";

const sizes: Record<Size, { fontSize: string; tracking: string }> = {
  xs: { fontSize: "11px", tracking: "0.25em" },
  sm: { fontSize: "16px", tracking: "0.22em" },
  md: { fontSize: "22px", tracking: "0.2em" },
  lg: { fontSize: "32px", tracking: "0.18em" },
  hero: { fontSize: "clamp(56px, 9vw, 112px)", tracking: "0.14em" },
};

export function BrandMark({
  size = "sm",
  className = "",
  alt = "RACHÉL",
  priority: _priority,
}: {
  size?: Size;
  priority?: boolean;
  className?: string;
  alt?: string;
}) {
  const { fontSize, tracking } = sizes[size];
  void _priority;
  return (
    <span
      role="img"
      aria-label={alt}
      className={`wordmark ${className}`}
      style={{ fontSize, letterSpacing: tracking }}
    >
      RACHÉL
    </span>
  );
}
