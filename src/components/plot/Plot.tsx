/**
 * A small, dependency-free SVG plotting kit tuned for statistical graphics:
 * linear scales with "nice" ticks, recessive hairline grid, 2px lines,
 * ringed markers, nearest-point tooltips and draggable handles.
 */
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type PointerEvent as RPointerEvent } from 'react';
import { cn } from '@/lib/utils';

export interface Scale {
  (v: number): number;
  invert: (px: number) => number;
  domain: [number, number];
  range: [number, number];
}

export function linearScale(domain: [number, number], range: [number, number]): Scale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0 || 1;
  const f = ((v: number) => r0 + ((v - d0) / span) * (r1 - r0)) as Scale;
  f.invert = (px: number) => d0 + ((px - r0) / (r1 - r0 || 1)) * span;
  f.domain = domain;
  f.range = range;
  return f;
}

/** "Nice" tick values (1, 2, 5 × 10^k steps), like d3.ticks. */
export function niceTicks(lo: number, hi: number, count = 5): number[] {
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [];
  if (lo === hi) return [lo];
  const span = hi - lo;
  const raw = span / Math.max(1, count);
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const err = raw / pow;
  const step = (err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1) * pow;
  const start = Math.ceil(lo / step - 1e-9) * step;
  const out: number[] = [];
  for (let v = start; v <= hi + step * 1e-9; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
  return out;
}

/** Pad a [min, max] extent by a fraction and optionally snap to nice values. */
export function extent(values: readonly number[], pad = 0.05, include?: number[]): [number, number] {
  const vals = values.filter(Number.isFinite).concat(include ?? []);
  if (!vals.length) return [0, 1];
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (lo === hi) { lo -= 1; hi += 1; }
  const d = (hi - lo) * pad;
  return [lo - d, hi + d];
}

interface PlotCtx {
  sx: Scale;
  sy: Scale;
  width: number;
  height: number;
  innerW: number;
  innerH: number;
  margin: Margin;
  clipId: string;
  svgRef: React.RefObject<SVGSVGElement | null>;
  setTooltip: (t: TooltipState | null) => void;
}
interface Margin { top: number; right: number; bottom: number; left: number }
interface TooltipState { x: number; y: number; content: ReactNode }

const Ctx = createContext<PlotCtx | null>(null);
export function usePlot() {
  const c = useContext(Ctx);
  if (!c) throw new Error('usePlot must be used inside <Plot>');
  return c;
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => setW(entries[0].contentRect.width));
    ro.observe(el);
    setW(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

export interface PlotProps {
  xDomain: [number, number];
  yDomain: [number, number];
  height?: number;
  xLabel?: string;
  yLabel?: string;
  xTicks?: number[];
  yTicks?: number[];
  xFormat?: (v: number) => string;
  yFormat?: (v: number) => string;
  title?: string;
  /** Short text alternative describing what the chart shows. */
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  grid?: boolean;
  aspect?: number;
}

const defaultFmt = (v: number) => {
  const a = Math.abs(v);
  if (a !== 0 && (a < 0.01 || a >= 1e5)) return v.toExponential(0);
  const s = a >= 100 ? v.toFixed(0) : a >= 10 ? String(Math.round(v * 10) / 10) : String(Math.round(v * 100) / 100);
  return s.startsWith('-') ? `−${s.slice(1)}` : s;
};

export function Plot({ xDomain, yDomain, height = 280, xLabel, yLabel, xTicks, yTicks, xFormat = defaultFmt, yFormat = defaultFmt, title, ariaLabel, children, className, grid = true, aspect }: PlotProps) {
  const [wrapRef, width] = useWidth<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement>(null);
  const clipId = useId().replace(/:/g, '');
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const h = aspect && width ? Math.min(height, width * aspect) : height;
  const margin: Margin = { top: title ? 26 : 10, right: 14, bottom: xLabel ? 42 : 26, left: yLabel ? 54 : 40 };
  const innerW = Math.max(10, width - margin.left - margin.right);
  const innerH = Math.max(10, h - margin.top - margin.bottom);
  const sx = useMemo(() => linearScale(xDomain, [0, innerW]), [xDomain, innerW]);
  const sy = useMemo(() => linearScale(yDomain, [innerH, 0]), [yDomain, innerH]);
  const xt = xTicks ?? niceTicks(xDomain[0], xDomain[1], Math.max(2, Math.round(innerW / 80)));
  const yt = yTicks ?? niceTicks(yDomain[0], yDomain[1], Math.max(2, Math.round(innerH / 50)));
  const ctx: PlotCtx = { sx, sy, width, height: h, innerW, innerH, margin, clipId, svgRef, setTooltip };

  return (
    <div ref={wrapRef} className={cn('relative w-full select-none', className)}>
      {width > 0 && (
        <Ctx.Provider value={ctx}>
          <svg ref={svgRef} width={width} height={h} role="img" aria-label={ariaLabel} className="block touch-pan-y overflow-visible">
            {title && <text x={margin.left} y={14} className="fill-[var(--foreground)] text-[12px] font-semibold">{title}</text>}
            <defs>
              <clipPath id={clipId}>
                <rect x={0} y={0} width={innerW} height={innerH} />
              </clipPath>
            </defs>
            <g transform={`translate(${margin.left},${margin.top})`}>
              {grid && yt.map((t) => (
                <line key={`gy${t}`} x1={0} x2={innerW} y1={sy(t)} y2={sy(t)} stroke="var(--grid)" strokeWidth={1} />
              ))}
              {grid && xt.map((t) => (
                <line key={`gx${t}`} y1={0} y2={innerH} x1={sx(t)} x2={sx(t)} stroke="var(--grid)" strokeWidth={1} />
              ))}
              <line x1={0} x2={innerW} y1={innerH} y2={innerH} stroke="var(--axis)" strokeWidth={1} />
              <line x1={0} x2={0} y1={0} y2={innerH} stroke="var(--axis)" strokeWidth={1} />
              {xt.map((t) => (
                <text key={`tx${t}`} x={sx(t)} y={innerH + 16} textAnchor="middle" className="tabular fill-[var(--subtle-foreground)] text-[11px]">{xFormat(t)}</text>
              ))}
              {yt.map((t) => (
                <text key={`ty${t}`} x={-6} y={sy(t)} dy="0.32em" textAnchor="end" className="tabular fill-[var(--subtle-foreground)] text-[11px]">{yFormat(t)}</text>
              ))}
              {xLabel && <text x={innerW / 2} y={innerH + 36} textAnchor="middle" className="fill-[var(--muted-foreground)] text-[12px]">{xLabel}</text>}
              {yLabel && (
                <text transform={`translate(${-margin.left + 14},${innerH / 2}) rotate(-90)`} textAnchor="middle" className="fill-[var(--muted-foreground)] text-[12px]">{yLabel}</text>
              )}
              {children}
            </g>
          </svg>
          {tooltip && (
            <div
              className="pointer-events-none absolute z-20 max-w-[220px] rounded-lg border bg-card px-2.5 py-1.5 text-xs shadow-lg"
              style={{
                left: Math.min(Math.max(tooltip.x + margin.left + 12, 0), width - 160),
                top: Math.max(tooltip.y + margin.top - 12, 0),
              }}
            >
              {tooltip.content}
            </div>
          )}
        </Ctx.Provider>
      )}
      {width === 0 && <div style={{ height: h }} />}
    </div>
  );
}

export interface Pt {
  x: number;
  y: number;
  r?: number;
  color?: string;
  opacity?: number;
  key?: string | number;
}

export function Dots({ points, color = 'var(--series-1)', r = 4, opacity = 0.85, ring }: { points: readonly Pt[]; color?: string; r?: number; opacity?: number; ring?: boolean }) {
  const { sx, sy, clipId } = usePlot();
  // A surface ring separates sparse markers from lines; on dense scatters it would erase neighbouring points.
  ring = ring ?? points.length <= 40;
  return (
    <g clipPath={`url(#${clipId})`}>
      {points.map((p, i) =>
        Number.isFinite(p.x) && Number.isFinite(p.y) ? (
          <circle
            key={p.key ?? i}
            cx={sx(p.x)}
            cy={sy(p.y)}
            r={p.r ?? r}
            fill={p.color ?? color}
            fillOpacity={p.opacity ?? opacity}
            stroke={ring ? 'var(--card)' : 'none'}
            strokeWidth={ring ? 1.5 : 0}
          />
        ) : null,
      )}
    </g>
  );
}

export function Line({ points, color = 'var(--series-1)', width = 2, dash, opacity = 1, clip = true }: { points: readonly { x: number; y: number }[]; color?: string; width?: number; dash?: string; opacity?: number; clip?: boolean }) {
  const { sx, sy, clipId } = usePlot();
  const d = points
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
    .map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(2)},${sy(p.y).toFixed(2)}`)
    .join('');
  if (!d) return null;
  return <path d={d} fill="none" stroke={color} strokeWidth={width} strokeDasharray={dash} strokeLinejoin="round" strokeLinecap="round" opacity={opacity} clipPath={clip ? `url(#${clipId})` : undefined} />;
}

/** Function curve sampled across the x domain. */
export function Curve({ f, color, width = 2, dash, samples = 120, from, to }: { f: (x: number) => number; color?: string; width?: number; dash?: string; samples?: number; from?: number; to?: number }) {
  const { sx } = usePlot();
  const a = from ?? sx.domain[0], b = to ?? sx.domain[1];
  const pts = Array.from({ length: samples + 1 }, (_, i) => {
    const x = a + ((b - a) * i) / samples;
    return { x, y: f(x) };
  });
  return <Line points={pts} color={color} width={width} dash={dash} />;
}

export function Band({ points, color = 'var(--series-1)', opacity = 0.12 }: { points: readonly { x: number; lo: number; hi: number }[]; color?: string; opacity?: number }) {
  const { sx, sy, clipId } = usePlot();
  const valid = points.filter((p) => Number.isFinite(p.lo) && Number.isFinite(p.hi));
  if (!valid.length) return null;
  const top = valid.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x)},${sy(p.hi)}`).join('');
  const bottom = [...valid].reverse().map((p) => `L${sx(p.x)},${sy(p.lo)}`).join('');
  return <path d={`${top}${bottom}Z`} fill={color} fillOpacity={opacity} clipPath={`url(#${clipId})`} />;
}

export function HRule({ y, color = 'var(--axis)', dash = '4 4', label, width = 1 }: { y: number; color?: string; dash?: string; label?: string; width?: number }) {
  const { sy, innerW } = usePlot();
  if (!Number.isFinite(y)) return null;
  const py = sy(y);
  return (
    <g>
      <line x1={0} x2={innerW} y1={py} y2={py} stroke={color} strokeDasharray={dash} strokeWidth={width} />
      {label && <text x={innerW - 4} y={py - 4} textAnchor="end" className="fill-[var(--muted-foreground)] text-[10.5px]">{label}</text>}
    </g>
  );
}

export function VRule({ x, color = 'var(--axis)', dash = '4 4', label, width = 1, labelPos = 'top' }: { x: number; color?: string; dash?: string; label?: string; width?: number; labelPos?: 'top' | 'bottom' }) {
  const { sx, innerH } = usePlot();
  if (!Number.isFinite(x)) return null;
  const px = sx(x);
  return (
    <g>
      <line x1={px} x2={px} y1={0} y2={innerH} stroke={color} strokeDasharray={dash} strokeWidth={width} />
      {label && <text x={px + 4} y={labelPos === 'top' ? 10 : innerH - 6} className="fill-[var(--muted-foreground)] text-[10.5px]">{label}</text>}
    </g>
  );
}

/** Histogram bars with a 2px surface gap and rounded data-ends. */
export function Bars({ bins, color = 'var(--series-1)', opacity = 0.85, valueKey = 'count' }: { bins: readonly { x0: number; x1: number; count: number; density?: number }[]; color?: string; opacity?: number; valueKey?: 'count' | 'density' }) {
  const { sx, sy, clipId } = usePlot();
  return (
    <g clipPath={`url(#${clipId})`}>
      {bins.map((b, i) => {
        const v = valueKey === 'density' ? b.density ?? 0 : b.count;
        const x = sx(b.x0) + 1;
        const w = Math.max(0.5, sx(b.x1) - sx(b.x0) - 2);
        const y = sy(v);
        const h = Math.max(0, sy(0) - y);
        if (h <= 0) return null;
        const rr = Math.min(3, w / 2, h);
        return (
          <path
            key={i}
            d={`M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`}
            fill={color}
            fillOpacity={opacity}
          />
        );
      })}
    </g>
  );
}

export function SvgText({ x, y, children, anchor = 'start', className, dx = 0, dy = 0 }: { x: number; y: number; children: ReactNode; anchor?: 'start' | 'middle' | 'end'; className?: string; dx?: number; dy?: number }) {
  const { sx, sy } = usePlot();
  return (
    <text x={sx(x) + dx} y={sy(y) + dy} textAnchor={anchor} className={cn('fill-[var(--foreground)] text-[11px]', className)}>
      {children}
    </text>
  );
}

/** Nearest-point hover/tap tooltip layer. Place last inside <Plot>. */
export function HoverLayer<T extends { x: number; y: number }>({ points, render, radius = 28 }: { points: readonly T[]; render: (p: T) => ReactNode; radius?: number }) {
  const { sx, sy, innerW, innerH, setTooltip } = usePlot();
  const [active, setActive] = useState<number | null>(null);
  const onMove = useCallback(
    (e: RPointerEvent<SVGRectElement>) => {
      const rect = (e.currentTarget as SVGRectElement).getBoundingClientRect();
      const px = e.clientX - rect.left, py = e.clientY - rect.top;
      let best = -1, bestD = radius * radius;
      for (let i = 0; i < points.length; i++) {
        const dx = sx(points[i].x) - px, dy = sy(points[i].y) - py;
        const d = dx * dx + dy * dy;
        if (d < bestD) { bestD = d; best = i; }
      }
      if (best >= 0) {
        setActive(best);
        setTooltip({ x: sx(points[best].x), y: sy(points[best].y), content: render(points[best]) });
      } else {
        setActive(null);
        setTooltip(null);
      }
    },
    [points, sx, sy, radius, render, setTooltip],
  );
  const p = active !== null ? points[active] : null;
  return (
    <g>
      {p && <circle cx={sx(p.x)} cy={sy(p.y)} r={7} fill="none" stroke="var(--foreground)" strokeWidth={1.5} />}
      <rect
        x={0}
        y={0}
        width={innerW}
        height={innerH}
        fill="transparent"
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => { setActive(null); setTooltip(null); }}
      />
    </g>
  );
}

