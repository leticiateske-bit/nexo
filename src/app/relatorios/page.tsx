"use client";

import { useState } from "react";
import { Download, FileText, Lightbulb, Printer } from "lucide-react";
import { useStore } from "@/lib/store";
import { useDerived } from "@/lib/hooks";
import type { MetricSnapshot } from "@/lib/types";
import { addDays, download, fmtDate, fmtNum, fmtShort, pctChange, sum, toCSV, todayISO } from "@/lib/utils";
import { JOB_STATUS } from "@/lib/labels";
import { Badge, Button, Card, CardBody, CardHeader, Empty, Input, Tabs } from "@/components/ui";
import { MethodNote, OriginBadge, PageHeader } from "@/components/nexo";
import { BarsChart, TrendChart } from "@/components/charts";

type Period = "7" | "30" | "90" | "custom";

interface KPI { label: string; value: number | null; prev: number | null; unit: string; def: string; source: string; updated: string | null; format?: (n: number | null) => string; demo?: boolean }

export default function Reports() {
  const { data, view } = useStore();
  const d = useDerived();
  const [period, setPeriod] = useState<Period>("30");
  const [from, setFrom] = useState(addDays(todayISO(), -60));
  const [to, setTo] = useState(todayISO());
  const end = period === "custom" ? to : todayISO();
  const start = period === "custom" ? from : addDays(end, -Number(period));
  const len = Math.max(1, (new Date(end).getTime() - new Date(start).getTime()) / 86400000);
  const pStart = addDays(start, -len);
  const inR = (date: string | null | undefined, a: string, b: string) => !!date && date > a && date <= b;

  const metrics = d.metrics;
  const cur = metrics.filter((m) => inR(m.date, start, end));
  const prev = metrics.filter((m) => inR(m.date, pStart, start));
  const lastOf = (ms: MetricSnapshot[], k: keyof MetricSnapshot) => { const v = ms.filter((m) => m[k] !== null); return v.length ? (v[v.length - 1][k] as number) : null; };
  const sumOf = (ms: MetricSnapshot[], k: keyof MetricSnapshot) => { const v = ms.filter((m) => m[k] !== null); return v.length ? sum(v.map((m) => m[k] as number)) : null; };
  const updated = metrics.length ? metrics[metrics.length - 1].date : null;
  const mDemo = cur.some((m) => m.origin === "demo");
  const engagement = (ms: MetricSnapshot[]) => {
    const inter = sumOf(ms, "reactions") !== null ? (sumOf(ms, "reactions") ?? 0) + (sumOf(ms, "comments") ?? 0) + (sumOf(ms, "shares") ?? 0) : null;
    if (inter === null) return null;
    if (data.settings.engagementRateDefinition === "por_seguidor") { const f = lastOf(ms, "followers"); return f ? (inter / f) * 100 : null; }
    const imp = sumOf(ms, "impressions"); return imp ? (inter / imp) * 100 : null;
  };
  const src = "Registro semanal manual / CSV";
  const linkedin: KPI[] = [
    { label: "Conexões", value: lastOf(cur, "connections"), prev: lastOf(prev, "connections"), unit: "total", def: "Total no último registro do período.", source: src, updated, demo: mDemo },
    { label: "Seguidores", value: lastOf(cur, "followers"), prev: lastOf(prev, "followers"), unit: "total", def: "Total no último registro do período.", source: src, updated, demo: mDemo },
    { label: "Visualizações do perfil", value: sumOf(cur, "profileViews"), prev: sumOf(prev, "profileViews"), unit: "soma", def: "Soma dos registros semanais do período.", source: src, updated, demo: mDemo },
    { label: "Aparições em pesquisas", value: sumOf(cur, "searchAppearances"), prev: sumOf(prev, "searchAppearances"), unit: "soma", def: "Soma dos registros semanais.", source: src, updated, demo: mDemo },
    { label: "Impressões", value: sumOf(cur, "impressions"), prev: sumOf(prev, "impressions"), unit: "soma", def: "Impressões das suas publicações no período.", source: src, updated, demo: mDemo },
    { label: "Reações + comentários + compart.", value: sumOf(cur, "reactions") === null ? null : (sumOf(cur, "reactions") ?? 0) + (sumOf(cur, "comments") ?? 0) + (sumOf(cur, "shares") ?? 0), prev: sumOf(prev, "reactions") === null ? null : (sumOf(prev, "reactions") ?? 0) + (sumOf(prev, "comments") ?? 0) + (sumOf(prev, "shares") ?? 0), unit: "soma", def: "Interações recebidas nas suas publicações.", source: src, updated, demo: mDemo },
    { label: "Taxa de interação", value: engagement(cur), prev: engagement(prev), unit: "%", def: data.settings.engagementRateDefinition === "por_impressao" ? "Interações ÷ impressões × 100 (definição configurável em Perfil)." : "Interações ÷ seguidores × 100.", source: src, updated, format: (n) => (n === null ? "—" : `${n.toFixed(2)}%`), demo: mDemo },
    { label: "SSI oficial", value: d.ssi.filter((s) => inR(s.date, start, end)).slice(-1)[0]?.total ?? null, prev: d.ssi.filter((s) => inR(s.date, pStart, start)).slice(-1)[0]?.total ?? null, unit: "0–100", def: "Último SSI registrado manualmente no período.", source: "linkedin.com/sales/ssi (manual)", updated: d.ssi.slice(-1)[0]?.date ?? null, demo: d.ssi.some((s) => s.origin === "demo") },
  ];

  const posts = view("posts");
  const pubIn = (a: string, b: string) => posts.filter((p) => p.status === "publicado" && inR(p.publishedDate, a, b));
  const postInter = (ps: typeof posts) => { const w = ps.filter((p) => p.results.reactions !== null); return w.length ? sum(w.map((p) => (p.results.reactions ?? 0) + (p.results.comments ?? 0) + (p.results.shares ?? 0))) / w.length : null; };
  const pDemo = posts.some((p) => p.origin === "demo");
  const content: KPI[] = [
    { label: "Publicações publicadas", value: pubIn(start, end).length, prev: pubIn(pStart, start).length, unit: "nº", def: "Posts com data de publicação no período.", source: "Calendário editorial", updated: null, demo: pDemo },
    { label: "Planejadas (agendadas no período)", value: posts.filter((p) => inR(p.scheduledDate, start, end)).length, prev: posts.filter((p) => inR(p.scheduledDate, pStart, start)).length, unit: "nº", def: "Posts com data agendada no período.", source: "Calendário editorial", updated: null, demo: pDemo },
    { label: "Interações por publicação", value: postInter(pubIn(start, end)), prev: postInter(pubIn(pStart, start)), unit: "média", def: "Média de interações nos posts publicados com resultados registrados.", source: "Resultados registrados por post", updated: null, format: (n) => (n === null ? "—" : n.toFixed(1)), demo: pDemo },
    { label: "Rascunhos e ideias em aberto", value: posts.filter((p) => ["ideia", "rascunho", "revisao"].includes(p.status)).length, prev: null, unit: "nº", def: "Situação atual (não comparável por período).", source: "Calendário editorial", updated: null, demo: pDemo },
  ];

  const contacts = view("contacts");
  const ints = contacts.flatMap((c) => c.interactions);
  const cDemo = contacts.some((c) => c.origin === "demo");
  const invS = sumOf(cur, "invitesSent"), invA = sumOf(cur, "invitesAccepted"), invSp = sumOf(prev, "invitesSent"), invAp = sumOf(prev, "invitesAccepted");
  const networking: KPI[] = [
    { label: "Contatos identificados", value: contacts.length, prev: null, unit: "total", def: "Total atual de contatos registrados.", source: "Networking", updated: null, demo: cDemo },
    { label: "Convites enviados", value: invS, prev: invSp, unit: "soma", def: "Registro semanal manual.", source: src, updated, demo: mDemo },
    { label: "Taxa de aceitação", value: invS && invS >= 5 ? ((invA ?? 0) / invS) * 100 : null, prev: invSp && invSp >= 5 ? ((invAp ?? 0) / invSp) * 100 : null, unit: "%", def: "Aceitos ÷ enviados. Exibida só com 5+ convites no período.", source: src, updated, format: (n) => (n === null ? "dados insuf." : `${n.toFixed(0)}%`), demo: mDemo },
    { label: "Mensagens enviadas", value: ints.filter((i) => i.kind === "mensagem" && inR(i.date, start, end)).length, prev: ints.filter((i) => i.kind === "mensagem" && inR(i.date, pStart, start)).length, unit: "nº", def: "Interações do tipo mensagem registradas.", source: "Networking", updated: null, demo: cDemo },
    { label: "Respostas registradas", value: ints.filter((i) => i.kind === "resposta" && inR(i.date, start, end)).length, prev: ints.filter((i) => i.kind === "resposta" && inR(i.date, pStart, start)).length, unit: "nº", def: "Interações do tipo resposta.", source: "Networking", updated: null, demo: cDemo },
    { label: "Conversas iniciadas", value: contacts.filter((c) => c.status === "em_conversa").length, prev: null, unit: "atual", def: "Contatos com status em conversa.", source: "Networking", updated: null, demo: cDemo },
    { label: "Próximos passos pendentes", value: contacts.filter((c) => c.nextStepDate).length, prev: null, unit: "atual", def: "Contatos com próximo passo agendado.", source: "Networking", updated: null, demo: cDemo },
  ];

  const jobs = d.jobs;
  const jDemo = jobs.some((j) => j.origin === "demo");
  const histIn = (s: string, a: string, b: string) => jobs.filter((j) => j.history.some((h) => h.status === s && inR(h.date, a, b))).length;
  const career: KPI[] = [
    { label: "Vagas registradas", value: jobs.filter((j) => inR(j.createdAt.slice(0, 10), start, end) || inR(j.publishedAt, start, end)).length, prev: null, unit: "nº", def: "Vagas registradas/publicadas no período.", source: "Vagas", updated: null, demo: jDemo },
    { label: "Vagas aderentes (≥ 70)", value: jobs.filter((j) => (d.jobFits.get(j.id)?.total ?? 0) >= 70).length, prev: null, unit: "atual", def: "Compatibilidade NEXO ≥ 70.", source: "Índice de compatibilidade", updated: null, demo: jDemo },
    { label: "Candidaturas enviadas", value: histIn("enviada", start, end), prev: histIn("enviada", pStart, start), unit: "nº", def: "Mudanças de status para “enviada” no período.", source: "Histórico das vagas", updated: null, demo: jDemo },
    { label: "Entrevistas", value: histIn("entrevista", start, end), prev: histIn("entrevista", pStart, start), unit: "nº", def: "Mudanças de status para “entrevista”.", source: "Histórico das vagas", updated: null, demo: jDemo },
    { label: "Cursos concluídos", value: data.courses.filter((c) => c.status === "concluido").length, prev: null, unit: "total", def: "Capacitações com status concluído.", source: "Carreira", updated: null },
    { label: "Plano 30/60/90 concluído", value: view("plan").length ? (view("plan").filter((p) => p.done).length / view("plan").length) * 100 : null, prev: null, unit: "%", def: "Ações concluídas ÷ total.", source: "Carreira", updated: null, format: (n) => (n === null ? "—" : `${n.toFixed(0)}%`) },
  ];

  const insights = buildInsights({ cur, prev, linkedin, content, networking, career, posts: pubIn(start, end).length, goal: data.profile.goals.postsPerWeek * (len / 7) });
  const exportCSV = (name: string, rows: Record<string, unknown>[]) => download(`nexo-${name}-${todayISO()}.csv`, toCSV(rows));
  const kpiRows = () => [["LinkedIn", linkedin], ["Conteúdo", content], ["Networking", networking], ["Carreira", career]].flatMap(([sec, ks]) => (ks as KPI[]).map((k) => ({ secao: sec, indicador: k.label, valor: k.value, periodo_anterior: k.prev, variacao_pct: pctChange(k.value, k.prev)?.toFixed(1) ?? "sem base", unidade: k.unit, definicao: k.def, fonte: k.source, contem_demo: k.demo ? "sim" : "não", inicio: start, fim: end })));

  return (
    <>
      <PageHeader index="08" title="Relatórios e KPIs" description="Indicadores com definição, unidade, fonte e data. Variações só aparecem quando há base válida no período anterior."
        actions={<>
          <Button variant="outline" onClick={() => exportCSV("kpis", kpiRows())}><Download className="h-4 w-4" />CSV de KPIs</Button>
          <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" />PDF (imprimir)</Button>
        </>} />

      <div className="no-print mb-5 flex flex-wrap items-center gap-2">
        <Tabs value={period} onChange={setPeriod} items={[{ value: "7", label: "7 dias" }, { value: "30", label: "30 dias" }, { value: "90", label: "90 dias" }, { value: "custom", label: "Personalizado" }]} />
        {period === "custom" && <div className="flex items-center gap-2"><Input type="date" className="w-auto" value={from} onChange={(e) => setFrom(e.target.value)} /><span className="text-xs text-ink-mute">até</span><Input type="date" className="w-auto" value={to} onChange={(e) => setTo(e.target.value)} /></div>}
        <span className="text-xs text-ink-mute">{fmtDate(start)} – {fmtDate(end)} · comparado a {fmtDate(pStart)} – {fmtDate(start)}</span>
      </div>
      {cur.length === 0 && <div className="mb-4 rounded-xl bg-amber-100 px-4 py-2.5 text-xs text-amber">Nenhum registro semanal de LinkedIn neste período — indicadores do LinkedIn aparecem como “—”.</div>}

      <Card tone="green" className="mb-5">
        <CardHeader eyebrow="Leitura" title={<span className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-pink" />O que os dados indicam</span>} />
        <CardBody className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
          {(["conclusoes", "ressalvas", "recomendacoes"] as const).map((k) => (
            <div key={k}>
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-pink-300">{k === "conclusoes" ? "Conclusões" : k === "ressalvas" ? "Ressalvas" : "Recomendações práticas"}</div>
              <ul className="space-y-1.5 text-paper/85">{insights[k].map((x, i) => <li key={i}>• {x}</li>)}</ul>
            </div>
          ))}
        </CardBody>
      </Card>

      <Section title="LinkedIn" kpis={linkedin} onExport={() => exportCSV("metricas-linkedin", metrics.map(({ id, createdAt, updatedAt, ...r }) => (void id, void createdAt, void updatedAt, r)))}>
        {cur.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card><CardHeader title="Crescimento da rede" description="Conexões e seguidores (totais semanais)" /><CardBody><TrendChart height={220} x="label" series={[{ key: "connections", name: "Conexões" }, { key: "followers", name: "Seguidores" }]} data={cur.map((m) => ({ ...m, label: fmtShort(m.date) }))} /></CardBody></Card>
            <Card><CardHeader title="Impressões por semana" description="Quais semanas tiveram mais alcance?" /><CardBody><BarsChart height={220} x="label" series={[{ key: "impressions", name: "Impressões" }]} data={cur.map((m) => ({ label: fmtShort(m.date), impressions: m.impressions }))} /></CardBody></Card>
          </div>
        ) : <Empty title="Sem registros no período" />}
      </Section>

      <Section title="Conteúdo" kpis={content} onExport={() => exportCSV("publicacoes", posts.map((p) => ({ titulo: p.title, status: p.status, formato: p.format, objetivo: p.objective, tema: p.theme, agendada: p.scheduledDate, publicada: p.publishedDate, impressoes: p.results.impressions, reacoes: p.results.reactions, comentarios: p.results.comments, compartilhamentos: p.results.shares, origem: p.origin })))} />

      <Section title="Networking" kpis={networking} onExport={() => exportCSV("contatos", contacts.map((c) => ({ nome: c.name, cargo: c.role, empresa: c.company, categoria: c.category, status: c.status, interacoes: c.interactions.length, proximo_passo: c.nextStep, data_proximo_passo: c.nextStepDate, origem: c.origin })))} />

      <Section title="Carreira" kpis={career} onExport={() => exportCSV("vagas", jobs.map((j) => ({ cargo: j.title, empresa: j.company, cidade: j.city, modalidade: j.mode, status: JOB_STATUS[j.status], compatibilidade: d.jobFits.get(j.id)?.total, link: j.url, origem: j.origin })))}>
        <Card><CardHeader title="Candidaturas por etapa" description="Onde as oportunidades estão paradas?" /><CardBody>
          <BarsChart height={200} x="etapa" series={[{ key: "n", name: "Vagas" }]} data={Object.entries(JOB_STATUS).map(([k, v]) => ({ etapa: v.replace("Candidatura ", ""), n: jobs.filter((j) => j.status === k).length }))} />
        </CardBody></Card>
      </Section>

      <MethodNote title="Regras de cálculo">
        <p>Totais (conexões, seguidores) usam o último registro do período; fluxos (visualizações, impressões, interações, convites) somam os registros semanais. Períodos sem registro aparecem como “—”, nunca como zero.</p>
        <p>Variação percentual = (atual − anterior) ÷ anterior. Se o anterior é ausente ou zero, exibimos “sem base” para não criar variações enganosas. A taxa de aceitação só aparece com 5+ convites no período.</p>
      </MethodNote>
    </>
  );
}

