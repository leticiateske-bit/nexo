"use client";

import { Suspense, useState } from "react";
import { Check, ExternalLink, GraduationCap, Plus, Target, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useDerived } from "@/lib/hooks";
import { useTab } from "@/lib/use-tab";
import { marketGaps, roleMatrix, roleReadiness } from "@/lib/scoring/career";
import { COURSE_TYPE, SKILL_LEVEL } from "@/lib/labels";
import type { Course, CourseType, PlanItem, RoleProfile } from "@/lib/types";
import { cn, fmtDate, nowISO, termMatch, uid } from "@/lib/utils";
import { Badge, Button, Card, CardBody, CardHeader, Dialog, Empty, Field, Input, Progress, Select, Tabs, Textarea } from "@/components/ui";
import { MethodNote, OriginBadge, PageHeader } from "@/components/nexo";
import { BarsChart } from "@/components/charts";

const TABS = ["cargos", "lacunas", "capacitacoes", "plano"] as const;
type Tab = (typeof TABS)[number];

function Inner() {
  const [tab, setTab] = useTab<Tab>("cargos", TABS);
  const { data } = useStore();
  return (
    <>
      <PageHeader index="05" title="Carreira e competências" description="Cargos tratados como hipóteses. A matriz compara seu nível atual com uma referência NEXO por cargo e com a demanda real das vagas que você acompanha." />
      <Tabs className="mb-5" value={tab} onChange={setTab} items={[
        { value: "cargos", label: "Cargos-hipótese", count: data.roles.length }, { value: "lacunas", label: "Lacunas nas vagas" },
        { value: "capacitacoes", label: "Capacitações", count: data.courses.length }, { value: "plano", label: "Plano 30/60/90" },
      ]} />
      {tab === "cargos" && <Roles />}
      {tab === "lacunas" && <Gaps />}
      {tab === "capacitacoes" && <Courses />}
      {tab === "plano" && <Plan />}
    </>
  );
}

