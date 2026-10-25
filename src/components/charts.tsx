"use client";

/**
 * Gráficos NEXO (Recharts). Paleta categórica validada (CVD/contraste):
 * verde, rosa, azul, âmbar — sempre nesta ordem. Série única usa o verde estrutural.
 */
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { fmtNum } from "@/lib/utils";

export const SERIES = ["#1C8462", "#F32F73", "#3A6FD8", "#C98A1B"];
export const SINGLE = "#145B46";

const axis = { stroke: "#7A7A72", fontSize: 11, tickLine: false, axisLine: false } as const;

function Tip({ active, payload, label, unit }: { active?: boolean; payload?: { name: string; value: number | null; color: string }[]; label?: string; unit?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-paper-line bg-white px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 font-medium text-ink">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-ink-soft">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span>{p.name}</span>
          <span className="ml-auto pl-3 font-medium text-ink">{p.value === null || p.value === undefined ? "—" : fmtNum(p.value, 1)}{unit}</span>
        </div>
      ))}
    </div>
  );
}

export interface SeriesDef { key: string; name: string }

export function TrendChart({ data, x, series, height = 220, target, targetLabel, unit, yDomain }: {
  data: Record<string, unknown>[]; x: string; series: SeriesDef[]; height?: number; target?: number | null; targetLabel?: string; unit?: string; yDomain?: [number | "auto", number | "auto"];
}) {
  const single = series.length === 1;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: -18 }}>
        <CartesianGrid stroke="#E7E3DD" vertical={false} />
        <XAxis dataKey={x} {...axis} />
        <YAxis {...axis} domain={yDomain ?? ["auto", "auto"]} />
        <Tooltip content={<Tip unit={unit} />} cursor={{ stroke: "#145B46", strokeOpacity: 0.25 }} />
        {!single && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#4A4B46" }} />}
        {target !== undefined && target !== null && (
          <ReferenceLine y={target} stroke="#F32F73" strokeDasharray="4 4" label={{ value: targetLabel ?? `Meta ${target}`, position: "insideTopRight", fill: "#C81E5B", fontSize: 10 }} />
        )}
        {series.map((s, i) => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={single ? SINGLE : SERIES[i % SERIES.length]} strokeWidth={2}
            dot={{ r: 3, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 5 }} connectNulls animationDuration={600} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function BarsChart({ data, x, series, height = 220, unit, layout = "horizontal" }: {
  data: Record<string, unknown>[]; x: string; series: SeriesDef[]; height?: number; unit?: string; layout?: "horizontal" | "vertical";
}) {
  const single = series.length === 1;
  const vertical = layout === "vertical";
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={layout} margin={{ top: 10, right: 12, bottom: 0, left: vertical ? 8 : -18 }} barGap={2}>
        <CartesianGrid stroke="#E7E3DD" vertical={vertical} horizontal={!vertical} />
        {vertical ? (<><XAxis type="number" {...axis} /><YAxis type="category" dataKey={x} {...axis} width={120} /></>) : (<><XAxis dataKey={x} {...axis} /><YAxis {...axis} /></>)}
        <Tooltip content={<Tip unit={unit} />} cursor={{ fill: "rgba(20,91,70,.06)" }} />
        {!single && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />}
        {series.map((s, i) => (
          <Bar key={s.key} dataKey={s.key} name={s.name} fill={single ? SINGLE : SERIES[i % SERIES.length]} radius={vertical ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={28} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
