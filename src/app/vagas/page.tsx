"use client";

import { Suspense, useMemo, useState } from "react";
import { AlertTriangle, ExternalLink, GitCompare, Kanban, List, Plus, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useDerived } from "@/lib/hooks";
import { useTab } from "@/lib/use-tab";
import { JOB_STATUS, JOB_STATUS_ORDER, WORK_MODE } from "@/lib/labels";
import type { ContractType, Job, JobStatus, JobWeights, Seniority, WorkMode } from "@/lib/types";
import type { JobFit } from "@/lib/scoring/job-fit";
import { cn, daysBetween, fmtDate, fmtMoney, nowISO, termMatch, todayISO, uid } from "@/lib/utils";
import { Badge, Button, Card, CardBody, CardHeader, Dialog, Empty, Field, Input, Select, Tabs, TagInput, Textarea } from "@/components/ui";
import { ConfidenceBadge, DimensionBars, MethodNote, OriginBadge, PageHeader, SourceLine } from "@/components/nexo";

const TABS = ["lista", "pipeline", "comparar"] as const;
type Tab = (typeof TABS)[number];

const blank = (): Job => {
  const t = nowISO();
  return { id: uid("job"), origin: "user", createdAt: t, updatedAt: t, title: "", company: "", area: "", city: "", mode: "hibrido", contract: null, seniority: null, salaryMin: null, salaryMax: null, salarySource: "", publishedAt: null, requirements: [], skills: [], education: "", url: "", source: "", verifiedAt: todayISO(), activeConfirmed: false, status: "interessada", notes: "", nextStep: "", history: [{ date: todayISO(), status: "interessada", note: "Vaga registrada" }] };
};

function Inner() {
  const [tab, setTab] = useTab<Tab>("lista", TABS);
  const { data, add, update, toast } = useStore();
  const d = useDerived();
  const [editing, setEditing] = useState<Job | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [weightsOpen, setWeightsOpen] = useState(false);
  const [compare, setCompare] = useState<string[]>([]);

  const save = (j: Job) => {
    if (!j.title || !j.company) return toast("Cargo e empresa são obrigatórios.", "warn");
    if (data.jobs.some((x) => x.id === j.id)) update("jobs", j.id, j); else add("jobs", j);
    toast("Vaga salva"); setEditing(null);
  };
  const setStatus = (j: Job, s: JobStatus) => { update("jobs", j.id, { status: s, history: [...j.history, { date: todayISO(), status: s, note: "" }] }); toast(`Status: ${JOB_STATUS[s]}`); };
  const toggleCompare = (id: string) => setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length >= 3 ? [...c.slice(1), id] : [...c, id]));

  const detailJob = d.jobs.find((j) => j.id === detail) ?? null;
  return (
    <>
      <PageHeader index="06" title="Vagas e oportunidades" description="Registre vagas a partir do link original. A compatibilidade mede aderência ao seu perfil — não é probabilidade de contratação."
        actions={<><Button variant="outline" onClick={() => setWeightsOpen(true)}><SlidersHorizontal className="h-4 w-4" />Pesos do índice</Button><Button onClick={() => setEditing(blank())}><Plus className="h-4 w-4" />Registrar vaga</Button></>} />
      <Tabs className="mb-5" value={tab} onChange={setTab} items={[
        { value: "lista", label: <span className="flex items-center gap-1.5"><List className="h-3.5 w-3.5" />Buscador</span>, count: d.jobs.length },
        { value: "pipeline", label: <span className="flex items-center gap-1.5"><Kanban className="h-3.5 w-3.5" />Candidaturas</span> },
        { value: "comparar", label: <span className="flex items-center gap-1.5"><GitCompare className="h-3.5 w-3.5" />Comparar</span>, count: compare.length },
      ]} />
      {tab === "lista" && <JobList onOpen={setDetail} compare={compare} toggleCompare={toggleCompare} />}
      {tab === "pipeline" && <Pipeline onOpen={setDetail} setStatus={setStatus} />}
      {tab === "comparar" && <Compare ids={compare} onRemove={toggleCompare} />}

      <JobDetail job={detailJob} fit={detailJob ? d.jobFits.get(detailJob.id)! : null} onClose={() => setDetail(null)} onEdit={(j) => { setDetail(null); setEditing(j); }} setStatus={setStatus} />
      <JobDialog job={editing} onClose={() => setEditing(null)} onSave={save} />
      <WeightsDialog open={weightsOpen} onClose={() => setWeightsOpen(false)} />
    </>
  );
}

