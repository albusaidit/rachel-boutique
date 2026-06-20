"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";

export function AreaSparkline({
  values,
  width = 100,
  height = 28,
  responsive = false,
  animate = false,
}: {
  values: number[];
  width?: number;
  height?: number;
  responsive?: boolean;
  animate?: boolean;
}) {
  const reduce = useReducedMotion();
  // Stable unique gradient id so multiple sparklines don't collide (and SSR/client match).
  const gid = `rachel-spark-${useId().replace(/:/g, "")}`;

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
  const [lastX, lastY] = pts[pts.length - 1];
  const doAnimate = animate && !reduce;

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
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      {doAnimate ? (
        <>
          <motion.path
            d={fillPath}
            fill={`url(#${gid})`}
            stroke="none"
            className="text-[var(--a-accent)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          />
          <motion.path
            d={linePath}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            className="text-[var(--a-accent)]"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
            vectorEffect="non-scaling-stroke"
          />
          {!responsive && null}
          <motion.circle
            cx={lastX}
            cy={lastY}
            r={responsive ? 3 : 2.2}
            className="text-[var(--a-accent)]"
            fill="currentColor"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.25, type: "spring", stiffness: 400, damping: 18 }}
            style={{ transformOrigin: `${lastX}px ${lastY}px` }}
          />
        </>
      ) : (
        <>
          <path d={fillPath} fill={`url(#${gid})`} stroke="none" className="text-[var(--a-accent)]" />
          <path d={linePath} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" className="text-[var(--a-accent)]" />
        </>
      )}
    </svg>
  );
}
