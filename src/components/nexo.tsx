"use client";

import { ChevronDown, Database, FlaskConical, Info, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { Origin } from "@/lib/types";
import { CONFIDENCE_LABEL, type Confidence, type Dimension } from "@/lib/scoring/common";
import { cn, fmtDate } from "@/lib/utils";
import { Badge, Progress } from "./ui";

/* ------------------------------------------------------------- Logo */
export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-baseline gap-2 select-none", className)}>
      <span className="font-display text-[22px] font-semibold leading-none tracking-[.22em]">
        NE<span className="text-pink">X</span>O
      </span>
      {!compact && <span className="text-[9px] font-medium uppercase leading-none tracking-[.24em] opacity-60">Career Intelligence</span>}
    </div>
  );
}

/* ------------------------------------------------------- Page header */
export function PageHeader({ index, title, description, actions }: { index: string; title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <div className="mb-2 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[.2em] text-ink-mute">
          <span className="text-pink">{index}</span>
          <span className="h-px w-8 bg-ink-mute/40" />
          <span>NEXO</span>
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-green md:text-[28px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

/* ------------------------------------------------------ Origin badge */
const ORIGIN: Record<Origin, { label: string; tone: "pink" | "amber" | "green" | "neutral"; icon: ReactNode; title: string }> = {
  demo: { label: "DEMO", tone: "pink", icon: <FlaskConical className="h-3 w-3" />, title: "Dado fictício para demonstração. Não representa pessoa, empresa, vaga ou métrica real." },
  nexo: { label: "Referência NEXO", tone: "amber", icon: <Sparkles className="h-3 w-3" />, title: "Referência curada pelo NEXO. Detalhes como custo e carga horária não foram verificados." },
  user: { label: "Seu dado", tone: "green", icon: <UserRound className="h-3 w-3" />, title: "Informado por você." },
  import: { label: "Importado", tone: "neutral", icon: <Database className="h-3 w-3" />, title: "Importado de arquivo e revisado." },
  api: { label: "API", tone: "green", icon: <ShieldCheck className="h-3 w-3" />, title: "Obtido por integração autorizada." },
};
export function OriginBadge({ origin, className }: { origin: Origin; className?: string }) {
  const o = ORIGIN[origin];
  return <Badge tone={o.tone} className={className} title={o.title}>{o.icon}{o.label}</Badge>;
}

export function ConfidenceBadge({ confidence, coverage }: { confidence: Confidence; coverage?: number }) {
  const tone = confidence === "alta" ? "green" : confidence === "media" ? "outline" : confidence === "baixa" ? "amber" : "pink";
  return (
    <Badge tone={tone} title={coverage !== undefined ? `Cobertura dos critérios: ${Math.round(coverage * 100)}%` : undefined}>
      {CONFIDENCE_LABEL[confidence]}{coverage !== undefined && ` · ${Math.round(coverage * 100)}%`}
    </Badge>
  );
}

/* --------------------------------------------- Swatch score (editorial) */
export function SwatchScore({ index, label, value, suffix, code, tone = "green", note, badge }: {
  index: string; label: string; value: ReactNode; suffix?: string; code: ReactNode; tone?: "green" | "pink" | "paper"; note?: ReactNode; badge?: ReactNode;
}) {
  const tones = { green: "bg-green text-paper border-green-700", pink: "bg-pink text-white border-pink-600", paper: "bg-paper-card text-green border-paper-line" };
  return (
    <div className={cn("animate-rise relative flex min-h-[176px] flex-col justify-between rounded-2xl border p-5", tones[tone])}>
      <div className="flex items-start justify-between">
        <span className="text-[11px] tracking-[.18em] opacity-70">{index}</span>
        {badge}
      </div>
      <div className="absolute right-5 top-12 h-8 w-px bg-current opacity-40" />
      <div>
        <div className="font-display text-[40px] font-semibold leading-none tracking-tight">
          {value}{suffix && <span className="ml-1 text-base font-medium opacity-70">{suffix}</span>}
        </div>
        <div className="mt-2 font-display text-sm font-semibold uppercase tracking-[.08em]">{label}</div>
        <div className="mt-0.5 text-[11px] opacity-70">{code}</div>
        {note && <div className="mt-2 text-[11px] leading-snug opacity-80">{note}</div>}
      </div>
    </div>
  );
}

/* --------------------------------------------------------- Score ring */
export function ScoreRing({ value, max = 100, size = 112, label, tone = "pink", track = "rgba(8,47,37,.1)" }: { value: number | null; max?: number; size?: number; label?: ReactNode; tone?: "pink" | "green"; track?: string }) {
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const pct = value === null ? 0 : Math.min(1, value / max);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={6} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={tone === "pink" ? "#F32F73" : "#145B46"} strokeWidth={6} fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: "stroke-dashoffset .8s ease" }} />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-2xl font-semibold leading-none">{value === null ? "—" : Math.round(value)}</div>
        {label && <div className="mt-1 text-[10px] uppercase tracking-wider opacity-60">{label}</div>}
      </div>
    </div>
  );
}

