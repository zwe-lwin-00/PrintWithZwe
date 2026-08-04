import { useReducedMotion } from "framer-motion";
import { useMemo, useState, useEffect, useRef, type ReactNode } from "react";
import { useSiteConfig } from "@/context/ConfigProvider";
import { cn } from "@/lib/utils";

const LAYER_COUNT = 16;
const LAYER_MS = 380;
const PAUSE_MS = 2400;
const VIEW_W = 380;
const VIEW_H = 340;

/** Fixed layout — printer must never resize between animation states */
const CARD_W = 400;
const CARD_PAD = 20; // p-5
const INNER_W = CARD_W - CARD_PAD * 2; // 360px content area inside border
const SCENE_H = Math.round(INNER_W * (VIEW_H / VIEW_W)); // 322px
const HUD_H = 56;
const FOOTER_H = 20;
const CARD_INNER_H = HUD_H + 12 + SCENE_H + 8 + FOOTER_H;

/** SVG viewBox regions — single source of truth for HTML overlay alignment */
const CHAMBER = {
  x: 92,
  y: 92,
  w: 196,
  h: 112,
} as const;

const CHAMBER_COMPACT = {
  x: 92,
  y: 52,
  w: 196,
  h: 88,
} as const;

const BED_Y = 188;
const BED_Y_COMPACT = 122;

function pctX(n: number) {
  return `${(n / VIEW_W) * 100}%`;
}

function pctY(n: number) {
  return `${(n / VIEW_H) * 100}%`;
}

function chamberBox(compact?: boolean) {
  return compact ? CHAMBER_COMPACT : CHAMBER;
}

const CYAN = "#22d3ee";
const CYAN_DIM = "#0891b2";

function nozzleSceneY(layer: number, compact: boolean) {
  const box = chamberBox(compact);
  const bedY = compact ? BED_Y_COMPACT : BED_Y;
  const printTop = box.y + 14;
  const printBottom = bedY - 10;
  const t = layer / LAYER_COUNT;
  return printTop + (printBottom - printTop) * t;
}

function nozzleSceneX(percent: number, compact: boolean) {
  const box = chamberBox(compact);
  return box.x + (percent / 100) * box.w;
}

interface PrintAnimationProps {
  className?: string;
  compact?: boolean;
}

interface PrintState {
  layer: number;
  isComplete: boolean;
}

function splitBrandTitle(name: string): { lead: string; accent: string } {
  const words = name.trim().split(/\s+/);
  if (words.length <= 1) return { lead: "", accent: words[0] ?? name };
  const accent = words.pop() ?? "";
  return { lead: words.join(" "), accent };
}

function usePrintSimulation(enabled: boolean): PrintState {
  const [state, setState] = useState<PrintState>({
    layer: 0,
    isComplete: false,
  });

  useEffect(() => {
    if (!enabled) {
      setState({ layer: LAYER_COUNT, isComplete: true });
      return;
    }

    let layer = 0;
    let layerTimer: ReturnType<typeof window.setTimeout>;
    let pauseTimer: ReturnType<typeof window.setTimeout>;

    const scheduleLayer = () => {
      layerTimer = window.setTimeout(() => {
        layer += 1;
        if (layer > LAYER_COUNT) {
          setState({ isComplete: true, layer: LAYER_COUNT });
          pauseTimer = window.setTimeout(() => {
            // Restart at layer 1 — skip empty layer 0 to avoid layout jump
            layer = 1;
            setState({ layer: 1, isComplete: false });
            scheduleLayer();
          }, PAUSE_MS);
          return;
        }
        setState({ layer, isComplete: false });
        scheduleLayer();
      }, LAYER_MS);
    };

    scheduleLayer();

    return () => {
      window.clearTimeout(layerTimer);
      window.clearTimeout(pauseTimer);
    };
  }, [enabled]);

  return state;
}