function Section({ title, kpis, onExport, children }: { title: string; kpis: KPI[]; onExport: () => void; children?: React.ReactNode }) {
  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-green"><span className="h-4 w-1 rounded bg-pink" />{title}</h2>
        <Button size="sm" variant="ghost" className="no-print" onClick={onExport}><FileText className="h-3.5 w-3.5" />Exportar CSV</Button>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpis.map((k) => {
          const delta = k.prev === null ? undefined : pctChange(k.value, k.prev);
          return (
            <div key={k.label} className="group relative rounded-xl border border-paper-line bg-white/70 p-4">
              <div className="flex items-start justify-between gap-1"><span className="text-[11px] font-medium uppercase tracking-[.08em] text-ink-mute">{k.label}</span>{k.demo && <OriginBadge origin="demo" />}</div>
              <div className="mt-1.5 font-display text-2xl font-semibold text-green">{k.format ? k.format(k.value) : fmtNum(k.value)}</div>
              <div className="mt-1 text-[11px] text-ink-mute">
                {delta === undefined ? <span>{k.unit}</span> : delta === null ? <span>{k.unit} · sem base anterior</span> : <span>{k.unit} · <span className={delta >= 0 ? "font-medium text-green-600" : "font-medium text-pink-700"}>{delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%</span></span>}
              </div>
              <div className="mt-2 border-t border-paper-line pt-2 text-[10px] leading-snug text-ink-mute">{k.def}<br />Fonte: {k.source}{k.updated && ` · atualizado ${fmtDate(k.updated)}`}</div>
            </div>
          );
        })}
      </div>
      {children}
    </section>
  );
}

