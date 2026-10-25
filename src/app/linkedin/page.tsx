"use client";

import { Suspense, useState } from "react";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useDerived } from "@/lib/hooks";
import { useTab } from "@/lib/use-tab";
import { PILLAR_LABEL, type PillarKey } from "@/lib/scoring/nexo-score";
import { CHECKLIST_ITEMS } from "@/lib/labels";
import { cn, fmtDate, fmtShort, nowISO, termMatch, todayISO, uid } from "@/lib/utils";
import type { ChecklistStatus, SSISnapshot } from "@/lib/types";
import { Badge, Button, Card, CardBody, CardHeader, Dialog, Empty, Field, Input, Progress, Tabs } from "@/components/ui";
import { METRIC_FIELDS, MetricForm } from "@/components/metric-form";
import { ConfidenceBadge, MethodNote, OriginBadge, PageHeader, ScoreRing } from "@/components/nexo";
import { TrendChart } from "@/components/charts";

const TABS = ["pilares", "ssi", "checklist", "metricas"] as const;
type Tab = (typeof TABS)[number];

const PILLAR_ACTIONS: Record<PillarKey, { actions: string[]; impact: string }> = {
  brand: { actions: ["Revisar título com cargo-alvo + especialidade", "Reescrever Sobre com problemas que resolve e evidências", "Adicionar 2–4 resultados por experiência", "Publicar conteúdo de autoria própria toda semana", "Adicionar um estudo de caso em Destaques"], impact: "Mais coerência entre posicionamento e cargos pretendidos; perfil encontrado por termos das vagas." },
  people: { actions: ["Usar a busca do LinkedIn com filtros de cargo, empresa e localidade (manualmente)", "Mapear 3 pessoas por empresa-alvo", "Cobrir as 4 categorias: recrutadores, gestores, função-alvo, lideranças", "Reservar 15 min, 3x por semana, para prospecção"], impact: "Rede mais relevante para os objetivos, não apenas maior." },
  insights: { actions: ["Comentar com contribuição técnica (não apenas 'parabéns')", "Compartilhar referências com sua leitura", "Enviar mensagens com contexto após interações", "Participar de discussões das empresas-alvo"], impact: "Visibilidade junto a pessoas-alvo e reputação de quem contribui." },
  relationships: { actions: ["Registrar próximo passo para cada contato abordado", "Retomar contatos sem resposta após 2–3 semanas, uma única vez", "Agradecer interações e indicações", "Manter interações recorrentes com 5 contatos estratégicos"], impact: "Relacionamentos que se convertem em conversas e indicações." },
};

function LinkedInInner() {
  const [tab, setTab] = useTab<Tab>("pilares", TABS);
  const d = useDerived();
  return (
    <>
      <PageHeader index="02" title="Meu LinkedIn e SSI"
        description="Quatro pilares inspirados no Social Selling Index. O SSI oficial é registrado por você; o NEXO Score é uma estimativa interna com metodologia aberta."
        actions={<a href="https://www.linkedin.com/sales/ssi" target="_blank" rel="noreferrer"><Button variant="outline"><ExternalLink className="h-4 w-4" />Consultar meu SSI oficial</Button></a>} />
      <Tabs className="mb-5" value={tab} onChange={setTab} items={[
        { value: "pilares", label: "Pilares" }, { value: "ssi", label: "SSI oficial", count: d.ssi.length },
        { value: "checklist", label: "Checklist do perfil" }, { value: "metricas", label: "Métricas semanais", count: d.metrics.length },
      ]} />
      {tab === "pilares" && <Pillars />}
      {tab === "ssi" && <SSITab />}
      {tab === "checklist" && <Checklist />}
      {tab === "metricas" && <MetricsTab />}
    </>
  );
}

