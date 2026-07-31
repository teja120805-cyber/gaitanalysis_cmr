/** Tiny inline trend sparkline for roster rows — no chart lib needed. */
export function Sparkline({
  data,
  color,
  width = 96,
  height = 26,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const pts = data.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return [x, y] as const;
  });
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${d} L ${width} ${height} L 0 ${height} Z`;
  const last = pts[pts.length - 1];

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={area} fill={color} fillOpacity={0.1} />
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r={2.5} fill={color} />
    </svg>
  );
}