function Roles() {
  const { data, add, remove, toast } = useStore();
  const d = useDerived();
  const p = data.profile;
  const ranked = data.roles.map((r) => ({ r, rows: roleMatrix(r, p, d.jobs) })).map((x) => ({ ...x, ready: roleReadiness(x.rows) })).sort((a, b) => b.ready - a.ready);
  const [sel, setSel] = useState<string | undefined>(ranked[0]?.r.id);
  const [adding, setAdding] = useState(false);
  const [nr, setNr] = useState({ title: "", reqs: "" });
  const cur = ranked.find((x) => x.r.id === sel) ?? ranked[0];

  const addRole = () => {
    const reqs = nr.reqs.split(",").map((s) => s.trim()).filter(Boolean).map((s) => { const [skill, lv] = s.split(":"); return { skill: skill.trim(), required: Math.min(5, Math.max(1, Number(lv) || 3)) }; });
    if (!nr.title || !reqs.length) return toast("Informe cargo e ao menos uma competência.", "warn");
    const t = nowISO();
    const role: RoleProfile = { id: uid("role"), origin: "user", createdAt: t, updatedAt: t, title: nr.title, description: "Cargo adicionado por você.", requirements: reqs, tools: [], evidenceToShow: [], paths: [], salaryNote: "Sem fonte salarial registrada." };
    add("roles", role); setSel(role.id); setAdding(false); setNr({ title: "", reqs: "" }); toast("Cargo adicionado");
  };

  if (!cur) return <Empty title="Nenhum cargo cadastrado" action={<Button onClick={() => setAdding(true)}>Adicionar cargo</Button>} />;
  const demonstrated = cur.rows.filter((r) => r.gap === 0);
  const transferable = cur.rows.filter((r) => r.gap === 1);
  const missing = cur.rows.filter((r) => r.gap >= 2);
  const courses = data.courses.filter((c) => cur.rows.some((r) => r.gap > 0 && termMatch(r.skill, c.skill)));
  const isTarget = p.targetRoles.some((t) => termMatch(t, cur.r.title));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
      <Card>
        <CardHeader title="Aderência por cargo" description="Nível atual ÷ nível de referência" action={<Button size="icon" variant="subtle" onClick={() => setAdding(true)} aria-label="Adicionar cargo"><Plus className="h-4 w-4" /></Button>} />
        <CardBody className="space-y-1 pt-3">
          {ranked.map(({ r, ready }) => (
            <button key={r.id} onClick={() => setSel(r.id)} className={cn("w-full rounded-xl px-3 py-2 text-left transition", sel === r.id || (!sel && r.id === cur.r.id) ? "bg-green text-paper" : "hover:bg-paper")}>
              <div className="flex items-center justify-between gap-2 text-[13px]"><span className="truncate">{r.title}</span><span className="font-display font-semibold">{ready}%</span></div>
              <Progress className="mt-1.5" value={ready} tone={sel === r.id ? "pink" : "green"} />
            </button>
          ))}
        </CardBody>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader eyebrow={<span className="flex items-center gap-2">Cargo-hipótese <OriginBadge origin={cur.r.origin} /></span>} title={cur.r.title} description={cur.r.description}
            action={<div className="flex gap-1">{isTarget && <Badge tone="solidPink"><Target className="h-3 w-3" />Cargo-alvo</Badge>}{cur.r.origin === "user" && <Button size="icon" variant="danger" onClick={() => { remove("roles", cur.r.id); setSel(undefined); }} aria-label="Excluir"><Trash2 className="h-4 w-4" /></Button>}</div>} />
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-xs">
                <thead className="text-left text-ink-mute"><tr><th className="py-2">Competência</th><th>Atual</th><th>Exigido*</th><th>Lacuna</th><th>Prioridade</th><th>Demanda nas vagas</th><th>Evidência</th></tr></thead>
                <tbody className="divide-y divide-paper-line">
                  {cur.rows.map((r) => (
                    <tr key={r.skill}>
                      <td className="py-2 font-medium text-ink">{r.skill}</td>
                      <td><LevelDots value={r.current} /></td>
                      <td><LevelDots value={r.required} pink /></td>
                      <td className={cn("font-semibold", r.gap ? "text-pink-700" : "text-green-600")}>{r.gap ? `−${r.gap}` : "✓"}</td>
                      <td><Badge tone={r.priority === "alta" ? "solidPink" : r.priority === "media" ? "pink" : r.priority === "ok" ? "green" : "outline"}>{r.priority === "ok" ? "atendida" : r.priority}</Badge></td>
                      <td>{r.demand ? `${r.demand} vaga(s)` : "—"}</td>
                      <td className="max-w-[200px] truncate text-ink-mute" title={r.evidence}>{r.evidence || <span className="text-pink-700">sem evidência</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[10px] text-ink-mute">*Nível exigido = referência interna do NEXO para o cargo (0–5), não um padrão de mercado. Ajuste com base nas vagas reais. Seus níveis são editáveis em Perfil.</p>
          </CardBody>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SkillList title="Já demonstradas" tone="green" items={demonstrated.map((r) => r.skill)} empty="Nenhuma no nível de referência." />
          <SkillList title="Transferíveis (falta 1 nível)" tone="amber" items={transferable.map((r) => r.skill)} empty="—" />
          <SkillList title="Ausentes ou não comprovadas" tone="pink" items={missing.map((r) => r.skill)} empty="Nenhuma lacuna grande." />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card><CardHeader title="Ferramentas e softwares" /><CardBody className="flex flex-wrap gap-1">{cur.r.tools.length ? cur.r.tools.map((t) => <Badge key={t} tone="outline">{t}</Badge>) : <span className="text-xs text-ink-mute">—</span>}</CardBody></Card>
          <Card><CardHeader title="Evidencie no currículo e LinkedIn" /><CardBody><ul className="list-inside list-disc space-y-0.5 text-xs text-ink-soft">{cur.r.evidenceToShow.map((e) => <li key={e}>{e}</li>)}{!cur.r.evidenceToShow.length && <li>—</li>}</ul></CardBody></Card>
          <Card><CardHeader title="Caminhos de evolução" /><CardBody className="text-xs text-ink-soft">{cur.r.paths.join(" → ") || "—"}</CardBody></Card>
          <Card><CardHeader title="Faixa salarial" /><CardBody className="text-xs text-ink-soft">{cur.r.salaryNote}</CardBody></Card>
        </div>

        <Card>
          <CardHeader title="Capacitações prioritárias para este cargo" />
          <CardBody>{courses.length ? <div className="grid grid-cols-1 gap-2 md:grid-cols-2">{courses.map((c) => <CourseMini key={c.id} c={c} />)}</div> : <p className="text-xs text-ink-mute">Nenhuma capacitação cadastrada cobre as lacunas deste cargo.</p>}</CardBody>
        </Card>
      </div>

      <Dialog open={adding} onClose={() => setAdding(false)} title="Adicionar cargo-hipótese" footer={<Button onClick={addRole}>Adicionar</Button>}>
        <div className="space-y-3">
          <Field label="Cargo"><Input value={nr.title} onChange={(e) => setNr({ ...nr, title: e.target.value })} /></Field>
          <Field label="Competências e nível exigido" hint="formato: competência:nível, separadas por vírgula"><Textarea value={nr.reqs} placeholder="Gestão de facilities:4, Power BI:3, Excel avançado:4" onChange={(e) => setNr({ ...nr, reqs: e.target.value })} /></Field>
        </div>
      </Dialog>
    </div>
  );
}

function LevelDots({ value, pink }: { value: number; pink?: boolean }) {
  return <span className="inline-flex gap-0.5" title={`${value}/5 · ${SKILL_LEVEL[value]}`}>{[1, 2, 3, 4, 5].map((i) => <span key={i} className={cn("h-2 w-2 rounded-full", i <= value ? (pink ? "bg-pink" : "bg-green-600") : "bg-paper-deep")} />)}</span>;
}

function SkillList({ title, items, tone, empty }: { title: string; items: string[]; tone: "green" | "amber" | "pink"; empty: string }) {
  return (
    <Card>
      <CardHeader title={title} />
      <CardBody className="flex flex-wrap gap-1">{items.length ? items.map((s) => <Badge key={s} tone={tone}>{s}</Badge>) : <span className="text-xs text-ink-mute">{empty}</span>}</CardBody>
    </Card>
  );
}

function Gaps() {
  const { data } = useStore();
  const d = useDerived();
  const gaps = marketGaps(data.profile, d.jobs);
  const demo = d.jobs.some((j) => j.origin === "demo");
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader title="Competências mais pedidas nas vagas acompanhadas" description={`${d.jobs.filter((j) => j.status !== "descartada").length} vagas · exclui descartadas`} action={demo && <OriginBadge origin="demo" />} />
        <CardBody>{gaps.length ? <BarsChart layout="vertical" height={Math.max(220, gaps.slice(0, 12).length * 28)} x="skill" series={[{ key: "count", name: "Nº de vagas" }]} data={gaps.slice(0, 12)} /> : <Empty title="Sem vagas registradas" />}</CardBody>
      </Card>
      <Card>
        <CardHeader title="Demanda × seu nível" description="Prioridade = frequência nas vagas com nível abaixo de 3 (intermediário)" />
        <CardBody>
          <table className="w-full text-xs">
            <thead className="text-left text-ink-mute"><tr><th className="py-2">Competência</th><th>Vagas</th><th>Seu nível</th><th>Situação</th></tr></thead>
            <tbody className="divide-y divide-paper-line">
              {gaps.map((g) => (
                <tr key={g.skill}><td className="py-2 font-medium">{g.skill}</td><td>{g.count}</td><td><LevelDots value={g.level} /></td>
                  <td>{g.level >= 3 ? <Badge tone="green">atende</Badge> : g.count >= 2 ? <Badge tone="solidPink">lacuna prioritária</Badge> : <Badge tone="pink">lacuna</Badge>}</td></tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}

function CourseMini({ c }: { c: Course }) {
  return (
    <div className="rounded-xl border border-paper-line bg-white p-3">
      <div className="flex items-center gap-1"><Badge tone="green">{COURSE_TYPE[c.type]}</Badge><Badge tone={c.priority === "alta" ? "solidPink" : "outline"}>prioridade {c.priority}</Badge></div>
      <div className="mt-1.5 text-[13px] font-medium text-ink">{c.name}</div>
      <div className="text-[11px] text-ink-mute">{c.institution} · {c.skill}</div>
    </div>
  );
}

function Courses() {
  const { data, update, add, remove, toast } = useStore();
  const [type, setType] = useState<CourseType | "all">("all");
  const [adding, setAdding] = useState<Course | null>(null);
  const gaps = marketGaps(data.profile, data.jobs);
  const list = data.courses.filter((c) => type === "all" || c.type === type).sort((a, b) => ["alta", "media", "baixa"].indexOf(a.priority) - ["alta", "media", "baixa"].indexOf(b.priority));
  const blank = (): Course => { const t = nowISO(); return { id: uid("crs"), origin: "user", createdAt: t, updatedAt: t, name: "", institution: "", skill: "", type: "pratico", relevance: "", prerequisites: "", duration: "", cost: "", mode: "", url: "", source: "", verifiedAt: null, benefit: "", priority: "media", status: "sugerido" }; };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Tabs value={type} onChange={setType} items={[{ value: "all", label: "Todas" }, ...(Object.keys(COURSE_TYPE) as CourseType[]).map((k) => ({ value: k, label: COURSE_TYPE[k] }))]} />
        <Button className="ml-auto" onClick={() => setAdding(blank())}><Plus className="h-4 w-4" />Adicionar capacitação</Button>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {list.map((c) => {
          const g = gaps.find((x) => termMatch(x.skill, c.skill));
          return (
            <Card key={c.id} tone="white"><CardBody className="pt-5">
              <div className="flex flex-wrap items-center gap-1"><Badge tone="green">{COURSE_TYPE[c.type]}</Badge><Badge tone={c.priority === "alta" ? "solidPink" : c.priority === "media" ? "pink" : "outline"}>prioridade {c.priority}</Badge><OriginBadge origin={c.origin} /></div>
              <h3 className="mt-2 font-display text-[15px] font-semibold leading-snug text-green">{c.name}</h3>
              <div className="text-xs text-ink-soft">{c.institution}</div>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                <dt className="text-ink-mute">Competência</dt><dd>{c.skill}{g && <span className="text-ink-mute"> · em {g.count} vaga(s)</span>}</dd>
                <dt className="text-ink-mute">Pré-requisitos</dt><dd>{c.prerequisites || "—"}</dd>
                <dt className="text-ink-mute">Duração</dt><dd>{c.duration || "—"}</dd>
                <dt className="text-ink-mute">Custo</dt><dd>{c.cost || "—"}</dd>
                <dt className="text-ink-mute">Modalidade</dt><dd>{c.mode || "—"}</dd>
              </dl>
              <p className="mt-3 text-xs text-ink-soft"><strong className="text-ink">Relevância:</strong> {c.relevance}</p>
              <p className="mt-1 text-xs text-ink-soft"><strong className="text-ink">Benefício esperado:</strong> {c.benefit}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-paper-line pt-3">
                <Select className="h-8 w-auto text-xs" value={c.status} onChange={(e) => { update("courses", c.id, { status: e.target.value as Course["status"] }); toast("Status atualizado"); }}>
                  {["sugerido", "planejado", "em_andamento", "concluido", "descartado"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                </Select>
                {c.url ? <a href={c.url} target="_blank" rel="noreferrer"><Button size="sm" variant="outline"><ExternalLink className="h-3.5 w-3.5" />Site oficial</Button></a> : <Badge tone="amber">link pendente</Badge>}
                {c.origin === "user" && <Button size="icon" variant="danger" className="ml-auto" onClick={() => remove("courses", c.id)} aria-label="Excluir"><Trash2 className="h-4 w-4" /></Button>}
              </div>
              <div className="mt-2 text-[10px] text-ink-mute">Fonte: {c.source || "—"} · {c.verifiedAt ? `verificado em ${fmtDate(c.verifiedAt)}` : "não verificado — confirme custo, carga e requisitos no site oficial"}</div>
            </CardBody></Card>
          );
        })}
      </div>
      <MethodNote title="Critério das recomendações">
        <p>Uma capacitação só é priorizada quando cobre uma lacuna que aparece nas vagas acompanhadas ou em uma competência que você escolheu desenvolver. Popularidade não é critério.</p>
        <p>As referências NEXO apontam instituições reais, mas preço, carga horária e requisitos <strong>não foram verificados</strong> nesta versão. Ao confirmar, edite e registre a data.</p>
      </MethodNote>
      <Dialog open={!!adding} onClose={() => setAdding(null)} title="Nova capacitação" footer={<Button onClick={() => { if (!adding!.name) return toast("Informe o nome.", "warn"); add("courses", adding!); setAdding(null); toast("Capacitação adicionada"); }}>Salvar</Button>}>
        {adding && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {([["name", "Nome"], ["institution", "Instituição"], ["skill", "Competência desenvolvida"], ["duration", "Carga horária / duração"], ["cost", "Custo"], ["mode", "Modalidade"], ["url", "Link oficial"], ["source", "Fonte"], ["prerequisites", "Pré-requisitos"]] as const).map(([k, l]) => (
              <Field key={k} label={l}><Input value={adding[k]} onChange={(e) => setAdding({ ...adding, [k]: e.target.value })} /></Field>
            ))}
            <Field label="Data da verificação"><Input type="date" value={adding.verifiedAt ?? ""} onChange={(e) => setAdding({ ...adding, verifiedAt: e.target.value || null })} /></Field>
            <Field label="Tipo"><Select value={adding.type} onChange={(e) => setAdding({ ...adding, type: e.target.value as CourseType })}>{Object.entries(COURSE_TYPE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
            <Field label="Prioridade"><Select value={adding.priority} onChange={(e) => setAdding({ ...adding, priority: e.target.value as Course["priority"] })}>{["alta", "media", "baixa"].map((k) => <option key={k}>{k}</option>)}</Select></Field>
            <Field label="Relevância para meus objetivos" className="sm:col-span-2"><Textarea className="min-h-[60px]" value={adding.relevance} onChange={(e) => setAdding({ ...adding, relevance: e.target.value })} /></Field>
            <Field label="Benefício esperado" className="sm:col-span-2"><Input value={adding.benefit} onChange={(e) => setAdding({ ...adding, benefit: e.target.value })} /></Field>
          </div>
        )}
      </Dialog>
    </div>
  );
}

function Plan() {
  const { view, data, add, update, remove, toast } = useStore();
  const items = view("plan");
  const [nt, setNt] = useState({ title: "", hours: "2", phase: "30", skill: "" });
  const hoursAvail = data.profile.availabilityHoursWeek;
  const addItem = () => {
    if (!nt.title) return toast("Descreva a ação.", "warn");
    const t = nowISO();
    const it: PlanItem = { id: uid("pl"), origin: "user", createdAt: t, updatedAt: t, title: nt.title, hours: Number(nt.hours) || 1, phase: Number(nt.phase) as 30 | 60 | 90, skill: nt.skill, done: false };
    add("plan", it); setNt({ ...nt, title: "", skill: "" }); toast("Ação adicionada ao plano");
  };
  return (
    <div className="space-y-4">
      <Card>
        <CardBody className="flex flex-col gap-3 pt-5 md:flex-row md:items-end">
          <Field label="Nova ação" className="flex-1"><Input value={nt.title} onChange={(e) => setNt({ ...nt, title: e.target.value })} placeholder="Ex.: concluir módulo 1 de Power BI" /></Field>
          <Field label="Competência"><Input value={nt.skill} onChange={(e) => setNt({ ...nt, skill: e.target.value })} /></Field>
          <Field label="Horas"><Input type="number" className="w-20" value={nt.hours} onChange={(e) => setNt({ ...nt, hours: e.target.value })} /></Field>
          <Field label="Fase"><Select value={nt.phase} onChange={(e) => setNt({ ...nt, phase: e.target.value })}><option value="30">30 dias</option><option value="60">60 dias</option><option value="90">90 dias</option></Select></Field>
          <Button onClick={addItem}><Plus className="h-4 w-4" />Adicionar</Button>
        </CardBody>
      </Card>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {([30, 60, 90] as const).map((ph) => {
          const its = items.filter((i) => i.phase === ph);
          const hours = its.reduce((a, i) => a + i.hours, 0);
          const capacity = Math.round(hoursAvail * (30 / 7));
          return (
            <Card key={ph} tone={ph === 30 ? "green" : "paper"}>
              <CardHeader eyebrow={`Fase ${ph === 30 ? "1" : ph === 60 ? "2" : "3"}`} title={`${ph} dias`} description={`${hours}h planejadas · capacidade ~${capacity}h (${hoursAvail}h/semana)`}
                action={hours > capacity && <Badge tone="solidPink">acima da disponibilidade</Badge>} />
              <CardBody className="space-y-1.5">
                {its.length ? its.map((i) => (
                  <div key={i.id} className={cn("flex items-start gap-2 rounded-xl px-2.5 py-2", ph === 30 ? "bg-white/[.06]" : "bg-white")}>
                    <button onClick={() => update("plan", i.id, { done: !i.done })} className={cn("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border", i.done ? "border-pink bg-pink text-white" : "border-current opacity-60")} aria-label="Concluir">{i.done && <Check className="h-3 w-3" />}</button>
                    <div className="min-w-0 flex-1">
                      <div className={cn("text-[13px]", i.done && "line-through opacity-60")}>{i.title}</div>
                      <div className="text-[10px] opacity-60">{i.hours}h · {i.skill || "geral"}{i.origin === "demo" && " · demo"}</div>
                    </div>
                    <button onClick={() => remove("plan", i.id)} className="opacity-40 hover:opacity-100" aria-label="Excluir"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                )) : <p className="text-xs opacity-60">Sem ações nesta fase.</p>}
              </CardBody>
            </Card>
          );
        })}
      </div>
      <p className="flex items-center gap-2 text-[11px] text-ink-mute"><GraduationCap className="h-3.5 w-3.5" />Ajuste a disponibilidade semanal em Perfil → Metas. O plano sinaliza quando as horas excedem sua capacidade.</p>
    </div>
  );
}

export default function Page() { return <Suspense><Inner /></Suspense>; }
