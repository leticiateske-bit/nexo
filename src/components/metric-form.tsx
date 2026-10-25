"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import type { MetricSnapshot } from "@/lib/types";
import { nowISO, todayISO, uid } from "@/lib/utils";
import { Button, Field, Input } from "./ui";

export const METRIC_FIELDS: { key: keyof MetricSnapshot; label: string; def: string }[] = [
  { key: "connections", label: "Conexões (total)", def: "Total de conexões no fim da semana." },
  { key: "followers", label: "Seguidores (total)", def: "Total de seguidores." },
  { key: "profileViews", label: "Visualizações do perfil", def: "Visualizações nos últimos 7 dias (painel do LinkedIn)." },
  { key: "searchAppearances", label: "Aparições em pesquisas", def: "Aparições em buscas na semana." },
  { key: "impressions", label: "Impressões das publicações", def: "Soma de impressões das suas publicações na semana." },
  { key: "reactions", label: "Reações recebidas", def: "Reações nas suas publicações." },
  { key: "comments", label: "Comentários recebidos", def: "Comentários nas suas publicações." },
  { key: "shares", label: "Compartilhamentos", def: "Compartilhamentos das suas publicações." },
  { key: "commentsMade", label: "Comentários feitos por mim", def: "Comentários relevantes que você fez em conteúdos de terceiros." },
  { key: "invitesSent", label: "Convites enviados", def: "Convites enviados na semana." },
  { key: "invitesAccepted", label: "Convites aceitos", def: "Convites aceitos na semana." },
];

export function MetricForm({ onDone }: { onDone?: () => void }) {
  const { add, toast } = useStore();
  const [date, setDate] = useState(todayISO());
  const [vals, setVals] = useState<Record<string, string>>({});
  const save = () => {
    const t = nowISO();
    const num = (k: string) => (vals[k] === undefined || vals[k] === "" ? null : Number(vals[k]));
    const m = { id: uid("met"), origin: "user", createdAt: t, updatedAt: t, date } as MetricSnapshot;
    METRIC_FIELDS.forEach((f) => ((m as unknown as Record<string, unknown>)[f.key] = num(f.key as string)));
    if (METRIC_FIELDS.every((f) => m[f.key] === null)) return toast("Preencha ao menos uma métrica.", "warn");
    add("metrics", m);
    toast("Métricas da semana registradas");
    setVals({});
    onDone?.();
  };
  return (
    <div className="space-y-3">
      <Field label="Data de fechamento"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        {METRIC_FIELDS.map((f) => (
          <Field key={f.key} label={f.label}><Input type="number" min={0} placeholder="—" title={f.def} value={vals[f.key as string] ?? ""} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} /></Field>
        ))}
      </div>
      <p className="text-[11px] text-ink-mute">Campos vazios ficam como “sem dado” — nunca como zero.</p>
      <Button className="w-full" onClick={save}><Plus className="h-4 w-4" />Salvar registro</Button>
    </div>
  );
}