/** A draggable handle in data coordinates (mouse, touch and keyboard arrows). */
export function DragHandle({ x, y, onChange, color = 'var(--series-2)', label = 'Draggable point', clampX, clampY }: { x: number; y: number; onChange: (x: number, y: number) => void; color?: string; label?: string; clampX?: [number, number]; clampY?: [number, number] }) {
  const { sx, sy, svgRef, margin } = usePlot();
  const dragging = useRef(false);
  const clamp = (v: number, c?: [number, number]) => (c ? Math.min(c[1], Math.max(c[0], v)) : v);
  const toData = (e: RPointerEvent<SVGGElement>) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const px = e.clientX - rect.left - margin.left, py = e.clientY - rect.top - margin.top;
    onChange(clamp(sx.invert(px), clampX), clamp(sy.invert(py), clampY));
  };
  const stepX = (sx.domain[1] - sx.domain[0]) / 50, stepY = (sy.domain[1] - sy.domain[0]) / 50;
  return (
    <g
      role="slider"
      tabIndex={0}
      aria-label={`${label}. Use arrow keys to move.`}
      aria-valuetext={`x ${x.toFixed(1)}, y ${y.toFixed(1)}`}
      className="cursor-grab touch-none outline-none active:cursor-grabbing [&:focus-visible_circle.ring]:stroke-[var(--ring)]"
      onPointerDown={(e) => { dragging.current = true; (e.currentTarget as Element).setPointerCapture(e.pointerId); toData(e); }}
      onPointerMove={(e) => { if (dragging.current) toData(e); }}
      onPointerUp={() => { dragging.current = false; }}
      onPointerCancel={() => { dragging.current = false; }}
      onKeyDown={(e) => {
        const k = e.key;
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(k)) return;
        e.preventDefault();
        const nx = k === 'ArrowLeft' ? x - stepX : k === 'ArrowRight' ? x + stepX : x;
        const ny = k === 'ArrowDown' ? y - stepY : k === 'ArrowUp' ? y + stepY : y;
        onChange(clamp(nx, clampX), clamp(ny, clampY));
      }}
    >
      <circle cx={sx(x)} cy={sy(y)} r={22} fill="transparent" />
      <circle className="ring" cx={sx(x)} cy={sy(y)} r={10} fill="none" stroke={color} strokeWidth={2} strokeOpacity={0.5} />
      <circle cx={sx(x)} cy={sy(y)} r={6.5} fill={color} stroke="var(--card)" strokeWidth={2} />
    </g>
  );
}