/* --------------------------------------------------- Dimension bars */
export function DimensionBars({ dims, showReasons = true }: { dims: Dimension[]; showReasons?: boolean }) {
  return (
    <div className="space-y-3">
      {dims.map((d) => (
        <div key={d.key}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
            <span className="font-medium text-ink">{d.label} <span className="font-normal text-ink-mute">· peso {d.weight}%</span></span>
            <span className="font-display font-semibold text-green">{d.score === null ? <span className="font-sans text-[11px] font-normal text-ink-mute">sem dados — excluído</span> : `${d.score}`}</span>
          </div>
          <Progress value={d.score} tone={d.score !== null && d.score >= 70 ? "green" : "pink"} />
          {showReasons && (d.reasons.length > 0 || d.gaps.length > 0) && (
            <ul className="mt-1.5 space-y-0.5 text-[11px] leading-snug">
              {d.reasons.map((r, i) => <li key={"r" + i} className="text-green-600">+ {r}</li>)}
              {d.gaps.map((r, i) => <li key={"g" + i} className="text-ink-mute">– {r}</li>)}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------- Method note */
export function MethodNote({ title = "Metodologia e fontes", children, defaultOpen = false }: { title?: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-paper-line bg-paper/60">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-xs font-medium text-ink-soft">
        <span className="flex items-center gap-2"><Info className="h-3.5 w-3.5 text-green-500" />{title}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition", open && "rotate-180")} />
      </button>
      {open && <div className="space-y-2 border-t border-paper-line px-4 py-3 text-xs leading-relaxed text-ink-soft">{children}</div>}
    </div>
  );
}

/* --------------------------------------------------------- Stat tile */
export function Stat({ label, value, sub, delta, demo, definition }: { label: string; value: ReactNode; sub?: ReactNode; delta?: number | null; demo?: boolean; definition?: string }) {
  return (
    <div className="rounded-xl border border-paper-line bg-white/70 p-4" title={definition}>
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <span className="min-w-0 text-[11px] font-medium uppercase tracking-[.1em] text-ink-mute">{label}</span>
        {demo && <OriginBadge origin="demo" />}
      </div>
      <div className="mt-2 font-display text-2xl font-semibold text-green">{value}</div>
      <div className="mt-1 flex items-center gap-2 text-[11px] text-ink-mute">
        {delta !== undefined && (delta === null
          ? <span title="Sem base de comparação válida (ausente ou zero)">sem base</span>
          : <span className={delta >= 0 ? "font-medium text-green-600" : "font-medium text-pink-700"}>{delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%</span>)}
        {sub}
      </div>
    </div>
  );
}

export function SourceLine({ source, date, url }: { source: string; date?: string | null; url?: string }) {
  return (
    <div className="text-[11px] text-ink-mute">
      Fonte: {url ? <a href={url} target="_blank" rel="noreferrer" className="underline decoration-dotted hover:text-green">{source}</a> : source}
      {" · "}{date ? `verificado em ${fmtDate(date)}` : "não verificado"}
    </div>
  );
}

export function Fact({ kind, children }: { kind: "fato" | "inferencia" | "estimativa" | "recomendacao" | "hipotese"; children: ReactNode }) {
  const m = {
    fato: ["Fato registrado", "green"], inferencia: ["Inferência", "outline"], estimativa: ["Estimativa", "amber"], recomendacao: ["Recomendação", "solidPink"], hipotese: ["Hipótese", "pink"],
  } as const;
  return <div className="flex items-start gap-2"><Badge tone={m[kind][1]} className="mt-0.5 shrink-0">{m[kind][0]}</Badge><div className="text-sm">{children}</div></div>;
}
