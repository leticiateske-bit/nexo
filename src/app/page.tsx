"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, Bell, Briefcase, Building2, CalendarClock, Check, GraduationCap, PenLine, RotateCcw, Sparkles, Users, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { useDerived } from "@/lib/hooks";
import { tasksFromRecommendations } from "@/lib/engine/recommendations";
import { marketGaps } from "@/lib/scoring/career";
import { PILLAR_LABEL } from "@/lib/scoring/nexo-score";
import { POST_STATUS } from "@/lib/labels";
import { cn, daysBetween, fmtDate, fmtNum, fmtShort, pctChange, todayISO, weekStart, addDays } from "@/lib/utils";
import { Badge, Button, Card, CardBody, CardHeader, Empty, Progress } from "@/components/ui";
import { ConfidenceBadge, OriginBadge, PageHeader, Stat, SwatchScore } from "@/components/nexo";
import { TrendChart } from "@/components/charts";
import type { TaskStatus } from "@/lib/types";

export default function Overview() {
  const { data, view, addMany, update, toast } = useStore();
  const d = useDerived();
  const p = data.profile;
  const t = todayISO();
  const wk = weekStart();
  const best = d.recs[0];
  const lastSSI = d.ssi[d.ssi.length - 1];
  const [m1, m0] = [d.metrics[d.metrics.length - 1], d.metrics[d.metrics.length - 2]];
  const tasks = view("tasks").filter((x) => x.weekOf === wk);
  const posts = view("posts");
  const contacts = view("contacts");

  const weekPosts = posts.filter((x) => x.scheduledDate && x.scheduledDate >= wk && x.scheduledDate <= addDays(wk, 6) && x.status !== "publicado" && x.status !== "arquivado");
  const nextContacts = contacts.filter((c) => c.nextStepDate && c.status !== "arquivado").sort((a, b) => (a.nextStepDate as string).localeCompare(b.nextStepDate as string)).slice(0, 4);
  const topJobs = d.jobs.filter((j) => j.status !== "descartada" && j.status !== "encerrado").map((j) => ({ j, f: d.jobFits.get(j.id)! })).sort((a, b) => (b.f.total ?? 0) - (a.f.total ?? 0)).slice(0, 4);
  const gaps = marketGaps(p, d.jobs).filter((g) => g.level < 3).slice(0, 4);
  const brands = d.companies.map((c) => ({ c, f: d.brandFits.get(c.id)! })).sort((a, b) => (b.f.total ?? -1) - (a.f.total ?? -1)).slice(0, 3);
  const alerts = d.companies.flatMap((c) => c.trends.map((tr) => ({ ...tr, company: c.name, origin: c.origin }))).sort((a, b) => (b.since || "").localeCompare(a.since || "")).slice(0, 4);

  const genTasks = () => {
    const nt = tasksFromRecommendations(d.recs, data.tasks);
    if (!nt.length) return toast("As tarefas desta semana já estão atualizadas.", "info");
    addMany("tasks", nt);
    toast(`${nt.length} tarefas sugeridas para a semana`);
  };
  const setTask = (id: string, status: TaskStatus) => update("tasks", id, { status });

  const rate = (m?: typeof m1) => (m && m.impressions ? (((m.reactions ?? 0) + (m.comments ?? 0) + (m.shares ?? 0)) / m.impressions) * 100 : null);
  const hello = p.name ? `Olá, ${p.name.split(" ")[0]}.` : "Olá.";

  return (
    <>
      <PageHeader index="01" title="Visão geral" description={<>{hello} Seu centro de comando de {fmtDate(t, { weekday: "long", day: "numeric", month: "long" })}.</>}
        actions={!p.onboardingDone && <Link href="/perfil?onboarding=1"><Button><Sparkles className="h-4 w-4" />Personalizar o NEXO</Button></Link>} />

      {/* Scores + próximo movimento */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SwatchScore index="01" tone="green" label="NEXO Score" value={d.score.total ?? "—"} suffix="/100" code="Estimativa interna · presença profissional"
          badge={<ConfidenceBadge confidence={d.score.confidence} coverage={d.score.coverage} />}
          note="Não é o SSI oficial. Calculado com seus registros no NEXO." />
        <SwatchScore index="02" tone="pink" label="SSI oficial" value={lastSSI ? lastSSI.total : "—"} suffix={lastSSI ? "/100" : undefined}
          code={lastSSI ? `Registrado em ${fmtDate(lastSSI.date)}` : "Não informado"}
          badge={lastSSI && <OriginBadge origin={lastSSI.origin} className="bg-white/90" />}
          note={lastSSI ? "Valor copiado do LinkedIn por você." : <Link href="/linkedin?tab=ssi" className="underline">Registrar SSI oficial →</Link>} />
        <Card className="relative overflow-hidden md:col-span-2" tone="white">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-pink/10" />
          <CardBody className="relative flex h-full flex-col pt-5">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[.18em] text-pink"><Sparkles className="h-3.5 w-3.5" />Seu próximo melhor movimento</div>
            {best ? (
              <>
                <h2 className="font-display text-lg font-semibold leading-snug text-green">{best.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{best.why}</p>
                <p className="mt-2 text-xs text-ink-mute"><strong className="font-medium text-ink-soft">Impacto esperado:</strong> {best.impact}</p>
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                  <Link href={best.href}><Button size="sm">Fazer agora <ArrowRight className="h-3.5 w-3.5" /></Button></Link>
                  <span className="text-[11px] text-ink-mute">Base: {best.basis.join(" · ")}</span>
                  {best.usesDemo && <OriginBadge origin="demo" />}
                </div>
              </>
            ) : <p className="text-sm text-ink-mute">Sem recomendações no momento — registre dados para o NEXO analisar.</p>}
          </CardBody>
        </Card>
      </div>

      {/* Evolução + pilares */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader eyebrow="Evolução" title="Presença profissional ao longo do tempo" description="SSI oficial (registrado) e NEXO Score (estimativa interna) — escalas iguais, origens diferentes."
            action={<Link href="/linkedin" className="text-xs text-green-600 hover:text-pink">Detalhes →</Link>} />
          <CardBody>
            {d.ssi.length || d.scoreHistory.some((s) => s.score !== null) ? (
              <TrendChart height={230} x="label" yDomain={[0, 100]} target={p.goals.ssiTarget} targetLabel={`Meta SSI ${p.goals.ssiTarget}`}
                series={[{ key: "nexo", name: "NEXO Score (estimativa)" }, { key: "ssi", name: "SSI oficial" }]}
                data={mergeSeries(d.ssi.map((s) => ({ date: s.date, ssi: s.total })), d.scoreHistory.map((s) => ({ date: s.date, nexo: s.score })))} />
            ) : <Empty title="Sem histórico ainda">Registre o SSI oficial e suas métricas semanais.</Empty>}
          </CardBody>
        </Card>
        <Card>
          <CardHeader eyebrow="NEXO Score por pilar" title="Onde está a maior lacuna" />
          <CardBody className="space-y-4">
            {d.score.pillars.map((pl) => (
              <div key={pl.key}>
                <div className="mb-1 flex justify-between text-xs"><span className="text-ink-soft">{PILLAR_LABEL[pl.key]}</span><span className="font-display font-semibold text-green">{pl.score ?? "—"}<span className="text-ink-mute">/25</span></span></div>
                <Progress value={pl.score} max={25} target={p.goals.pillarTargets[pl.key]} tone={pl.score !== null && pl.score >= p.goals.pillarTargets[pl.key] ? "green" : "pink"} />
                <div className="mt-1 text-[10px] text-ink-mute">Meta {p.goals.pillarTargets[pl.key]} · cobertura {Math.round(pl.coverage * 100)}%</div>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-xl bg-paper px-3 py-2 text-xs">
              <span className="text-ink-soft">Desempenho de carreira</span>
              <span className="font-display font-semibold text-green">{d.career.total ?? "—"}/100</span>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* KPIs */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Conexões" value={fmtNum(m1?.connections)} delta={pctChange(m1?.connections, m0?.connections)} sub="vs semana anterior" demo={m1?.origin === "demo"} definition="Total de conexões no fechamento da semana (registro manual)." />
        <Stat label="Visualizações do perfil" value={fmtNum(m1?.profileViews)} delta={pctChange(m1?.profileViews, m0?.profileViews)} sub="semana" demo={m1?.origin === "demo"} />
        <Stat label="Impressões" value={fmtNum(m1?.impressions)} delta={pctChange(m1?.impressions, m0?.impressions)} sub="semana" demo={m1?.origin === "demo"} />
        <Stat label="Taxa de interação" value={rate(m1) === null ? "—" : `${rate(m1)!.toFixed(1)}%`} delta={pctChange(rate(m1), rate(m0))} sub="interações ÷ impressões" demo={m1?.origin === "demo"} />
      </div>

      {/* Tarefas da semana */}
      <Card className="mt-4">
        <CardHeader eyebrow={`Semana de ${fmtDate(wk, { day: "2-digit", month: "short" })}`} title="Tarefas sugeridas"
          description="Geradas pelas regras do NEXO a partir dos seus dados. Marque como concluída ou descarte."
          action={<Button size="sm" variant="subtle" onClick={genTasks}><RotateCcw className="h-3.5 w-3.5" />Gerar tarefas da semana</Button>} />
        <CardBody>
          {tasks.length ? (
            <ul className="divide-y divide-paper-line">
              {tasks.map((tk) => (
                <li key={tk.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
                  <div className={cn("min-w-0 flex-1", tk.status !== "pendente" && "opacity-50")}>
                    <div className={cn("text-sm font-medium text-ink", tk.status === "concluida" && "line-through")}>{tk.title}</div>
                    <div className="text-xs text-ink-mute">{tk.why}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {tk.origin === "demo" && <OriginBadge origin="demo" />}
                    <Button size="sm" variant={tk.status === "concluida" ? "green" : "outline"} onClick={() => setTask(tk.id, tk.status === "concluida" ? "pendente" : "concluida")}><Check className="h-3.5 w-3.5" />{tk.status === "concluida" ? "Concluída" : "Concluir"}</Button>
                    <Button size="sm" variant={tk.status === "descartada" ? "subtle" : "ghost"} onClick={() => setTask(tk.id, tk.status === "descartada" ? "pendente" : "descartada")} title="Descartar"><X className="h-3.5 w-3.5" /></Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : <Empty title="Nenhuma tarefa nesta semana" action={<Button size="sm" onClick={genTasks}>Gerar agora</Button>}>O NEXO cria até 7 tarefas priorizadas com justificativa.</Empty>}
        </CardBody>
      </Card>

      {/* Grade de módulos */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MiniList title="Publicações da semana" icon={<PenLine className="h-4 w-4" />} href="/conteudo?tab=calendario"
          empty="Nada agendado para esta semana." items={weekPosts.map((x) => ({ id: x.id, title: x.title, meta: `${fmtShort(x.scheduledDate!)} · ${POST_STATUS[x.status]}`, demo: x.origin === "demo" }))} />
        <MiniList title="Próximas ações de networking" icon={<Users className="h-4 w-4" />} href="/networking"
          empty="Nenhum próximo passo agendado." items={nextContacts.map((c) => ({ id: c.id, title: `${c.name} — ${c.nextStep || "próximo passo"}`, meta: `${c.nextStepDate! < t ? `Atrasado ${daysBetween(c.nextStepDate!, t)}d` : fmtShort(c.nextStepDate!)} · ${c.company}`, demo: c.origin === "demo", alert: c.nextStepDate! < t }))} />
        <MiniList title="Vagas com maior compatibilidade" icon={<Briefcase className="h-4 w-4" />} href="/vagas"
          empty="Cadastre vagas para calcular compatibilidade." items={topJobs.map(({ j, f }) => ({ id: j.id, title: j.title, meta: `${j.company} · ${j.city}`, value: f.total ?? "—", demo: j.origin === "demo" }))} />
        <MiniList title="Competências prioritárias" icon={<GraduationCap className="h-4 w-4" />} href="/carreira"
          empty="Sem lacunas nas vagas registradas." items={gaps.map((g) => ({ id: g.skill, title: g.skill, meta: `Nível ${g.level}/5 · em ${g.count} vaga(s)`, demo: d.jobs.some((j) => j.origin === "demo") }))} />
        <MiniList title="Marcas com maior alinhamento" icon={<Building2 className="h-4 w-4" />} href="/marcas"
          empty="Cadastre empresas de interesse." items={brands.map(({ c, f }) => ({ id: c.id, href: `/marcas/${c.id}`, title: c.name, meta: f.partial ? "Análise parcial" : c.sector, value: f.total === null ? "—" : `${f.total}%`, demo: c.origin === "demo" }))} />
        <MiniList title="Alertas e movimentos" icon={<Bell className="h-4 w-4" />} href="/marcas"
          empty="Sem movimentos registrados nos dossiês." items={alerts.map((a) => ({ id: a.id + a.company, title: a.what, meta: `${a.company} · ${a.kind === "confirmada" ? "confirmada" : a.kind === "tendencia" ? "tendência" : "hipótese"}`, demo: a.origin === "demo" }))} />
      </div>

      <p className="mt-6 flex items-center gap-2 text-[11px] text-ink-mute"><CalendarClock className="h-3.5 w-3.5" />Perfil atualizado em {fmtDate(p.updatedAt)} · recomendações recalculadas a cada alteração · <Link href="/metodologia" className="underline">como calculamos</Link></p>
    </>
  );
}

function mergeSeries(...lists: { date: string; [k: string]: unknown }[][]) {
  const map = new Map<string, Record<string, unknown>>();
  for (const l of lists) for (const r of l) map.set(r.date, { ...(map.get(r.date) ?? {}), ...r });
  return Array.from(map.values()).sort((a, b) => String(a.date).localeCompare(String(b.date))).map((r) => ({ ...r, label: fmtShort(String(r.date)) }));
}

function MiniList({ title, icon, href, items, empty }: { title: string; icon: React.ReactNode; href: string; empty: string; items: { id: string; title: string; meta: string; value?: React.ReactNode; demo?: boolean; alert?: boolean; href?: string }[] }) {
  return (
    <Card>
      <CardHeader title={<span className="flex items-center gap-2"><span className="text-pink">{icon}</span>{title}</span>} action={<Link href={href} className="text-ink-mute hover:text-pink" aria-label="Abrir"><ArrowUpRight className="h-4 w-4" /></Link>} />
      <CardBody className="pt-3">
        {items.length ? (
          <ul className="space-y-1">
            {items.map((it) => {
              const inner = (
                <div className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-paper">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-ink">{it.title}</div>
                    <div className={cn("truncate text-[11px]", it.alert ? "text-pink-700" : "text-ink-mute")}>{it.meta}</div>
                  </div>
                  {it.demo && <Badge tone="pink" className="px-1.5">DEMO</Badge>}
                  {it.value !== undefined && <span className="font-display text-sm font-semibold text-green">{it.value}</span>}
                </div>
              );
              return <li key={it.id}>{it.href ? <Link href={it.href}>{inner}</Link> : inner}</li>;
            })}
          </ul>
        ) : <p className="py-4 text-center text-xs text-ink-mute">{empty}</p>}
      </CardBody>
    </Card>
  );
}