function Pillars() {
  const d = useDerived();
  const { data } = useStore();
  const last = d.ssi[d.ssi.length - 1];
  return (
    <div className="space-y-4">
      <Card tone="green">
        <CardBody className="flex flex-col gap-6 pt-5 md:flex-row md:items-center">
          <div className="flex items-center gap-5">
            <ScoreRing value={d.score.total} label="NEXO Score" track="rgba(245,240,232,.15)" />
            <ScoreRing value={last?.total ?? null} label="SSI oficial" tone="pink" track="rgba(245,240,232,.15)" />
          </div>
          <div className="flex-1 text-sm text-paper/80">
            <p><strong className="text-paper">NEXO Score — estimativa interna.</strong> Calculado só com o que você registrou aqui. Não reproduz o algoritmo proprietário do LinkedIn e não deve ser lido como SSI.</p>
            <p className="mt-2">{last ? <>SSI oficial: <strong className="text-paper">{last.total}</strong> em {fmtDate(last.date)} {last.origin === "demo" && <Badge tone="solidPink">DEMO</Badge>}</> : "SSI oficial ainda não registrado."} · Meta: {data.profile.goals.ssiTarget}</p>
            <div className="mt-3"><ConfidenceBadge confidence={d.score.confidence} coverage={d.score.coverage} /></div>
          </div>
        </CardBody>
      </Card>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {d.score.pillars.map((pl) => {
          const target = data.profile.goals.pillarTargets[pl.key];
          const official = last ? last[pl.key] : null;
          const strengths = pl.components.filter((c) => c.value !== null && c.value >= 0.7);
          const gaps = pl.components.filter((c) => c.value === null || c.value < 0.5);
          return (
            <Card key={pl.key}>
              <CardHeader eyebrow={`Pilar ${["brand", "people", "insights", "relationships"].indexOf(pl.key) + 1}`} title={PILLAR_LABEL[pl.key]} action={<ConfidenceBadge confidence={pl.confidence} coverage={pl.coverage} />} />
              <CardBody className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <Mini label="NEXO (estimativa)" value={pl.score ?? "—"} />
                  <Mini label="SSI oficial" value={official ?? "—"} demo={last?.origin === "demo"} />
                  <Mini label="Meta" value={target} pink />
                </div>
                <Progress value={pl.score} max={25} target={target} tone={(pl.score ?? 0) >= target ? "green" : "pink"} />
                {d.ssi.length > 1 && (
                  <TrendChart height={120} x="label" series={[{ key: "v", name: "SSI oficial" }]} target={target} yDomain={[0, 25]}
                    data={d.ssi.map((s) => ({ label: fmtShort(s.date), v: s[pl.key] }))} />
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-green-600">Pontos fortes</div>
                    {strengths.length ? strengths.map((c) => <p key={c.label} className="text-xs text-ink-soft">+ {c.label} <span className="text-ink-mute">({c.detail})</span></p>) : <p className="text-xs text-ink-mute">Nenhum componente acima de 70% da meta.</p>}
                  </div>
                  <div>
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-pink-700">Lacunas</div>
                    {gaps.length ? gaps.map((c) => <p key={c.label} className="text-xs text-ink-soft">– {c.label} <span className="text-ink-mute">({c.detail})</span></p>) : <p className="text-xs text-ink-mute">Sem lacunas relevantes.</p>}
                  </div>
                </div>
                <div className="rounded-xl bg-paper p-3">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Ações recomendadas</div>
                  <ul className="list-inside list-disc space-y-0.5 text-xs text-ink-soft">{PILLAR_ACTIONS[pl.key].actions.map((a) => <li key={a}>{a}</li>)}</ul>
                  <p className="mt-2 text-[11px] text-ink-mute"><strong>Impacto esperado:</strong> {PILLAR_ACTIONS[pl.key].impact}</p>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
      <MethodNote title="Como o NEXO Score é calculado">
        <p>Cada pilar vai de 0 a 25 e combina componentes ponderados, comparando seus registros com as metas definidas no perfil. Componentes sem dados são excluídos e a cobertura cai — por isso cada pilar mostra o nível de confiança.</p>
        <p>Veja a documentação completa em <a className="underline" href="/metodologia">Metodologia e transparência</a>.</p>
      </MethodNote>
    </div>
  );
}

function Mini({ label, value, pink, demo }: { label: string; value: React.ReactNode; pink?: boolean; demo?: boolean }) {
  return (
    <div className="rounded-xl bg-paper px-2 py-2">
      <div className={cn("font-display text-xl font-semibold", pink ? "text-pink" : "text-green")}>{value}</div>
      <div className="text-[10px] text-ink-mute">{label}{demo && " · demo"}</div>
    </div>
  );
}

function SSITab() {
  const { add, remove, toast } = useStore();
  const d = useDerived();
  const [f, setF] = useState({ date: todayISO(), total: "", brand: "", people: "", insights: "", relationships: "", industryRank: "", networkRank: "" });
  const pillars = ["brand", "people", "insights", "relationships"] as const;
  const sumP = pillars.reduce((a, k) => a + (parseFloat(f[k]) || 0), 0);
  const save = () => {
    const vals = pillars.map((k) => parseFloat(f[k]));
    if (vals.some((v) => isNaN(v) || v < 0 || v > 25)) return toast("Informe os quatro pilares (0 a 25).", "warn");
    const total = f.total ? parseFloat(f.total) : Math.round(sumP * 100) / 100;
    if (total < 0 || total > 100) return toast("Total deve ficar entre 0 e 100.", "warn");
    const t = nowISO();
    const s: SSISnapshot = { id: uid("ssi"), origin: "user", createdAt: t, updatedAt: t, date: f.date, total, brand: vals[0], people: vals[1], insights: vals[2], relationships: vals[3], industryRank: f.industryRank ? +f.industryRank : null, networkRank: f.networkRank ? +f.networkRank : null };
    add("ssi", s);
    toast("Snapshot do SSI oficial registrado");
    setF({ ...f, total: "", brand: "", people: "", insights: "", relationships: "", industryRank: "", networkRank: "" });
  };
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <CardHeader title="Registrar SSI oficial" description="Copie os valores exibidos em linkedin.com/sales/ssi. O NEXO não acessa essa página automaticamente." />
        <CardBody className="space-y-3">
          <Field label="Data da consulta"><Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            {pillars.map((k) => (
              <Field key={k} label={PILLAR_LABEL[k]} hint="0–25"><Input type="number" step="0.01" min={0} max={25} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></Field>
            ))}
          </div>
          <Field label="SSI total" hint={`vazio = soma dos pilares (${sumP.toFixed(2)})`}><Input type="number" step="0.01" value={f.total} onChange={(e) => setF({ ...f, total: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Top % no setor" hint="opcional"><Input type="number" value={f.industryRank} onChange={(e) => setF({ ...f, industryRank: e.target.value })} /></Field>
            <Field label="Top % na rede" hint="opcional"><Input type="number" value={f.networkRank} onChange={(e) => setF({ ...f, networkRank: e.target.value })} /></Field>
          </div>
          <Button className="w-full" onClick={save}><Plus className="h-4 w-4" />Salvar snapshot</Button>
        </CardBody>
      </Card>
      <Card className="lg:col-span-3">
        <CardHeader title="Histórico do SSI oficial" description="Somente valores registrados — nenhum ponto é interpolado." />
        <CardBody>
          {d.ssi.length ? (
            <>
              <TrendChart height={220} x="label" yDomain={[0, 25]} series={pillars.map((k) => ({ key: k, name: PILLAR_LABEL[k] }))} data={d.ssi.map((s) => ({ label: fmtShort(s.date), ...s }))} />
              <div className="mt-4 max-h-72 overflow-auto">
                <table className="w-full text-xs">
                  <thead className="text-left text-ink-mute"><tr><th className="py-2">Data</th><th>Total</th><th>Marca</th><th>Pessoas</th><th>Insights</th><th>Relac.</th><th>Origem</th><th /></tr></thead>
                  <tbody className="divide-y divide-paper-line">
                    {d.ssi.slice().reverse().map((s) => (
                      <tr key={s.id}><td className="py-2">{fmtDate(s.date)}</td><td className="font-semibold text-green">{s.total}</td><td>{s.brand}</td><td>{s.people}</td><td>{s.insights}</td><td>{s.relationships}</td><td><OriginBadge origin={s.origin} /></td>
                        <td><Button size="icon" variant="danger" onClick={() => remove("ssi", s.id)} aria-label="Excluir"><Trash2 className="h-3.5 w-3.5" /></Button></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : <Empty title="Nenhum SSI registrado">Registre o primeiro snapshot ao lado.</Empty>}
        </CardBody>
      </Card>
    </div>
  );
}

function Checklist() {
  const { data, setProfile } = useStore();
  const p = data.profile;
  const setItem = (key: string, patch: { status?: ChecklistStatus; note?: string }) =>
    setProfile({ checklist: p.checklist.map((c) => (c.key === key ? { ...c, ...patch } : c)) });

  // Análises automáticas (heurísticas transparentes sobre o texto informado)
  const kw = Array.from(new Set(p.targetRoles.flatMap((r) => r.split(/\s+/)).concat(p.interests.slice(0, 3).flatMap((i) => i.keywords)).filter((w) => w.length > 4)));
  const text = `${p.headline} ${p.about} ${p.experiences.map((e) => e.description).join(" ")}`;
  const present = kw.filter((k) => termMatch(text, k));
  const headlineRole = p.targetRoles.some((r) => r.split(/\s+/).some((w) => w.length > 4 && termMatch(p.headline, w)));
  const aboutWords = p.about.trim().split(/\s+/).filter(Boolean).length;
  const placeholders = p.experiences.flatMap((e) => e.achievements).filter((a) => a.startsWith("[")).length;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader title="Checklist do perfil" description="Avalie cada item olhando seu perfil público. Essa avaliação alimenta o pilar Marca." />
        <CardBody>
          <ul className="divide-y divide-paper-line">
            {CHECKLIST_ITEMS.map((it) => {
              const c = p.checklist.find((x) => x.key === it.key) ?? { key: it.key, status: "nao_avaliado" as ChecklistStatus, note: "" };
              return (
                <li key={it.key} className="grid grid-cols-1 gap-2 py-3 sm:grid-cols-[1fr_auto] sm:items-start">
                  <div>
                    <div className="text-sm font-medium text-ink">{it.label}</div>
                    <div className="text-xs text-ink-mute">{it.hint}</div>
                    <Input className="mt-2 h-8 text-xs" placeholder="Nota (opcional)" value={c.note} onChange={(e) => setItem(it.key, { note: e.target.value })} />
                  </div>
                  <div className="flex gap-1">
                    {(["ok", "melhorar", "ausente"] as const).map((s) => (
                      <button key={s} onClick={() => setItem(it.key, { status: c.status === s ? "nao_avaliado" : s })}
                        className={cn("rounded-full border px-3 py-1 text-[11px] transition",
                          c.status === s ? (s === "ok" ? "border-green bg-green text-paper" : s === "melhorar" ? "border-amber bg-amber-100 text-amber" : "border-pink bg-pink text-white") : "border-paper-line text-ink-soft hover:border-green/40")}>
                        {s === "ok" ? "OK" : s === "melhorar" ? "Melhorar" : "Ausente"}
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </CardBody>
      </Card>
      <div className="space-y-4">
        <Card>
          <CardHeader eyebrow="Análise automática" title="Texto do perfil no NEXO" description="Heurísticas sobre o que você cadastrou em Perfil. Não lê o LinkedIn." />
          <CardBody className="space-y-3 text-xs">
            <Check ok={headlineRole} label="Título menciona cargo-alvo" detail={p.headline || "Título vazio"} />
            <Check ok={aboutWords >= 120 && aboutWords <= 400} label={`Sobre com ${aboutWords} palavras`} detail="Referência NEXO: 120–400 palavras, com evidências." />
            <Check ok={placeholders === 0} label="Experiências com resultados" detail={placeholders ? `${placeholders} resultado(s) ainda com [lacuna] para preencher` : "Resultados preenchidos"} />
            <div>
              <div className="mb-1 font-medium text-ink">Palavras-chave dos cargos-alvo</div>
              <div className="flex flex-wrap gap-1">
                {kw.map((k) => <Badge key={k} tone={present.includes(k) ? "green" : "outline"}>{present.includes(k) ? "✓ " : ""}{k}</Badge>)}
              </div>
              <p className="mt-1 text-ink-mute">{present.length}/{kw.length} presentes no título, Sobre ou experiências.</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Sugestão de título" description="Modelo: cargo-alvo | especialidade | diferencial" />
          <CardBody className="space-y-2 text-xs">
            {p.targetRoles.slice(0, 3).map((r) => (
              <div key={r} className="rounded-xl bg-paper p-3 text-ink">{r.replace(/^Analista de /, "")} | Arquiteta e Urbanista (UFPR) | Infraestrutura, padronização de processos e indicadores</div>
            ))}
            <p className="text-ink-mute">Ajuste ao que você consegue comprovar. Edite o título em Perfil.</p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Check({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div className="flex gap-2">
      <span className={cn("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] text-white", ok ? "bg-green-600" : "bg-pink")}>{ok ? "✓" : "!"}</span>
      <div><div className="font-medium text-ink">{label}</div><div className="text-ink-mute">{detail}</div></div>
    </div>
  );
}

function MetricsTab() {
  const d = useDerived();
  const { remove } = useStore();
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <CardHeader title="Registros semanais do LinkedIn" description="Fonte: painel do seu perfil, preenchido manualmente ou importado por CSV (Perfil → Importações)."
        action={<Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" />Novo registro</Button>} />
      <CardBody>
        {d.metrics.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-xs">
              <thead className="text-left text-ink-mute"><tr><th className="py-2">Semana</th>{METRIC_FIELDS.map((f) => <th key={f.key} className="px-1" title={f.def}>{f.label.split(" (")[0]}</th>)}<th>Origem</th><th /></tr></thead>
              <tbody className="divide-y divide-paper-line">
                {d.metrics.slice().reverse().map((m) => (
                  <tr key={m.id}><td className="py-2">{fmtDate(m.date)}</td>{METRIC_FIELDS.map((f) => <td key={f.key} className="px-1">{(m[f.key] as number | null) ?? "—"}</td>)}<td><OriginBadge origin={m.origin} /></td>
                    <td><Button size="icon" variant="danger" onClick={() => remove("metrics", m.id)} aria-label="Excluir"><Trash2 className="h-3.5 w-3.5" /></Button></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty title="Sem registros">Registre suas métricas semanais para habilitar KPIs e relatórios.</Empty>}
      </CardBody>
      <Dialog open={open} onClose={() => setOpen(false)} title="Registrar métricas da semana"><MetricForm onDone={() => setOpen(false)} /></Dialog>
    </Card>
  );
}

export default function Page() {
  return <Suspense><LinkedInInner /></Suspense>;
}

