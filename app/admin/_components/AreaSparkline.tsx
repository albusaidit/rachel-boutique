"use client";

export function AreaSparkline({
  values,
  width = 100,
  height = 28,
  responsive = false,
}: {
  values: number[];
  width?: number;
  height?: number;
  responsive?: boolean;
}) {
  if (!values || values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const stepX = width / (values.length - 1);

  const pts = values.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return [x, y] as const;
  });

  const linePath = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const fillPath = `${linePath} L${width},${height} L0,${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio={responsive ? "none" : "xMidYMid meet"}
      width={responsive ? "100%" : width}
      height={responsive ? "100%" : height}
      style={{ display: "block", width: responsive ? "100%" : undefined, height: responsive ? height : undefined }}
      role="img"
    >
      <defs>
        <linearGradient id="rachel-spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill="url(#rachel-spark)" stroke="none" className="text-[var(--a-accent)]" />
      <path d={linePath} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" className="text-[var(--a-accent)]" />
    </svg>
  );
}