function JobList({ onOpen, compare, toggleCompare }: { onOpen: (id: string) => void; compare: string[]; toggleCompare: (id: string) => void }) {
  const { data } = useStore();
  const d = useDerived();
  const p = data.profile;
  const [f, setF] = useState({ q: "", area: "all", city: "all", mode: "all", contract: "all", seniority: "all", skill: "", company: "all", days: "all", salary: "", onlyPref: false, minFit: "0" });
  const areas = Array.from(new Set(d.jobs.map((j) => j.area).filter(Boolean)));
  const cities = Array.from(new Set(d.jobs.map((j) => j.city).filter(Boolean)));
  const companies = Array.from(new Set(d.jobs.map((j) => j.company)));
  const targetCos = [...p.companiesOfInterest, ...d.companies.map((c) => c.name)];

  const list = useMemo(() => d.jobs.filter((j) => {
    const fit = d.jobFits.get(j.id)!;
    if (f.q && !`${j.title} ${j.company} ${j.requirements.join(" ")}`.toLowerCase().includes(f.q.toLowerCase())) return false;
    if (f.area !== "all" && j.area !== f.area) return false;
    if (f.city !== "all" && j.city !== f.city) return false;
    if (f.mode !== "all" && j.mode !== f.mode) return false;
    if (f.contract !== "all" && j.contract !== f.contract) return false;
    if (f.seniority !== "all" && j.seniority !== f.seniority) return false;
    if (f.skill && !j.skills.some((s) => termMatch(s, f.skill))) return false;
    if (f.company === "__targets" && !targetCos.some((t) => termMatch(t, j.company))) return false;
    if (f.company !== "all" && f.company !== "__targets" && j.company !== f.company) return false;
    if (f.days !== "all" && (!j.publishedAt || daysBetween(j.publishedAt, todayISO()) > Number(f.days))) return false;
    if (f.salary && !(j.salaryMax && j.salaryMax >= Number(f.salary))) return false;
    if (f.onlyPref && !(j.mode === "remoto" || p.cities.some((c) => termMatch(c, j.city)))) return false;
    if ((fit.total ?? 0) < Number(f.minFit)) return false;
    return true;
  }).map((j) => ({ j, fit: d.jobFits.get(j.id)! })).sort((a, b) => {
    // Prioriza cidades preferidas e remoto, depois compatibilidade
    const pref = (x: Job) => (x.mode === "remoto" || p.cities.some((c) => termMatch(c, x.city)) ? 1 : 0);
    return pref(b.j) - pref(a.j) || (b.fit.total ?? 0) - (a.fit.total ?? 0);
  }), [d, f, p, targetCos]); // eslint-disable-line react-hooks/exhaustive-deps

  const s = (k: keyof typeof f, v: string | boolean) => setF({ ...f, [k]: v });
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[270px_1fr]">
      <Card className="h-fit xl:sticky xl:top-6">
        <CardHeader title="Filtros" action={<Button size="sm" variant="ghost" onClick={() => setF({ q: "", area: "all", city: "all", mode: "all", contract: "all", seniority: "all", skill: "", company: "all", days: "all", salary: "", onlyPref: false, minFit: "0" })}>Limpar</Button>} />
        <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <div className="relative sm:col-span-2 xl:col-span-1"><Search className="absolute left-3 top-3 h-4 w-4 text-ink-mute" /><Input className="pl-9" placeholder="Cargo, empresa, requisito" value={f.q} onChange={(e) => s("q", e.target.value)} /></div>
          <label className="flex items-center gap-2 text-xs text-ink-soft sm:col-span-2 xl:col-span-1"><input type="checkbox" checked={f.onlyPref} onChange={(e) => s("onlyPref", e.target.checked)} />Só {p.cities.join(", ")} e remoto</label>
          <Field label="Área profissional"><Select value={f.area} onChange={(e) => s("area", e.target.value)}><option value="all">Todas</option>{areas.map((a) => <option key={a}>{a}</option>)}</Select></Field>
          <Field label="Cidade"><Select value={f.city} onChange={(e) => s("city", e.target.value)}><option value="all">Todas</option>{cities.map((a) => <option key={a}>{a}</option>)}</Select></Field>
          <Field label="Modalidade"><Select value={f.mode} onChange={(e) => s("mode", e.target.value)}><option value="all">Todas</option>{Object.entries(WORK_MODE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
          <Field label="Contratação"><Select value={f.contract} onChange={(e) => s("contract", e.target.value)}><option value="all">Todas</option>{["CLT", "PJ", "Temporário", "Estágio", "Freelance"].map((a) => <option key={a}>{a}</option>)}</Select></Field>
          <Field label="Senioridade"><Select value={f.seniority} onChange={(e) => s("seniority", e.target.value)}><option value="all">Todas</option>{["Júnior", "Pleno", "Sênior", "Especialista", "Coordenação"].map((a) => <option key={a}>{a}</option>)}</Select></Field>
          <Field label="Empresa"><Select value={f.company} onChange={(e) => s("company", e.target.value)}><option value="all">Todas</option><option value="__targets">Somente empresas de interesse</option>{companies.map((a) => <option key={a}>{a}</option>)}</Select></Field>
          <Field label="Competência exigida"><Input value={f.skill} placeholder="Ex.: Power BI" onChange={(e) => s("skill", e.target.value)} /></Field>
          <Field label="Publicação"><Select value={f.days} onChange={(e) => s("days", e.target.value)}><option value="all">Qualquer data</option><option value="7">Últimos 7 dias</option><option value="15">Últimos 15 dias</option><option value="30">Últimos 30 dias</option></Select></Field>
          <Field label="Salário mínimo divulgado" hint="R$"><Input type="number" value={f.salary} onChange={(e) => s("salary", e.target.value)} /></Field>
          <Field label={`Compatibilidade mínima: ${f.minFit}`}><input type="range" min={0} max={100} step={5} className="w-full" value={f.minFit} onChange={(e) => s("minFit", e.target.value)} /></Field>
        </CardBody>
      </Card>

      <div className="space-y-3">
        <div className="text-xs text-ink-mute">{list.length} vaga(s) · ordenadas por preferência geográfica e compatibilidade</div>
        {list.length ? list.map(({ j, fit }) => (
          <Card key={j.id} tone="white" className="transition hover:border-green/30">
            <CardBody className="flex flex-col gap-4 pt-5 md:flex-row">
              <button onClick={() => onOpen(j.id)} className="flex h-[72px] w-[72px] shrink-0 flex-col items-center justify-center rounded-2xl bg-green text-paper">
                <span className="font-display text-2xl font-semibold leading-none">{fit.total ?? "—"}</span>
                <span className="mt-0.5 text-[9px] uppercase tracking-wider text-paper/60">compat.</span>
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => onOpen(j.id)} className="text-left font-display text-[15px] font-semibold text-green hover:text-pink">{j.title}</button>
                  <OriginBadge origin={j.origin} />
                  <Badge tone="outline">{JOB_STATUS[j.status]}</Badge>
                </div>
                <div className="text-xs text-ink-soft">{j.company} · {j.city} · {WORK_MODE[j.mode]}{j.contract && ` · ${j.contract}`}{j.seniority && ` · ${j.seniority}`}</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {fit.matched.slice(0, 4).map((s) => <Badge key={s} tone="green">✓ {s}</Badge>)}
                  {[...fit.partialSkills, ...fit.missing].slice(0, 3).map((s) => <Badge key={s} tone="pink">{s}</Badge>)}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-mute">
                  <span>Publicada: {fmtDate(j.publishedAt)}</span>
                  <span>Salário: {j.salaryMax ? `${fmtMoney(j.salaryMin)} – ${fmtMoney(j.salaryMax)}` : "não divulgado"}</span>
                  {!j.activeConfirmed && <span className="flex items-center gap-1 text-amber"><AlertTriangle className="h-3 w-3" />ativa não confirmada</span>}
                  <ConfidenceBadge confidence={fit.confidence} coverage={fit.coverage} />
                </div>
              </div>
              <div className="flex shrink-0 flex-row gap-1.5 md:flex-col">
                <Button size="sm" onClick={() => onOpen(j.id)}>Detalhes</Button>
                <Button size="sm" variant={compare.includes(j.id) ? "green" : "outline"} onClick={() => toggleCompare(j.id)}><GitCompare className="h-3.5 w-3.5" />{compare.includes(j.id) ? "Comparando" : "Comparar"}</Button>
              </div>
            </CardBody>
          </Card>
        )) : <Empty title="Nenhuma vaga com esses filtros">Registre vagas a partir de fontes oficiais (site da empresa, LinkedIn, portais) com o link original.</Empty>}
      </div>
    </div>
  );
}