export function PrintAnimation({ className, compact = false }: PrintAnimationProps) {
  const { config } = useSiteConfig();
  const prefersReducedMotion = useReducedMotion();
  const { lead, accent } = useMemo(
    () => splitBrandTitle(config.brand.name),
    [config.brand.name],
  );

  const { layer, isComplete } = usePrintSimulation(!prefersReducedMotion);

  const printProgress = prefersReducedMotion
    ? 100
    : Math.round((layer / LAYER_COUNT) * 100);

  const visibleLayers = prefersReducedMotion ? LAYER_COUNT : layer;
  const isPrinting = layer > 0 && !isComplete;
  const stackLayerCount = Math.min(Math.max(layer, 1), 8);
  const elapsed = Math.round((layer * LAYER_MS) / 1000);
  const nozzleLayer = Math.max(layer, 1);
  const nozzleVisible = layer > 0 || isComplete;
  const displayProgress = isComplete ? 100 : printProgress;

  const box = chamberBox(compact);
  const bedY = compact ? BED_Y_COMPACT : BED_Y;

  return (
    <PrintFrame compact={compact} className={className}>
      <div
        className={cn("relative mx-auto w-full max-w-full", compact && "max-w-[280px]")}
        style={compact ? undefined : { height: CARD_INNER_H }}
      >
        {/* HUD — fixed height, stays inside padded area */}
        {!compact && (
          <div
            className="mb-3 flex shrink-0 items-start justify-between gap-1.5"
            style={{ height: HUD_H }}
          >
            <HudPanel className="min-w-0 flex-1">
              <p className="text-[0.55rem] font-semibold uppercase tracking-widest text-muted-foreground">
                Layer
              </p>
              <p className="text-sm font-bold tabular-nums leading-none text-foreground">
                {String(Math.min(layer, LAYER_COUNT)).padStart(2, "0")}
                <span className="text-muted-foreground"> / {LAYER_COUNT}</span>
              </p>
              <div className="mt-1.5 h-1 w-full max-w-[4.5rem] overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-primary"
                  style={{ width: `${printProgress}%` }}
                />
              </div>
            </HudPanel>

            <HudPanel className="min-w-0 flex-1 text-right">
              <div className="flex items-center justify-end gap-1">
                <span
                  className={cn(
                    "h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400",
                    isPrinting && "animate-pulse",
                  )}
                />
                <p className="truncate text-[0.55rem] font-semibold uppercase tracking-wider text-emerald-500/90">
                  {isComplete ? "Complete" : isPrinting ? "Printing" : "Ready"}
                </p>
              </div>
              <p className="mt-0.5 truncate text-[0.6rem] tabular-nums leading-tight text-foreground">
                220°C · 120mm/s
              </p>
              <p className="text-[0.6rem] tabular-nums leading-tight text-muted-foreground">
                {String(Math.floor(elapsed / 60)).padStart(2, "0")}:
                {String(elapsed % 60).padStart(2, "0")}
              </p>
            </HudPanel>
          </div>
        )}

        {/* Scene — exact pixel size, never flexes */}
        <div
          className={cn(
            "relative shrink-0 overflow-hidden",
            compact && "aspect-[380/340] w-full",
          )}
          style={compact ? undefined : { height: SCENE_H, width: "100%" }}
        >
          <BambuP2SComboScene
            compact={compact}
            visibleLayers={visibleLayers}
            printProgress={displayProgress}
            isPrinting={isPrinting}
            isComplete={isComplete}
            className="block h-full w-full"
          />

          {/* Brand text — locked to chamber bounds */}
          <div
            className="absolute z-10 overflow-hidden"
            style={{
              left: pctX(box.x),
              top: pctY(box.y),
              width: pctX(box.w),
              height: pctY(box.h),
            }}
          >
            <ChamberBrandPrint
              lead={lead}
              accent={accent}
              compact={compact}
              printProgress={displayProgress}
              isPrinting={isPrinting}
            />
          </div>

          {/* Layer stack — always 8 slots */}
          <div
            className="pointer-events-none absolute z-[6] flex justify-center"
            style={{
              left: pctX(box.x + 16),
              top: pctY(bedY - 6),
              width: pctX(box.w - 32),
            }}
          >
            <div className="relative h-6 w-full">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 mx-auto h-[2px] rounded-full bg-cyan-400/70"
                  style={{
                    bottom: `${i * 2}px`,
                    width: `${92 - i * 3}%`,
                    opacity: i < stackLayerCount ? 0.35 + i * 0.05 : 0,
                    boxShadow: i < stackLayerCount ? `0 0 6px ${CYAN}40` : undefined,
                  }}
                />
              ))}
            </div>
          </div>

          <NozzleTracker
            layer={nozzleLayer}
            compact={compact}
            paused={isComplete}
            visible={nozzleVisible}
          />
        </div>

        {/* Status footer */}
        {!compact && (
          <div
            className="mt-2 grid shrink-0 grid-cols-2 gap-1"
            style={{ height: FOOTER_H }}
          >
            <p className="min-w-0 truncate text-[0.55rem] font-semibold uppercase tracking-wider text-muted-foreground">
              P2S Combo · AMS 2 Pro
            </p>
            <p className="min-w-0 truncate text-right text-[0.55rem] font-medium uppercase leading-none tracking-wider text-muted-foreground">
              {isComplete ? "Complete" : "Printing"}
            </p>
          </div>
        )}
      </div>
    </PrintFrame>
  );
}

function HudPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-lg border border-border/70 bg-card/85 px-1.5 py-1.5 shadow-sm backdrop-blur-md",
        className,
      )}
    >
      {children}
    </div>
  );
}

function ChamberBrandPrint({
  lead,
  accent,
  compact,
  printProgress,
  isPrinting,
}: {
  lead: string;
  accent: string;
  compact?: boolean;
  printProgress: number;
  isPrinting: boolean;
}) {
  return (
    <div className="flex h-full w-full items-center justify-center px-2">
      <div className="relative w-full text-center leading-tight">
        {/* Ghost outline — same box as printed text */}
        <div className="pointer-events-none select-none opacity-[0.1]">
          <BrandTextBlock lead={lead} accent={accent} compact={compact} />
        </div>

        {/* Layer reveal — CSS clip, no Framer layout */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-x-0 bottom-0"
            style={{
              clipPath: `inset(${100 - printProgress}% 0 0 0)`,
            }}
          >
            <BrandTextBlock
              lead={lead}
              accent={accent}
              compact={compact}
              colored
              glowing={isPrinting}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function BrandTextBlock({
  lead,
  accent,
  compact,
  colored = false,
  glowing = false,
}: {
  lead: string;
  accent: string;
  compact?: boolean;
  colored?: boolean;
  glowing?: boolean;
}) {
  return (
    <div className={cn(glowing && colored && "opacity-100")}>
      {lead && (
        <p
          className={cn(
            "font-semibold tracking-tight",
            compact ? "text-[0.6rem]" : "text-[0.7rem] sm:text-xs",
            colored
              ? "bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent"
              : "text-foreground",
          )}
        >
          {lead}
        </p>
      )}
      <p
        className={cn(
          "font-extrabold tracking-tight",
          compact ? "text-sm" : "text-base sm:text-lg",
          colored
            ? "bg-gradient-to-r from-primary via-cyan-400 to-primary bg-clip-text text-transparent"
            : "text-foreground",
        )}
      >
        {accent}
      </p>
    </div>
  );
}

function BambuP2SComboScene({
  compact,
  visibleLayers,
  printProgress,
  isPrinting,
  isComplete,
  className,
}: {
  compact?: boolean;
  visibleLayers: number;
  printProgress: number;
  isPrinting: boolean;
  isComplete: boolean;
  className?: string;
}) {
  const bodyDark = "#181a1d";
  const trim = "#3a3f45";
  const glass = "rgba(34,211,238,0.06)";
  const glassStroke = "rgba(34,211,238,0.22)";
  const box = chamberBox(compact);
  const bedY = compact ? BED_Y_COMPACT : BED_Y;

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid meet"
      className={cn("h-full w-full", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="p2sBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2e3238" />
          <stop offset="100%" stopColor={bodyDark} />
        </linearGradient>
        <linearGradient id="amsBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a4048" />
          <stop offset="100%" stopColor="#282c32" />
        </linearGradient>
        <linearGradient id="bedPei" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={CYAN} stopOpacity="0.22" />
          <stop offset="100%" stopColor={CYAN_DIM} stopOpacity="0.06" />
        </linearGradient>
        <linearGradient id="screenUi" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
        <pattern id="peiTexture" width="8" height="8" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.6" fill={CYAN} fillOpacity="0.12" />
          <circle cx="6" cy="6" r="0.6" fill={CYAN} fillOpacity="0.08" />
        </pattern>
        <clipPath id="chamberClip">
          <rect x={CHAMBER.x} y={CHAMBER.y} width={CHAMBER.w} height={CHAMBER.h} rx="4" />
        </clipPath>
      </defs>

      {/* AMS 2 Pro — stacked on top */}
      {!compact && (
        <g>
          <rect x="72" y="10" width="236" height="58" rx="8" fill="url(#amsBody)" stroke={trim} strokeWidth="1" />
          <rect x="78" y="16" width="224" height="46" rx="6" fill={bodyDark} fillOpacity="0.55" />

          {/* Vent grille */}
          {[0, 1, 2, 3, 4].map((i) => (
            <rect
              key={i}
              x={88 + i * 8}
              y="22"
              width="4"
              height="10"
              rx="1"
              fill="#475569"
              fillOpacity="0.5"
            />
          ))}

          {/* Four filament slots */}
          {[0, 1, 2, 3].map((i) => {
            const cx = 118 + i * 48;
            const colors = ["#22d3ee", "#f472b6", "#fbbf24", "#a78bfa"];
            return (
              <g key={i}>
                <circle cx={cx} cy="42" r="13" fill="#1a1d21" stroke={trim} strokeWidth="1" />
                <circle
                  cx={cx}
                  cy="42"
                  r="8"
                  fill={colors[i]}
                  fillOpacity={isPrinting ? 0.85 : 0.55}
                />
                <circle cx={cx} cy="42" r="3" fill="#0f172a" fillOpacity="0.6" />
                {/* PTFE tube to printer */}
                <path
                  d={`M ${cx} 55 Q ${cx} 72 190 78`}
                  fill="none"
                  stroke={colors[i]}
                  strokeWidth="1.5"
                  strokeOpacity={isPrinting ? 0.45 : 0.2}
                />
              </g>
            );
          })}

          <text x="190" y="28" textAnchor="middle" fill="#94a3b8" fontSize="7" fontWeight="600" letterSpacing="0.08em">
            AMS 2 PRO
          </text>
        </g>
      )}

      {/* Compact AMS hint */}
      {compact && (
        <g>
          <rect x="100" y="8" width="180" height="28" rx="5" fill="url(#amsBody)" stroke={trim} strokeWidth="0.8" />
          {[0, 1, 2, 3].map((i) => (
            <circle key={i} cx={130 + i * 40} cy="22" r="5" fill={["#22d3ee", "#f472b6", "#fbbf24", "#a78bfa"][i]} fillOpacity="0.7" />
          ))}
        </g>
      )}

      {/* P2S main body */}
      <rect x="68" y={compact ? 40 : 68} width="244" height={compact ? 200 : 232} rx="10" fill="url(#p2sBody)" stroke={trim} strokeWidth="1.2" />

      {/* Lift handles */}
      {!compact && (
        <>
          <rect x="62" y="148" width="8" height="36" rx="3" fill={trim} fillOpacity="0.7" />
          <rect x="310" y="148" width="8" height="36" rx="3" fill={trim} fillOpacity="0.7" />
        </>
      )}

      {/* Side spool holder */}
      {!compact && (
        <g>
          <path d="M 312 128 L 338 118 L 338 168 L 312 158 Z" fill={trim} fillOpacity="0.55" />
          <SideSpool cx={332} cy={143} active={isPrinting} />
          <path
            d="M 320 143 Q 280 130 240 118"
            fill="none"
            stroke={CYAN}
            strokeWidth="1"
            strokeOpacity="0.3"
            strokeDasharray="3 4"
          />
        </g>
      )}

      {/* Front glass chamber */}
      <rect
        x={box.x - 4}
        y={box.y}
        width={box.w + 8}
        height={box.h}
        rx="5"
        fill={glass}
        stroke={glassStroke}
        strokeWidth="1.2"
      />
      {/* Glass shine */}
      <path
        d={`M ${box.x + 6} ${box.y + 6} L ${box.x + 26} ${box.y + 6} L ${box.x + 6} ${box.y + 36} Z`}
        fill="white"
        fillOpacity="0.04"
      />

      {/* Chamber interior */}
      <g clipPath={compact ? undefined : "url(#chamberClip)"}>
        <rect
          x={box.x + 6}
          y={compact ? box.y + 4 : CHAMBER.y + 6}
          width={box.w - 12}
          height={compact ? box.h - 8 : CHAMBER.h - 12}
          fill="#0a0c0e"
          fillOpacity="0.85"
          rx={compact ? 4 : 0}
        />

        <rect
          x={box.x + 12}
          y={compact ? box.y + 10 : CHAMBER.y + 12}
          width={box.w - 24}
          height="4"
          rx="1.5"
          fill="#475569"
          fillOpacity="0.55"
        />

        {/* Liveview camera dot */}
        {!compact && (
          <>
            <circle cx="268" cy="108" r="3" fill="#1e293b" stroke="#64748b" strokeWidth="0.8" />
            <circle cx="268" cy="108" r="1.2" fill={isPrinting ? "#22c55e" : "#64748b"}>
              {isPrinting && (
                <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />
              )}
            </circle>
          </>
        )}

        <path
          d={
            compact
              ? `M ${box.x + 20} ${bedY} L 190 ${bedY + 14} L ${box.x + box.w - 20} ${bedY} L 190 ${bedY - 10} Z`
              : `M ${box.x + 16} ${bedY} L 190 ${bedY + 20} L ${box.x + box.w - 16} ${bedY} L 190 ${bedY - 16} Z`
          }
          fill="#1e293b"
          stroke={trim}
          strokeWidth="0.8"
        />
        <path
          d={
            compact
              ? `M ${box.x + 28} ${bedY - 2} L 190 ${bedY + 10} L ${box.x + box.w - 28} ${bedY - 2} L 190 ${bedY - 8} Z`
              : `M ${box.x + 26} ${bedY - 2} L 190 ${bedY + 16} L ${box.x + box.w - 26} ${bedY - 2} L 190 ${bedY - 12} Z`
          }
          fill="url(#bedPei)"
        />
        <path
          d={
            compact
              ? `M ${box.x + 28} ${bedY - 2} L 190 ${bedY + 10} L ${box.x + box.w - 28} ${bedY - 2} L 190 ${bedY - 8} Z`
              : `M ${box.x + 26} ${bedY - 2} L 190 ${bedY + 16} L ${box.x + box.w - 26} ${bedY - 2} L 190 ${bedY - 12} Z`
          }
          fill="url(#peiTexture)"
        />

        <path
          d={
            compact
              ? `M ${box.x + 20} ${bedY} L 190 ${bedY + 14} L ${box.x + box.w - 20} ${bedY}`
              : `M ${box.x + 16} ${bedY} L 190 ${bedY + 20} L ${box.x + box.w - 16} ${bedY}`
          }
          fill="none"
          stroke={CYAN}
          strokeWidth="1.5"
          strokeOpacity={0.25 + Math.min(visibleLayers / LAYER_COUNT, 1) * 0.45}
        />
      </g>

      {/* 5-inch touchscreen */}
      <rect
        x="118"
        y={compact ? 148 : 252}
        width="144"
        height={compact ? 28 : 36}
        rx="4"
        fill="url(#screenUi)"
        stroke={trim}
        strokeWidth="1"
      />
      {/* Screen UI */}
      <rect
        x="126"
        y={compact ? 154 : 260}
        width="128"
        height={compact ? 16 : 22}
        rx="2"
        fill="#0f172a"
      />
      {!compact && (
        <>
          <text x="130" y="270" fill="#e2e8f0" fontSize="7" fontWeight="600">
            {isComplete ? "Done" : isPrinting ? "Printing" : "Ready"}
          </text>
          <rect x="130" y="274" width="118" height="3" rx="1.5" fill="#334155" />
          <rect
            x="130"
            y="274"
            width={(118 * printProgress) / 100}
            height="3"
            rx="1.5"
            fill={isComplete ? "#22c55e" : CYAN}
          />
        </>
      )}

      {/* Model badge — below printer body */}
      {!compact && (
        <text x="190" y="328" textAnchor="middle" fill="#64748b" fontSize="6.5" fontWeight="600" letterSpacing="0.12em">
          P2S COMBO
        </text>
      )}

      {/* Chamber shadow under printer */}
      <ellipse cx="190" cy={compact ? 248 : 312} rx={compact ? 88 : 108} ry="8" className="fill-black/20 dark:fill-black/40" />
    </svg>
  );
}

function SideSpool({ cx, cy, active }: { cx: number; cy: number; active: boolean }) {
  const rotRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let angle = 0;
    const spin = () => {
      angle += 0.6;
      rotRef.current?.setAttribute("transform", `rotate(${angle} ${cx} ${cy})`);
      raf = requestAnimationFrame(spin);
    };
    raf = requestAnimationFrame(spin);
    return () => cancelAnimationFrame(raf);
  }, [cx, cy, active]);

  return (
    <g>
      <circle cx={cx} cy={cy} r="14" fill="#1a1d21" stroke="#64748b" strokeWidth="0.8" />
      <g ref={rotRef}>
        {[0, 72, 144, 216, 288].map((a) => (
          <line
            key={a}
            x1={cx}
            y1={cy}
            x2={cx + 10 * Math.cos((a * Math.PI) / 180)}
            y2={cy + 10 * Math.sin((a * Math.PI) / 180)}
            stroke={CYAN}
            strokeWidth="1.2"
            strokeOpacity="0.45"
          />
        ))}
      </g>
      <circle cx={cx} cy={cy} r="3.5" fill={CYAN} fillOpacity="0.5" />
    </g>
  );
}

function NozzleTracker({
  layer,
  compact,
  paused = false,
  visible = true,
}: {
  layer: number;
  compact?: boolean;
  paused?: boolean;
  visible?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const layerRef = useRef(layer);
  const pausedRef = useRef(paused);
  layerRef.current = layer;
  pausedRef.current = paused;

  useEffect(() => {
    if (!visible) return;
    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      if (pausedRef.current) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const t = (now - start) / 1000;
      const scan = Math.sin(t * 3.2) * 0.42 + Math.sin(t * 1.7 + 1.2) * 0.18;
      const xPct = 50 + scan * 38;
      const el = ref.current;
      if (el) {
        el.style.left = pctX(nozzleSceneX(xPct, !!compact));
        el.style.top = pctY(nozzleSceneY(layerRef.current, !!compact));
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [compact, visible]);

  useEffect(() => {
    const el = ref.current;
    if (el) {
      el.style.top = pctY(nozzleSceneY(layer, !!compact));
    }
  }, [layer, compact]);

  return (
    <div
      ref={ref}
      className={cn(
        "pointer-events-none absolute z-20 h-0 w-0",
        !visible && "opacity-0",
      )}
      style={{
        left: pctX(nozzleSceneX(50, !!compact)),
        top: pctY(nozzleSceneY(layer, !!compact)),
      }}
      aria-hidden={!visible}
    >
      <NozzleVisual compact={compact} frozen={paused} />
    </div>
  );
}

function NozzleVisual({ compact, frozen }: { compact?: boolean; frozen?: boolean }) {
  return (
    <div className="relative h-8 w-8 -translate-x-1/2 -translate-y-1/2">
      {/* Fixed-size glow — same in printing and complete so size never shifts */}
      <div
        className="absolute inset-0 rounded-full bg-cyan-400/20 blur-md"
        style={{ opacity: frozen ? 0.5 : 1 }}
      />
      <div className="relative flex flex-col items-center">
        {!compact && (
          <>
            <div className="h-3 w-1 rounded-full bg-zinc-500/80" />
            <div className="h-1.5 w-5 rounded-sm bg-zinc-400/90" />
          </>
        )}
        <div className="h-2 w-3 rounded-t-sm bg-zinc-500" />
        <div
          className="h-2.5 w-2.5 rounded-full bg-primary"
          style={{ boxShadow: `0 0 10px ${CYAN}` }}
        />
        <div className="mt-0.5 h-2 w-0.5 rounded-full bg-cyan-300/80" />
      </div>
    </div>
  );
}

function PrintFrame({
  children,
  className,
  compact,
}: {
  children: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  const frameH = compact ? undefined : CARD_INNER_H + 40; // padding p-5 top+bottom

  return (
    <div className={cn("flex flex-col items-center", className)} aria-hidden>
      <div
        className={cn(
          "relative isolate overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-b from-card/95 to-background/70 shadow-elevated backdrop-blur-md",
          compact ? "w-full p-3" : "w-[400px] p-5",
        )}
        style={compact ? undefined : { height: frameH }}
      >
        {!compact && (
          <>
            <CornerBracket className="left-2 top-2 border-l border-t" />
            <CornerBracket className="right-2 top-2 border-r border-t" />
            <CornerBracket className="bottom-2 left-2 border-b border-l" />
            <CornerBracket className="bottom-2 right-2 border-b border-r" />
          </>
        )}

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(34,211,238,0.14),transparent_60%)]" />

        {children}
      </div>
    </div>
  );
}

function CornerBracket({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute h-4 w-4 border-primary/40",
        className,
      )}
    />
  );
}