function buildInsights({ cur, prev, linkedin, content, networking, career, posts, goal }: { cur: MetricSnapshot[]; prev: MetricSnapshot[]; linkedin: KPI[]; content: KPI[]; networking: KPI[]; career: KPI[]; posts: number; goal: number }) {
  const conclusoes: string[] = [], ressalvas: string[] = [], recomendacoes: string[] = [];
  const get = (ks: KPI[], l: string) => ks.find((k) => k.label === l)!;
  const views = get(linkedin, "Visualizações do perfil");
  const dv = pctChange(views.value, views.prev);
  if (dv !== null) conclusoes.push(`Visualizações do perfil ${dv >= 0 ? "subiram" : "caíram"} ${Math.abs(dv).toFixed(0)}% vs período anterior (${fmtNum(views.prev)} → ${fmtNum(views.value)}).`);
  const rate = get(linkedin, "Taxa de interação");
  if (rate.value !== null) conclusoes.push(`Taxa de interação de ${rate.value.toFixed(2)}% no período.`);
  conclusoes.push(`${posts} publicação(ões) no período vs meta proporcional de ${Math.round(goal)}.`);
  const resp = get(networking, "Respostas registradas"), msgs = get(networking, "Mensagens enviadas");
  if ((msgs.value ?? 0) > 0) conclusoes.push(`${resp.value} resposta(s) para ${msgs.value} mensagem(ns) registradas.`);
  const sent = get(career, "Candidaturas enviadas");
  if ((sent.value ?? 0) > 0) conclusoes.push(`${sent.value} candidatura(s) enviada(s) e ${get(career, "Entrevistas").value} entrevista(s).`);

  if (cur.length < 4) ressalvas.push(`Apenas ${cur.length} registro(s) semanal(is) no período — tendências são frágeis.`);
  if (!prev.length) ressalvas.push("Sem registros no período anterior: não há comparação válida.");
  if ([...linkedin, ...content, ...networking, ...career].some((k) => k.demo)) ressalvas.push("Parte dos indicadores inclui dados DEMO (fictícios). Oculte-os na barra lateral para ver só seus dados.");
  ressalvas.push("Correlação não é causa: um aumento de visualizações perto de uma publicação não prova que ela o causou.");

  if (posts < goal) recomendacoes.push("Frequência abaixo da meta: agende as próximas publicações no Estúdio de conteúdo.");
  if (get(networking, "Taxa de aceitação").value === null) recomendacoes.push("Registre convites enviados/aceitos semanalmente para medir a aceitação.");
  if ((get(career, "Vagas aderentes (≥ 70)").value ?? 0) > (sent.value ?? 0)) recomendacoes.push("Há vagas aderentes sem candidatura enviada — revise o painel de candidaturas.");
  recomendacoes.push("Mantenha o registro semanal no mesmo dia da semana para comparações consistentes.");
  return { conclusoes, ressalvas, recomendacoes };
}
