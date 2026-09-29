"use client";

const PINE = "#2C7A4B";
const LEAF = "#5FAE46";
const FOREST = "#163C33";
const SAGE = "#5B7266";
const MINT = "#EAF5EC";

export function LineChart({ points, labels, height = 160, valueSuffix = "" }: { points: number[]; labels?: string[]; height?: number; valueSuffix?: string }) {
  if (!points.length) return <div className="py-8 text-center text-sm text-sage">No history data.</div>;
  const w = 600;
  const h = height;
  const pad = 28;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const x = (i: number) => pad + (i / Math.max(1, points.length - 1)) * (w - pad * 2);
  const y = (v: number) => h - pad - ((v - min) / span) * (h - pad * 2);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p).toFixed(1)}`).join(" ");
  const area = `${path} L${x(points.length - 1)},${h - pad} L${x(0)},${h - pad} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="price history chart">
      <path d={area} fill={MINT} />
      {[0, 0.5, 1].map((t) => (
        <g key={t}>
          <line x1={pad} x2={w - pad} y1={pad + t * (h - pad * 2)} y2={pad + t * (h - pad * 2)} stroke="#dcebe0" strokeWidth="1" />
          <text x={4} y={pad + t * (h - pad * 2) + 4} fontSize="10" fill={SAGE}>
            ₹{Math.round(max - t * span)}
          </text>
        </g>
      ))}
      <path d={path} fill="none" stroke={PINE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (i === points.length - 1 ? <circle key={i} cx={x(i)} cy={y(p)} r="4" fill={LEAF} stroke="#fff" strokeWidth="1.5" /> : null))}
      {labels && labels.length > 1 && (
        <>
          <text x={pad} y={h - 8} fontSize="10" fill={SAGE}>{labels[0]}</text>
          <text x={w - pad} y={h - 8} fontSize="10" fill={SAGE} textAnchor="end">{labels[labels.length - 1]}</text>
        </>
      )}
      <text x={w - pad} y={14} fontSize="10" fill={FOREST} textAnchor="end" fontWeight="bold">
        ₹{points[points.length - 1]}{valueSuffix}
      </text>
    </svg>
  );
}

export function Bars({ data, height = 170 }: { data: { label: string; value: number }[]; height?: number }) {
  if (!data.length) return <div className="py-8 text-center text-sm text-sage">No data.</div>;
  const w = 600;
  const h = height;
  const pad = 26;
  const max = Math.max(...data.map((d) => d.value)) || 1;
  const bw = (w - pad * 2) / data.length;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="bar chart">
      {data.map((d, i) => {
        const bh = (d.value / max) * (h - pad * 2);
        const bx = pad + i * bw + bw * 0.18;
        return (
          <g key={i}>
            <rect x={bx} y={h - pad - bh} width={bw * 0.64} height={bh} rx="3" fill={i % 2 === 0 ? PINE : LEAF} />
            <text x={bx + bw * 0.32} y={h - pad + 12} fontSize="9.5" fill={SAGE} textAnchor="middle">{d.label}</text>
            <text x={bx + bw * 0.32} y={h - pad - bh - 4} fontSize="9.5" fill={FOREST} fontWeight="bold" textAnchor="middle">
              {d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}k` : Math.round(d.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const DONUT_COLORS = [FOREST, PINE, LEAF, "#8CC63F", "#A7D3A0", SAGE, "#3E6B5C", "#74B05A", "#1F5245", "#C7E3C9", "#527D6E"];

export function Donut({ segments }: { segments: { label: string; value: number }[] }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const R = 42;
  const C = 2 * Math.PI * R;

  const circles = segments.reduce<
    { segment: { label: string; value: number }; index: number; offset: number; frac: number }[]
  >((acc, s, i) => {
    const previousOffset =
      acc.length > 0
        ? acc[acc.length - 1].offset + acc[acc.length - 1].frac
        : 0;

    const frac = s.value / total;

    return [
      ...acc,
      {
        segment: s,
        index: i,
        offset: previousOffset,
        frac,
      },
    ];
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <svg
        viewBox="0 0 120 120"
        className="h-36 w-36 shrink-0"
        role="img"
        aria-label="distribution chart"
      >
        <circle
          cx="60"
          cy="60"
          r={R}
          fill="none"
          stroke={MINT}
          strokeWidth="18"
        />

        {circles.map(({ segment, index, offset, frac }) => (
          <circle
            key={index}
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke={DONUT_COLORS[index % DONUT_COLORS.length]}
            strokeWidth="18"
            strokeDasharray={`${frac * C} ${C}`}
            strokeDashoffset={-offset * C}
            transform="rotate(-90 60 60)"
          />
        ))}

        <text
          x="60"
          y="64"
          textAnchor="middle"
          fontSize="14"
          fontWeight="bold"
          fill={FOREST}
        >
          {Math.round(total)}
        </text>
      </svg>

      <ul className="min-w-0 flex-1 space-y-1">
        {segments.map((s, i) => (
          <li key={i} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{
                background: DONUT_COLORS[i % DONUT_COLORS.length],
              }}
            />
            <span className="truncate text-ink">{s.label}</span>
            <span className="ml-auto font-bold text-sage">
              {Math.round((s.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}