function Pipeline({ onOpen, setStatus }: { onOpen: (id: string) => void; setStatus: (j: Job, s: JobStatus) => void }) {
  const d = useDerived();
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[1100px] grid-cols-7 gap-2">
          {JOB_STATUS_ORDER.map((s) => {
            const items = d.jobs.filter((j) => j.status === s);
            return (
              <div key={s} className={cn("rounded-2xl p-2", s === "entrevista" ? "bg-pink-50" : s === "descartada" || s === "encerrado" ? "bg-paper-deep/60" : "bg-paper-card")}
                onDragOver={(e) => e.preventDefault()} onDrop={(e) => { const id = e.dataTransfer.getData("text"); const j = d.jobs.find((x) => x.id === id); if (j && j.status !== s) setStatus(j, s); }}>
                <div className="mb-2 flex items-center justify-between px-1 text-[11px] font-semibold uppercase tracking-wider text-ink-soft"><span>{JOB_STATUS[s]}</span><span className="text-pink">{items.length}</span></div>
                <div className="min-h-[120px] space-y-1.5">
                  {items.map((j) => (
                    <div key={j.id} draggable onDragStart={(e) => e.dataTransfer.setData("text", j.id)} onClick={() => onOpen(j.id)}
                      className="cursor-grab rounded-xl border border-paper-line bg-white p-2.5 text-xs shadow-sm active:cursor-grabbing">
                      <div className="font-medium text-ink">{j.title}</div>
                      <div className="text-[11px] text-ink-mute">{j.company}</div>
                      <div className="mt-1 flex items-center justify-between"><span className="font-display font-semibold text-green">{d.jobFits.get(j.id)?.total ?? "—"}</span>{j.origin === "demo" && <Badge tone="pink" className="px-1">DEMO</Badge>}</div>
                      {j.nextStep && <div className="mt-1 text-[10px] text-pink-700">→ {j.nextStep}</div>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-[11px] text-ink-mute">Arraste os cartões entre colunas ou altere o status nos detalhes. Cada mudança fica registrada no histórico da vaga.</p>
    </div>
  );
}

function Compare({ ids, onRemove }: { ids: string[]; onRemove: (id: string) => void }) {
  const d = useDerived();
  const jobs = ids.map((id) => d.jobs.find((j) => j.id === id)).filter(Boolean) as Job[];
  if (!jobs.length) return <Empty icon={<GitCompare className="h-8 w-8" />} title="Selecione até 3 vagas">No buscador, use “Comparar” em cada vaga.</Empty>;
  const rows: [string, (j: Job, f: JobFit) => React.ReactNode][] = [
    ["Compatibilidade", (_, f) => <span className="font-display text-xl font-semibold text-green">{f.total ?? "—"}</span>],
    ["Confiança", (_, f) => <ConfidenceBadge confidence={f.confidence} coverage={f.coverage} />],
    ...f_dims(),
    ["Local / modalidade", (j) => `${j.city} · ${WORK_MODE[j.mode]}`],
    ["Salário", (j) => (j.salaryMax ? `${fmtMoney(j.salaryMin)} – ${fmtMoney(j.salaryMax)}` : "não divulgado")],
    ["Competências atendidas", (_, f) => f.matched.join(", ") || "—"],
    ["Lacunas", (_, f) => [...f.partialSkills, ...f.missing].join(", ") || "—"],
    ["Status", (j) => JOB_STATUS[j.status]],
  ];
  return (
    <Card><CardBody className="overflow-x-auto pt-5">
      <table className="w-full min-w-[640px] text-xs">
        <thead><tr><th className="w-40" />{jobs.map((j) => <th key={j.id} className="p-2 text-left align-top"><div className="font-display text-sm font-semibold text-green">{j.title}</div><div className="font-normal text-ink-mute">{j.company}</div><button className="mt-1 text-[11px] text-pink-700 underline" onClick={() => onRemove(j.id)}>remover</button></th>)}</tr></thead>
        <tbody className="divide-y divide-paper-line">{rows.map(([l, fn]) => <tr key={l}><td className="py-2.5 pr-2 font-medium text-ink-soft">{l}</td>{jobs.map((j) => <td key={j.id} className="p-2 align-top">{fn(j, d.jobFits.get(j.id)!)}</td>)}</tr>)}</tbody>
      </table>
    </CardBody></Card>
  );
  function f_dims(): [string, (j: Job, f: JobFit) => React.ReactNode][] {
    return ["skills", "experience", "education", "goals", "logistics"].map((k) => [
      ({ skills: "Competências", experience: "Experiência", education: "Formação/requisitos", goals: "Objetivos", logistics: "Local/salário/modalidade" } as Record<string, string>)[k],
      (_: Job, f: JobFit) => { const dm = f.dimensions.find((x) => x.key === k)!; return dm.score === null ? <span className="text-ink-mute">sem dados</span> : dm.score; },
    ]);
  }
}

function JobDetail({ job, fit, onClose, onEdit, setStatus }: { job: Job | null; fit: JobFit | null; onClose: () => void; onEdit: (j: Job) => void; setStatus: (j: Job, s: JobStatus) => void }) {
  const { update, remove, toast } = useStore();
  if (!job || !fit) return null;
  return (
    <Dialog open onClose={onClose} wide title={<span className="flex items-center gap-2">{job.title} <OriginBadge origin={job.origin} /></span>}
      footer={<>
        <Button variant="danger" className="mr-auto" onClick={() => { remove("jobs", job.id); toast("Vaga excluída", "info"); onClose(); }}><Trash2 className="h-4 w-4" />Excluir</Button>
        {job.url ? <a href={job.url} target="_blank" rel="noreferrer"><Button variant="outline"><ExternalLink className="h-4 w-4" />Vaga original</Button></a> : <Button variant="outline" disabled title={job.origin === "demo" ? "Vaga fictícia" : "Sem link"}><ExternalLink className="h-4 w-4" />Vaga original</Button>}
        <Button variant="outline" onClick={() => onEdit(job)}>Editar</Button>
      </>}>
      {job.origin === "demo" && <div className="mb-4 rounded-xl bg-pink-50 px-3 py-2 text-xs text-pink-700">Vaga fictícia para demonstração. Não existe e não deve receber candidatura.</div>}
      {!job.activeConfirmed && job.origin !== "demo" && <div className="mb-4 rounded-xl bg-amber-100 px-3 py-2 text-xs text-amber">Não confirmada como ativa. Verifique no link original antes de investir tempo na candidatura.</div>}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="font-display text-5xl font-semibold text-green">{fit.total ?? "—"}<span className="text-lg text-ink-mute">/100</span></div>
            <div className="space-y-1 text-xs text-ink-soft">
              <ConfidenceBadge confidence={fit.confidence} coverage={fit.coverage} />
              <p>Índice de compatibilidade NEXO. {fit.partial && "Parcial: critérios sem dados foram excluídos e os pesos redistribuídos."}</p>
              <p className="font-medium text-pink-700">Compatibilidade ≠ probabilidade de contratação.</p>
            </div>
          </div>
          <DimensionBars dims={fit.dimensions} />
        </div>
        <div className="space-y-3 text-xs">
          <div className="rounded-xl bg-paper p-3">
            <div className="grid grid-cols-2 gap-y-1.5">
              <span className="text-ink-mute">Empresa</span><span>{job.company}</span>
              <span className="text-ink-mute">Local</span><span>{job.city} · {WORK_MODE[job.mode]}</span>
              <span className="text-ink-mute">Contratação</span><span>{job.contract ?? "—"}</span>
              <span className="text-ink-mute">Senioridade</span><span>{job.seniority ?? "—"}</span>
              <span className="text-ink-mute">Publicação</span><span>{fmtDate(job.publishedAt)}</span>
              <span className="text-ink-mute">Salário</span><span>{job.salaryMax ? `${fmtMoney(job.salaryMin)} – ${fmtMoney(job.salaryMax)}` : "não divulgado"}</span>
            </div>
            {job.salarySource && <div className="mt-1 text-[10px] text-ink-mute">Fonte do salário: {job.salarySource}</div>}
          </div>
          <div><div className="mb-1 font-semibold text-ink">Requisitos principais</div><ul className="list-inside list-disc text-ink-soft">{job.requirements.map((r) => <li key={r}>{r}</li>)}{!job.requirements.length && <li>—</li>}</ul></div>
          <Field label="Status da candidatura"><Select value={job.status} onChange={(e) => setStatus(job, e.target.value as JobStatus)}>{JOB_STATUS_ORDER.map((s) => <option key={s} value={s}>{JOB_STATUS[s]}</option>)}</Select></Field>
          <Field label="Próximo passo"><Input value={job.nextStep} onChange={(e) => update("jobs", job.id, { nextStep: e.target.value })} /></Field>
          <Field label="Notas"><Textarea className="min-h-[60px]" value={job.notes} onChange={(e) => update("jobs", job.id, { notes: e.target.value })} /></Field>
          <div><div className="mb-1 font-semibold text-ink">Histórico</div><ul className="space-y-0.5 text-ink-soft">{job.history.slice().reverse().map((h, i) => <li key={i}>{fmtDate(h.date)} · {JOB_STATUS[h.status]} {h.note && `— ${h.note}`}</li>)}</ul></div>
          <SourceLine source={job.source || "—"} date={job.verifiedAt} url={job.url || undefined} />
        </div>
      </div>
    </Dialog>
  );
}

function JobDialog({ job, onClose, onSave }: { job: Job | null; onClose: () => void; onSave: (j: Job) => void }) {
  const [j, setJ] = useState<Job | null>(job);
  if (job && (!j || j.id !== job.id)) setJ(job);
  if (!job || !j) return null;
  const s = <K extends keyof Job>(k: K, v: Job[K]) => setJ({ ...j, [k]: v });
  const num = (v: string) => (v === "" ? null : Number(v));
  return (
    <Dialog open onClose={onClose} wide title={j.title ? `Editar: ${j.title}` : "Registrar vaga"} footer={<Button onClick={() => onSave(j)}>Salvar</Button>}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Cargo"><Input value={j.title} onChange={(e) => s("title", e.target.value)} /></Field>
        <Field label="Empresa"><Input value={j.company} onChange={(e) => s("company", e.target.value)} /></Field>
        <Field label="Área profissional"><Input value={j.area} onChange={(e) => s("area", e.target.value)} /></Field>
        <Field label="Cidade"><Input value={j.city} onChange={(e) => s("city", e.target.value)} /></Field>
        <Field label="Modalidade"><Select value={j.mode} onChange={(e) => s("mode", e.target.value as WorkMode)}>{Object.entries(WORK_MODE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
        <Field label="Contratação"><Select value={j.contract ?? ""} onChange={(e) => s("contract", (e.target.value || null) as ContractType | null)}><option value="">Não informado</option>{["CLT", "PJ", "Temporário", "Estágio", "Freelance"].map((a) => <option key={a}>{a}</option>)}</Select></Field>
        <Field label="Senioridade"><Select value={j.seniority ?? ""} onChange={(e) => s("seniority", (e.target.value || null) as Seniority | null)}><option value="">Não informada</option>{["Júnior", "Pleno", "Sênior", "Especialista", "Coordenação"].map((a) => <option key={a}>{a}</option>)}</Select></Field>
        <Field label="Data de publicação"><Input type="date" value={j.publishedAt ?? ""} onChange={(e) => s("publishedAt", e.target.value || null)} /></Field>
        <Field label="Formação exigida"><Input value={j.education} placeholder="Ex.: Arquitetura" onChange={(e) => s("education", e.target.value)} /></Field>
        <Field label="Salário mín." hint="só se divulgado"><Input type="number" value={j.salaryMin ?? ""} onChange={(e) => s("salaryMin", num(e.target.value))} /></Field>
        <Field label="Salário máx."><Input type="number" value={j.salaryMax ?? ""} onChange={(e) => s("salaryMax", num(e.target.value))} /></Field>
        <Field label="Fonte do salário"><Input value={j.salarySource} placeholder="Ex.: divulgado no anúncio" onChange={(e) => s("salarySource", e.target.value)} /></Field>
        <Field label="Competências exigidas" hint="vírgulas" className="sm:col-span-2 lg:col-span-3"><TagInput value={j.skills} onChange={(v) => s("skills", v)} placeholder="Gestão de facilities, Excel avançado, Power BI" /></Field>
        <Field label="Requisitos principais" hint="vírgulas" className="sm:col-span-2 lg:col-span-3"><TagInput value={j.requirements} onChange={(v) => s("requirements", v)} /></Field>
        <Field label="Link original" className="sm:col-span-2"><Input placeholder="https://" value={j.url} onChange={(e) => s("url", e.target.value)} /></Field>
        <Field label="Fonte"><Input value={j.source} placeholder="Ex.: site da empresa" onChange={(e) => s("source", e.target.value)} /></Field>
        <Field label="Verificada em"><Input type="date" value={j.verifiedAt ?? ""} onChange={(e) => s("verifiedAt", e.target.value || null)} /></Field>
        <label className="flex items-center gap-2 pt-6 text-xs text-ink-soft"><input type="checkbox" checked={j.activeConfirmed} onChange={(e) => s("activeConfirmed", e.target.checked)} />Confirmei que está ativa</label>
      </div>
    </Dialog>
  );
}

function WeightsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, setSettings, toast } = useStore();
  const [w, setW] = useState<JobWeights>(data.settings.jobWeights);
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  const labels: Record<keyof JobWeights, string> = { skills: "Compatibilidade de competências", experience: "Experiência e senioridade", education: "Formação e requisitos técnicos", goals: "Alinhamento com objetivos", logistics: "Localização, remuneração e modalidade" };
  return (
    <Dialog open={open} onClose={onClose} title="Pesos do índice de compatibilidade"
      footer={<><Button variant="ghost" onClick={() => setW({ skills: 30, experience: 25, education: 20, goals: 15, logistics: 10 })}>Restaurar padrão</Button><Button disabled={total !== 100} onClick={() => { setSettings({ jobWeights: w }); toast("Pesos atualizados — índices recalculados"); onClose(); }}>Aplicar</Button></>}>
      <div className="space-y-4">
        {(Object.keys(w) as (keyof JobWeights)[]).map((k) => (
          <div key={k}>
            <div className="mb-1 flex justify-between text-xs"><span>{labels[k]}</span><span className="font-display font-semibold text-green">{w[k]}%</span></div>
            <input type="range" min={0} max={60} step={5} className="w-full" value={w[k]} onChange={(e) => setW({ ...w, [k]: Number(e.target.value) })} />
          </div>
        ))}
        <p className={cn("text-xs", total === 100 ? "text-green-600" : "text-pink-700")}>Total: {total}% {total !== 100 && "— ajuste para somar 100%"}</p>
        <MethodNote title="Como funciona">
          <p>Competências: média de min(nível/3, 1) para cada competência exigida. Experiência: anos registrados vs referência NEXO da senioridade (−25 pontos por ano faltante). Formação/requisitos: formação exigida e requisitos comprovados no perfil. Objetivos: cargo-alvo (100) ou prioridade da área. Logística: modalidade, cidade e salário (só quando divulgado e com pretensão definida).</p>
        </MethodNote>
      </div>
    </Dialog>
  );
}

export default function Page() { return <Suspense><Inner /></Suspense>; }
