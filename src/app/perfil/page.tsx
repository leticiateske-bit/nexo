"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Check, Database, Download, FileUp, FlaskConical, Plug, Plus, RotateCcw, ShieldAlert, Sparkles, Trash2, Upload, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { useTab } from "@/lib/use-tab";
import { INTEGRATIONS, type IntegrationStatus } from "@/lib/integrations/registry";
import { CSV_TEMPLATES, parseContactsCSV, parseJobsCSV, parseMetricsCSV, parseResume, type ResumePayload } from "@/lib/engine/importers";
import { SKILL_LEVEL, WORK_MODE } from "@/lib/labels";
import type { AppData, Contact, ContractType, Goals, Job, MetricSnapshot, PendingImport, Profile, Seniority, WorkMode } from "@/lib/types";
import { cn, download, fmtDate, uid } from "@/lib/utils";
import { Badge, Button, Card, CardBody, CardHeader, Dialog, Empty, Field, Input, Select, Tabs, TagInput, Textarea } from "@/components/ui";
import { MethodNote, OriginBadge, PageHeader } from "@/components/nexo";

const TABS = ["onboarding", "perfil", "trajetoria", "competencias", "preferencias", "metas", "importacoes", "integracoes", "dados"] as const;
type Tab = (typeof TABS)[number];

function Inner() {
  const sp = useSearchParams();
  const { data } = useStore();
  const [tab, setTab] = useTab<Tab>(sp.get("onboarding") || !data.profile.onboardingDone ? "onboarding" : "perfil", TABS);
  return (
    <>
      <PageHeader index="09" title="Perfil, metas e configurações" description="Tudo o que personaliza as recomendações. Seus dados ficam neste navegador e podem ser editados, exportados ou excluídos a qualquer momento." />
      <Tabs className="mb-5" value={tab} onChange={setTab} items={[
        { value: "onboarding", label: data.profile.onboardingDone ? "Prioridades" : "Onboarding ✦" }, { value: "perfil", label: "Perfil e currículo" }, { value: "trajetoria", label: "Experiência e formação" },
        { value: "competencias", label: "Competências", count: data.profile.skills.length }, { value: "preferencias", label: "Preferências" }, { value: "metas", label: "Metas" },
        { value: "importacoes", label: "Importações", count: data.imports.length }, { value: "integracoes", label: "Integrações" }, { value: "dados", label: "Dados e privacidade" },
      ]} />
      {tab === "onboarding" && <Onboarding onDone={() => setTab("perfil")} />}
      {tab === "perfil" && <ProfileTab />}
      {tab === "trajetoria" && <Trajectory />}
      {tab === "competencias" && <Skills />}
      {tab === "preferencias" && <Preferences />}
      {tab === "metas" && <GoalsTab />}
      {tab === "importacoes" && <Imports />}
      {tab === "integracoes" && <Integrations />}
      {tab === "dados" && <DataTab />}
    </>
  );
}

/* --------------------------------------------------------------- Onboarding */
function Onboarding({ onDone }: { onDone: () => void }) {
  const { data, setProfile, toast } = useStore();
  const p = data.profile;
  const [step, setStep] = useState(0);
  const [newArea, setNewArea] = useState("");
  const steps = ["Prioridades", "Cargos-alvo", "Condições", "Desenvolvimento", "Metas"];
  const move = (i: number, dir: -1 | 1) => { const a = [...p.interests]; const j = i + dir; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; setProfile({ interests: a }); };
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
      <Card tone="green" className="h-fit">
        <CardBody className="pt-5">
          <div className="mb-4 flex items-center gap-2 font-display text-sm font-semibold"><Sparkles className="h-4 w-4 text-pink" />Personalize o NEXO</div>
          <ol className="space-y-1">
            {steps.map((s, i) => (
              <li key={s}><button onClick={() => setStep(i)} className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[13px]", i === step ? "bg-white/10 text-paper" : "text-paper/60 hover:text-paper")}>
                <span className={cn("flex h-5 w-5 items-center justify-center rounded-full text-[10px]", i < step ? "bg-pink text-white" : i === step ? "border border-pink text-pink" : "border border-paper/30")}>{i < step ? <Check className="h-3 w-3" /> : i + 1}</span>{s}
              </button></li>
            ))}
          </ol>
          <p className="mt-4 text-[11px] text-paper/60">Nada é presumido: a ordem das áreas define a prioridade usada em vagas, conteúdo, networking e marcas.</p>
        </CardBody>
      </Card>
      <Card>
        <CardBody className="space-y-5 pt-6">
          {step === 0 && (
            <>
              <div><h2 className="font-display text-lg font-semibold text-green">Ordene suas áreas de interesse</h2><p className="text-sm text-ink-soft">A primeira é a sua prioridade nº 1. Palavras-chave ajudam o NEXO a reconhecer vagas, empresas e contatos dessa área.</p></div>
              <ul className="space-y-2">
                {p.interests.map((it, i) => (
                  <li key={it.area + i} className="flex flex-col gap-2 rounded-xl border border-paper-line bg-white p-3 sm:flex-row sm:items-center">
                    <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-xs font-semibold", i === 0 ? "bg-pink text-white" : "bg-green-50 text-green")}>{i + 1}</span>
                    <Input className="sm:w-64" value={it.area} onChange={(e) => setProfile({ interests: p.interests.map((x, j) => (j === i ? { ...x, area: e.target.value } : x)) })} />
                    <div className="flex-1"><TagInput value={it.keywords} onChange={(v) => setProfile({ interests: p.interests.map((x, j) => (j === i ? { ...x, keywords: v } : x)) })} placeholder="palavras-chave" /></div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => move(i, -1)} aria-label="Subir"><ArrowUp className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => move(i, 1)} aria-label="Descer"><ArrowDown className="h-4 w-4" /></Button>
                      <Button size="icon" variant="danger" onClick={() => setProfile({ interests: p.interests.filter((_, j) => j !== i) })} aria-label="Remover"><X className="h-4 w-4" /></Button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2"><Input placeholder="Nova área de interesse" value={newArea} onChange={(e) => setNewArea(e.target.value)} /><Button variant="subtle" onClick={() => { if (newArea) { setProfile({ interests: [...p.interests, { area: newArea, keywords: [newArea.toLowerCase()] }] }); setNewArea(""); } }}><Plus className="h-4 w-4" />Adicionar</Button></div>
            </>
          )}
          {step === 1 && (
            <>
              <div><h2 className="font-display text-lg font-semibold text-green">Cargos-alvo e senioridade</h2><p className="text-sm text-ink-soft">Hipóteses de cargo. Você pode mudar quando quiser.</p></div>
              <Field label="Cargos-alvo" hint="vírgulas, em ordem de preferência"><TagInput value={p.targetRoles} onChange={(v) => setProfile({ targetRoles: v })} /></Field>
              <div className="flex flex-wrap gap-2">
                {data.roles.map((r) => <button key={r.id} onClick={() => setProfile({ targetRoles: toggle(p.targetRoles, r.title) })} className={cn("rounded-full border px-3 py-1 text-xs", p.targetRoles.includes(r.title) ? "border-green bg-green text-paper" : "border-paper-line hover:border-green/40")}>{r.title}</button>)}
              </div>
              <Field label="Senioridade desejada"><div className="flex flex-wrap gap-2">{(["Júnior", "Pleno", "Sênior", "Especialista", "Coordenação"] as Seniority[]).map((s) => <Chip key={s} on={p.targetSeniority.includes(s)} onClick={() => setProfile({ targetSeniority: toggle(p.targetSeniority, s) })}>{s}</Chip>)}</div></Field>
              <Field label="Anos de experiência profissional"><Input type="number" className="w-32" value={p.yearsExperience} onChange={(e) => setProfile({ yearsExperience: Number(e.target.value) })} /></Field>
            </>
          )}
          {step === 2 && (
            <>
              <h2 className="font-display text-lg font-semibold text-green">Condições de trabalho</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Pretensão salarial mínima (R$/mês)"><Input type="number" value={p.salaryMin ?? ""} onChange={(e) => setProfile({ salaryMin: e.target.value ? Number(e.target.value) : null })} /></Field>
                <Field label="Pretensão ideal (R$/mês)"><Input type="number" value={p.salaryMax ?? ""} onChange={(e) => setProfile({ salaryMax: e.target.value ? Number(e.target.value) : null })} /></Field>
              </div>
              <Field label="Modelo de contratação"><div className="flex flex-wrap gap-2">{(["CLT", "PJ", "Temporário", "Estágio", "Freelance"] as ContractType[]).map((s) => <Chip key={s} on={p.contractTypes.includes(s)} onClick={() => setProfile({ contractTypes: toggle(p.contractTypes, s) })}>{s}</Chip>)}</div></Field>
              <Field label="Modalidades"><div className="flex flex-wrap gap-2">{(Object.keys(WORK_MODE) as WorkMode[]).map((s) => <Chip key={s} on={p.workModes.includes(s)} onClick={() => setProfile({ workModes: toggle(p.workModes, s) })}>{WORK_MODE[s]}</Chip>)}</div></Field>
              <Field label="Cidades preferidas"><TagInput value={p.cities} onChange={(v) => setProfile({ cities: v })} /></Field>
            </>
          )}
          {step === 3 && (
            <>
              <h2 className="font-display text-lg font-semibold text-green">Desenvolvimento e empresas</h2>
              <Field label="Competências que quero desenvolver"><TagInput value={p.skillsToDevelop} onChange={(v) => setProfile({ skillsToDevelop: v })} /></Field>
              <Field label="Empresas de interesse" hint="viram sugestões de dossiê em Inteligência de marcas"><TagInput value={p.companiesOfInterest} onChange={(v) => setProfile({ companiesOfInterest: v })} /></Field>
              <Field label="Meus valores profissionais" hint="usados no Brand Fit"><TagInput value={p.values} onChange={(v) => setProfile({ values: v })} /></Field>
              <Field label="Objetivos em uma frase"><Textarea value={p.objectives} onChange={(e) => setProfile({ objectives: e.target.value })} /></Field>
            </>
          )}
          {step === 4 && <GoalsForm />}
          <div className="flex justify-between border-t border-paper-line pt-4">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>Voltar</Button>
            {step < steps.length - 1 ? <Button onClick={() => setStep(step + 1)}>Continuar</Button>
              : <Button onClick={() => { setProfile({ onboardingDone: true }); toast("NEXO personalizado — recomendações atualizadas"); onDone(); }}><Check className="h-4 w-4" />Concluir</Button>}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={cn("rounded-full border px-3 py-1.5 text-xs transition", on ? "border-pink bg-pink text-white" : "border-paper-line bg-white hover:border-green/40")}>{children}</button>;
}

/* --------------------------------------------------------------- Perfil */
function ProfileTab() {
  const { data, setProfile } = useStore();
  const p = data.profile;
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader title="Identidade profissional" description={`Atualizado em ${fmtDate(p.updatedAt)}`} />
        <CardBody className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Nome"><Input value={p.name} onChange={(e) => setProfile({ name: e.target.value })} /></Field>
            <Field label="Localização"><Input value={p.location} onChange={(e) => setProfile({ location: e.target.value })} /></Field>
          </div>
          <Field label="Título profissional (headline)" hint={`${p.headline.length}/220`}><Input value={p.headline} onChange={(e) => setProfile({ headline: e.target.value })} /></Field>
          <Field label="Sobre" hint={`${p.about.trim().split(/\s+/).filter(Boolean).length} palavras`}><Textarea className="min-h-[180px]" value={p.about} onChange={(e) => setProfile({ about: e.target.value })} /></Field>
          <Field label="URL do LinkedIn"><Input placeholder="https://www.linkedin.com/in/…" value={p.linkedinUrl} onChange={(e) => setProfile({ linkedinUrl: e.target.value })} /></Field>
        </CardBody>
      </Card>
      <div className="space-y-4">
        <Card>
          <CardHeader title="Currículo (texto)" description="Cole o texto do currículo. Para extrair competências com revisão, use Importações." />
          <CardBody><Textarea className="min-h-[200px]" value={p.resumeText} onChange={(e) => setProfile({ resumeText: e.target.value })} placeholder="Cole aqui o conteúdo do seu currículo…" /></CardBody>
        </Card>
        <Card>
          <CardHeader title="Certificações" action={<Button size="sm" variant="subtle" onClick={() => setProfile({ certifications: [...p.certifications, { id: uid("cert"), name: "", issuer: "", year: "" }] })}><Plus className="h-3.5 w-3.5" />Adicionar</Button>} />
          <CardBody className="space-y-2">
            {p.certifications.map((c, i) => (
              <div key={c.id} className="flex gap-2">
                <Input placeholder="Nome" value={c.name} onChange={(e) => setProfile({ certifications: p.certifications.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
                <Input placeholder="Emissor" value={c.issuer} onChange={(e) => setProfile({ certifications: p.certifications.map((x, j) => (j === i ? { ...x, issuer: e.target.value } : x)) })} />
                <Input className="w-24" placeholder="Ano" value={c.year} onChange={(e) => setProfile({ certifications: p.certifications.map((x, j) => (j === i ? { ...x, year: e.target.value } : x)) })} />
                <Button size="icon" variant="danger" onClick={() => setProfile({ certifications: p.certifications.filter((_, j) => j !== i) })} aria-label="Remover"><X className="h-4 w-4" /></Button>
              </div>
            ))}
            {!p.certifications.length && <p className="text-xs text-ink-mute">Nenhuma certificação registrada.</p>}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Portfólio e projetos" action={<Button size="sm" variant="subtle" onClick={() => setProfile({ portfolio: [...p.portfolio, { id: uid("pf"), title: "", description: "", url: "" }] })}><Plus className="h-3.5 w-3.5" />Adicionar</Button>} />
          <CardBody className="space-y-3">
            {p.portfolio.map((c, i) => (
              <div key={c.id} className="grid grid-cols-1 gap-2 rounded-xl bg-paper p-3 sm:grid-cols-2">
                <Input placeholder="Título" value={c.title} onChange={(e) => setProfile({ portfolio: p.portfolio.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} />
                <Input placeholder="Link" value={c.url} onChange={(e) => setProfile({ portfolio: p.portfolio.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })} />
                <Textarea className="min-h-[50px] sm:col-span-2" placeholder="Descrição e resultado" value={c.description} onChange={(e) => setProfile({ portfolio: p.portfolio.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)) })} />
                <Button size="sm" variant="danger" className="w-fit" onClick={() => setProfile({ portfolio: p.portfolio.filter((_, j) => j !== i) })}>Remover</Button>
              </div>
            ))}
            {!p.portfolio.length && <p className="text-xs text-ink-mute">Adicione estudos de caso, projetos de arquitetura, dashboards ou materiais visuais.</p>}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Trajectory() {
  const { data, setProfile } = useStore();
  const p = data.profile;
  const setExp = (i: number, patch: Partial<Profile["experiences"][number]>) => setProfile({ experiences: p.experiences.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_380px]">
      <Card>
        <CardHeader title="Histórico de experiências" description="Use resultados concretos. Trechos [entre colchetes] indicam informação que só você pode fornecer."
          action={<Button size="sm" variant="subtle" onClick={() => setProfile({ experiences: [{ id: uid("exp"), role: "", org: "", start: "", end: "", description: "", achievements: [] }, ...p.experiences] })}><Plus className="h-3.5 w-3.5" />Experiência</Button>} />
        <CardBody className="space-y-4">
          {p.experiences.map((e, i) => (
            <div key={e.id} className="space-y-2 rounded-2xl border border-paper-line bg-white p-4">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Field label="Cargo"><Input value={e.role} onChange={(ev) => setExp(i, { role: ev.target.value })} /></Field>
                <Field label="Organização"><Input value={e.org} onChange={(ev) => setExp(i, { org: ev.target.value })} /></Field>
                <Field label="Início"><Input type="month" value={e.start} onChange={(ev) => setExp(i, { start: ev.target.value })} /></Field>
                <Field label="Fim" hint="ou “atual”"><Input value={e.end} onChange={(ev) => setExp(i, { end: ev.target.value })} /></Field>
              </div>
              <Field label="Descrição"><Textarea className="min-h-[70px]" value={e.description} onChange={(ev) => setExp(i, { description: ev.target.value })} /></Field>
              <Field label="Resultados" hint="um por linha"><Textarea className="min-h-[70px]" value={e.achievements.join("\n")} onChange={(ev) => setExp(i, { achievements: ev.target.value.split("\n") })} /></Field>
              <Button size="sm" variant="danger" onClick={() => setProfile({ experiences: p.experiences.filter((_, j) => j !== i) })}><Trash2 className="h-3.5 w-3.5" />Remover</Button>
            </div>
          ))}
        </CardBody>
      </Card>
      <Card className="h-fit">
        <CardHeader title="Formação" action={<Button size="sm" variant="subtle" onClick={() => setProfile({ education: [...p.education, { id: uid("edu"), course: "", institution: "", level: "", year: "" }] })}><Plus className="h-3.5 w-3.5" />Formação</Button>} />
        <CardBody className="space-y-3">
          {p.education.map((e, i) => (
            <div key={e.id} className="space-y-2 rounded-xl bg-paper p-3">
              {(["course", "institution", "level", "year"] as const).map((k) => <Input key={k} placeholder={{ course: "Curso", institution: "Instituição", level: "Nível", year: "Ano de conclusão" }[k]} value={e[k]} onChange={(ev) => setProfile({ education: p.education.map((x, j) => (j === i ? { ...x, [k]: ev.target.value } : x)) })} />)}
              <Button size="sm" variant="danger" onClick={() => setProfile({ education: p.education.filter((_, j) => j !== i) })}>Remover</Button>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}

function Skills() {
  const { data, setProfile } = useStore();
  const p = data.profile;
  const [name, setName] = useState("");
  const sorted = p.skills.map((s, i) => ({ s, i })).sort((a, b) => b.s.level - a.s.level);
  return (
    <Card>
      <CardHeader title="Matriz pessoal de competências" description="Níveis iniciais estimados pelo NEXO a partir do briefing — revise com honestidade e registre evidências. Eles alimentam todos os índices." />
      <CardBody>
        <div className="mb-4 flex gap-2"><Input placeholder="Nova competência" value={name} onChange={(e) => setName(e.target.value)} /><Button variant="subtle" onClick={() => { if (name) { setProfile({ skills: [...p.skills, { name, level: 2, evidence: "" }] }); setName(""); } }}><Plus className="h-4 w-4" />Adicionar</Button></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs text-ink-mute"><tr><th className="py-2">Competência</th><th className="w-56">Nível</th><th>Evidência (projeto, resultado, certificado)</th><th /></tr></thead>
            <tbody className="divide-y divide-paper-line">
              {sorted.map(({ s, i }) => (
                <tr key={s.name + i}>
                  <td className="py-2 pr-2"><Input className="h-8" value={s.name} onChange={(e) => setProfile({ skills: p.skills.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} /></td>
                  <td className="pr-2"><div className="flex items-center gap-2"><input type="range" min={0} max={5} value={s.level} className="w-28" onChange={(e) => setProfile({ skills: p.skills.map((x, j) => (j === i ? { ...x, level: Number(e.target.value) } : x)) })} /><span className="w-24 text-xs text-ink-soft">{s.level} · {SKILL_LEVEL[s.level]}</span></div></td>
                  <td className="pr-2"><Input className="h-8 text-xs" value={s.evidence} placeholder="sem evidência registrada" onChange={(e) => setProfile({ skills: p.skills.map((x, j) => (j === i ? { ...x, evidence: e.target.value } : x)) })} /></td>
                  <td><Button size="icon" variant="danger" onClick={() => setProfile({ skills: p.skills.filter((_, j) => j !== i) })} aria-label="Remover"><Trash2 className="h-3.5 w-3.5" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}

function Preferences() {
  const { data, setProfile, setSettings } = useStore();
  const p = data.profile;
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card><CardHeader title="Objetivos e cargos" /><CardBody className="space-y-3">
        <Field label="Objetivos profissionais"><Textarea value={p.objectives} onChange={(e) => setProfile({ objectives: e.target.value })} /></Field>
        <Field label="Cargos-alvo"><TagInput value={p.targetRoles} onChange={(v) => setProfile({ targetRoles: v })} /></Field>
        <Field label="Empresas de interesse"><TagInput value={p.companiesOfInterest} onChange={(v) => setProfile({ companiesOfInterest: v })} /></Field>
        <Field label="Valores"><TagInput value={p.values} onChange={(v) => setProfile({ values: v })} /></Field>
        <Field label="Competências a desenvolver"><TagInput value={p.skillsToDevelop} onChange={(v) => setProfile({ skillsToDevelop: v })} /></Field>
      </CardBody></Card>
      <Card><CardHeader title="Preferências de trabalho e capacitação" /><CardBody className="space-y-3">
        <Field label="Cidades"><TagInput value={p.cities} onChange={(v) => setProfile({ cities: v })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Pretensão mínima (R$)"><Input type="number" value={p.salaryMin ?? ""} onChange={(e) => setProfile({ salaryMin: e.target.value ? Number(e.target.value) : null })} /></Field>
          <Field label="Pretensão ideal (R$)"><Input type="number" value={p.salaryMax ?? ""} onChange={(e) => setProfile({ salaryMax: e.target.value ? Number(e.target.value) : null })} /></Field>
          <Field label="Disponibilidade para estudo (h/semana)"><Input type="number" value={p.availabilityHoursWeek} onChange={(e) => setProfile({ availabilityHoursWeek: Number(e.target.value) })} /></Field>
          <Field label="Orçamento para capacitação (R$/mês)"><Input type="number" value={p.trainingBudgetMonth ?? ""} onChange={(e) => setProfile({ trainingBudgetMonth: e.target.value ? Number(e.target.value) : null })} /></Field>
        </div>
        <Field label="Definição da taxa de interação"><Select value={data.settings.engagementRateDefinition} onChange={(e) => setSettings({ engagementRateDefinition: e.target.value as "por_impressao" | "por_seguidor" })}><option value="por_impressao">Interações ÷ impressões</option><option value="por_seguidor">Interações ÷ seguidores</option></Select></Field>
        <p className="text-[11px] text-ink-mute">Modalidades, contratação e senioridade: ajuste em Prioridades (onboarding).</p>
      </CardBody></Card>
    </div>
  );
}

function GoalsForm() {
  const { data, setProfile } = useStore();
  const g = data.profile.goals;
  const set = (patch: Partial<Goals>) => setProfile({ goals: { ...g, ...patch } });
  const fields: [keyof Goals, string][] = [["postsPerWeek", "Publicações por semana"], ["commentsPerWeek", "Comentários relevantes por semana"], ["newContactsPerWeek", "Novos contatos estratégicos por semana"], ["messagesPerWeek", "Mensagens contextualizadas por semana"], ["applicationsPerMonth", "Candidaturas por mês"], ["coursesPerQuarter", "Capacitações por trimestre"], ["ssiTarget", "Meta de SSI oficial (0–100)"]];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {fields.map(([k, l]) => <Field key={k} label={l}><Input type="number" min={0} value={g[k] as number} onChange={(e) => set({ [k]: Number(e.target.value) } as Partial<Goals>)} /></Field>)}
        <Field label="Disponibilidade semanal para desenvolvimento (h)"><Input type="number" value={data.profile.availabilityHoursWeek} onChange={(e) => setProfile({ availabilityHoursWeek: Number(e.target.value) })} /></Field>
      </div>
      <div>
        <div className="mb-2 text-xs font-medium text-ink-soft">Metas por pilar (0–25)</div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(["brand", "people", "insights", "relationships"] as const).map((k) => <Field key={k} label={{ brand: "Marca", people: "Pessoas", insights: "Insights", relationships: "Relacionamentos" }[k]}><Input type="number" min={0} max={25} value={g.pillarTargets[k]} onChange={(e) => set({ pillarTargets: { ...g.pillarTargets, [k]: Number(e.target.value) } })} /></Field>)}
        </div>
      </div>
    </div>
  );
}

function GoalsTab() {
  return <Card><CardHeader title="Metas de LinkedIn, networking e carreira" description="Usadas no NEXO Score, nas tarefas da semana e nos relatórios." /><CardBody><GoalsForm /></CardBody></Card>;
}

/* --------------------------------------------------------------- Importações */
function Imports() {
  const { data, add, remove, addMany, setProfile, toast } = useStore();
  const [paste, setPaste] = useState("");
  const [kind, setKind] = useState<"curriculo" | "metricas" | "contatos" | "vagas">("curriculo");
  const [review, setReview] = useState<PendingImport | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const ingest = (text: string, name: string) => {
    const imp = kind === "curriculo" ? parseResume(text, name) : kind === "metricas" ? parseMetricsCSV(text, name) : kind === "contatos" ? parseContactsCSV(text, name) : parseJobsCSV(text, name);
    add("imports", imp); setReview(imp); setPaste("");
  };
  const onFile = async (f: File) => {
    if (/\.(pdf|docx?)$/i.test(f.name)) return toast("PDF/DOCX: extração prevista para a próxima etapa. Abra o arquivo, copie o texto e cole aqui.", "warn");
    ingest(await f.text(), f.name);
  };
  const approve = (imp: PendingImport, selected?: string[]) => {
    if (imp.kind === "curriculo") {
      const pl = imp.payload as ResumePayload;
      const newSkills = (selected ?? pl.skills).filter((s) => !data.profile.skills.some((x) => x.name.toLowerCase() === s.toLowerCase())).map((s) => ({ name: s, level: 2, evidence: `Citado no currículo (${imp.fileName})` }));
      setProfile({ resumeText: pl.text, skills: [...data.profile.skills, ...newSkills] });
      toast(`Currículo salvo · ${newSkills.length} competência(s) adicionada(s) com nível 2 — revise os níveis`);
    } else if (imp.kind === "metricas") { addMany("metrics", imp.payload as MetricSnapshot[]); toast("Métricas importadas"); }
    else if (imp.kind === "contatos") { addMany("contacts", imp.payload as Contact[]); toast("Contatos importados"); }
    else { addMany("jobs", imp.payload as Job[]); toast("Vagas importadas"); }
    remove("imports", imp.id); setReview(null);
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader title="Importar dados" description="Nada entra nos seus dados sem revisão. Formatos aceitos: texto (.txt) e planilhas (.csv)." />
        <CardBody className="space-y-3">
          <Tabs value={kind} onChange={setKind} items={[{ value: "curriculo", label: "Currículo" }, { value: "metricas", label: "Métricas LinkedIn (CSV)" }, { value: "contatos", label: "Contatos (CSV)" }, { value: "vagas", label: "Vagas (CSV)" }]} />
          <Textarea className="min-h-[180px] font-mono text-xs" placeholder={kind === "curriculo" ? "Cole o texto do currículo…" : "Cole o conteúdo CSV (com cabeçalho)…"} value={paste} onChange={(e) => setPaste(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            <Button disabled={!paste.trim()} onClick={() => ingest(paste, kind === "curriculo" ? "texto colado" : "CSV colado")}><Upload className="h-4 w-4" />Analisar</Button>
            <input ref={fileRef} type="file" accept=".txt,.csv,.pdf,.doc,.docx" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
            <Button variant="outline" onClick={() => fileRef.current?.click()}><FileUp className="h-4 w-4" />Escolher arquivo</Button>
            {kind !== "curriculo" && <Button variant="ghost" onClick={() => download(`modelo-${kind}.csv`, CSV_TEMPLATES[kind])}><Download className="h-4 w-4" />Baixar modelo CSV</Button>}
          </div>
          <MethodNote title="Formatos e limitações">
            <p><strong>Currículo:</strong> o NEXO detecta competências de uma lista conhecida e o ano mais antigo citado. PDF e DOCX dependem de extração no navegador (próxima etapa) — por enquanto, cole o texto.</p>
            <p><strong>Contatos:</strong> compatível com o arquivo Connections.csv da exportação oficial de dados do LinkedIn (Configurações → Privacidade de dados → Obter uma cópia dos seus dados). Apague as linhas de nota antes do cabeçalho.</p>
            <p><strong>Métricas e vagas:</strong> use os modelos CSV. Datas em AAAA-MM-DD.</p>
          </MethodNote>
        </CardBody>
      </Card>
      <Card className="h-fit">
        <CardHeader title="Aguardando revisão" />
        <CardBody>
          {data.imports.length ? (
            <ul className="space-y-2">{data.imports.map((imp) => (
              <li key={imp.id} className="rounded-xl bg-paper p-3 text-xs">
                <div className="flex items-center justify-between"><Badge tone="amber">{imp.kind}</Badge><span className="text-ink-mute">{fmtDate(imp.createdAt)}</span></div>
                <div className="mt-1 font-medium">{imp.fileName}</div><div className="text-ink-mute">{imp.summary}</div>
                <div className="mt-2 flex gap-1"><Button size="sm" onClick={() => setReview(imp)}>Revisar</Button><Button size="sm" variant="danger" onClick={() => remove("imports", imp.id)}>Descartar</Button></div>
              </li>
            ))}</ul>
          ) : <p className="text-xs text-ink-mute">Nenhuma importação pendente.</p>}
        </CardBody>
      </Card>
      <ReviewDialog imp={review} onClose={() => setReview(null)} onApprove={approve} />
    </div>
  );
}

function ReviewDialog({ imp, onClose, onApprove }: { imp: PendingImport | null; onClose: () => void; onApprove: (i: PendingImport, sel?: string[]) => void }) {
  const [sel, setSel] = useState<string[]>([]);
  useEffect(() => { if (imp?.kind === "curriculo") setSel((imp.payload as ResumePayload).skills); }, [imp]);
  if (!imp) return null;
  const rows = Array.isArray(imp.payload) ? (imp.payload as Record<string, unknown>[]) : [];
  return (
    <Dialog open onClose={onClose} wide title={`Revisar importação — ${imp.fileName}`} footer={<><Button variant="ghost" onClick={onClose}>Revisar depois</Button><Button onClick={() => onApprove(imp, sel)}><Check className="h-4 w-4" />Aprovar e importar</Button></>}>
      <p className="mb-3 text-xs text-ink-soft">{imp.summary}. Confira antes de aprovar — dados importados só passam a valer depois desta revisão.</p>
      {imp.kind === "curriculo" ? (
        <div className="space-y-3">
          <div className="text-xs font-medium">Competências detectadas (desmarque as incorretas)</div>
          <div className="flex flex-wrap gap-2">{(imp.payload as ResumePayload).skills.map((s) => <Chip key={s} on={sel.includes(s)} onClick={() => setSel(sel.includes(s) ? sel.filter((x) => x !== s) : [...sel, s])}>{s}</Chip>)}</div>
          {!(imp.payload as ResumePayload).skills.length && <p className="text-xs text-ink-mute">Nenhuma competência reconhecida. O texto será salvo mesmo assim.</p>}
          <Textarea readOnly className="min-h-[160px] text-xs" value={(imp.payload as ResumePayload).text} />
        </div>
      ) : rows.length ? (
        <div className="max-h-[50vh] overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-paper text-left text-ink-mute"><tr>{Object.keys(rows[0]).filter((k) => !["id", "origin", "createdAt", "updatedAt", "interactions", "history", "tags"].includes(k)).slice(0, 8).map((k) => <th key={k} className="p-1.5">{k}</th>)}</tr></thead>
            <tbody className="divide-y divide-paper-line">{rows.slice(0, 50).map((r, i) => <tr key={i}>{Object.entries(r).filter(([k]) => !["id", "origin", "createdAt", "updatedAt", "interactions", "history", "tags"].includes(k)).slice(0, 8).map(([k, v]) => <td key={k} className="p-1.5">{Array.isArray(v) ? v.join("; ") : String(v ?? "—")}</td>)}</tr>)}</tbody>
          </table>
          {rows.length > 50 && <p className="mt-2 text-xs text-ink-mute">Mostrando 50 de {rows.length}.</p>}
        </div>
      ) : <Empty title="Nenhuma linha válida encontrada">Verifique o cabeçalho e o formato das datas.</Empty>}
    </Dialog>
  );
}

/* --------------------------------------------------------------- Integrações */
function Integrations() {
  const [status, setStatus] = useState<Record<string, IntegrationStatus> | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => { fetch("/api/integrations/status").then((r) => r.json()).then((j) => setStatus(j.status)).catch(() => setErr(true)); }, []);
  const label: Record<IntegrationStatus, [string, "pink" | "amber" | "green"]> = { nao_configurada: ["Não configurada", "pink"], configurada_nao_implementada: ["Credencial presente · conector pendente", "amber"], ativa: ["Ativa", "green"] };
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-paper-line bg-paper-card px-4 py-3 text-xs text-ink-soft"><Plug className="mr-1 inline h-3.5 w-3.5 text-pink" />Nenhuma integração é simulada. O status vem do servidor e indica apenas se as variáveis de ambiente existem — valores de chaves nunca são enviados ao navegador. Sem scraping, automação de convites/mensagens ou publicação automática.</div>
      {err && <div className="rounded-xl bg-pink-50 px-4 py-2 text-xs text-pink-700">Não foi possível consultar o status (servidor indisponível).</div>}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {INTEGRATIONS.map((i) => {
          const st = status?.[i.id];
          return (
            <Card key={i.id} tone="white"><CardBody className="pt-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-[15px] font-semibold text-green">{i.name}</h3>
                {st ? <Badge tone={label[st][1]}>{label[st][0]}</Badge> : !err && <Badge tone="outline">verificando…</Badge>}
              </div>
              <p className="mt-1 text-xs text-ink-soft">{i.purpose}</p>
              <dl className="mt-3 space-y-1.5 text-xs">
                <div><dt className="inline font-medium">Depende de: </dt><dd className="inline text-ink-soft">{i.requires}</dd></div>
                <div><dt className="inline font-medium">Alternativa disponível: </dt><dd className="inline text-green-600">{i.alternative}</dd></div>
                {i.envVars.length > 0 && <div><dt className="inline font-medium">Variáveis: </dt><dd className="inline font-mono text-[11px] text-ink-mute">{i.envVars.join(", ")}</dd></div>}
              </dl>
              {i.docs && <a href={i.docs} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[11px] text-ink-mute underline">documentação</a>}
            </CardBody></Card>
          );
        })}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- Dados */
function DataTab() {
  const store = useStore();
  const { data, clearDemo, restoreDemo, resetAll, replaceAll, toast } = store;
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirm, setConfirm] = useState<null | "reset" | "demo">(null);
  const demoCount = (["ssi", "metrics", "posts", "references", "contacts", "jobs", "companies", "plan", "tasks"] as const).reduce((a, k) => a + (data[k] as { origin: string }[]).filter((x) => x.origin === "demo").length, 0);
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card><CardHeader title="Dados demonstrativos" description={`${demoCount} registros fictícios no momento`} /><CardBody className="space-y-3 text-sm">
        <p className="text-xs text-ink-soft">Remova os dados DEMO quando começar a registrar os seus. Seu perfil, referências NEXO (cargos e capacitações) e tudo o que você cadastrou são mantidos.</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="green" disabled={!demoCount} onClick={() => setConfirm("demo")}><FlaskConical className="h-4 w-4" />Excluir dados demo</Button>
          <Button variant="outline" onClick={() => { restoreDemo(); toast("Dados demo restaurados"); }}><RotateCcw className="h-4 w-4" />Restaurar demo</Button>
        </div>
      </CardBody></Card>
      <Card><CardHeader title="Backup e portabilidade" description="Armazenamento atual: navegador deste dispositivo" /><CardBody className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => download(`nexo-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), "application/json")}><Download className="h-4 w-4" />Exportar tudo (JSON)</Button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { const j = JSON.parse(await f.text()) as AppData; if (!j.profile) throw new Error(); replaceAll(j); toast("Backup restaurado"); } catch { toast("Arquivo inválido", "warn"); } e.target.value = ""; }} />
          <Button variant="outline" onClick={() => fileRef.current?.click()}><Database className="h-4 w-4" />Restaurar backup</Button>
        </div>
        <p className="text-[11px] text-ink-mute">Limpar os dados do navegador apaga o NEXO. Faça backups periódicos até a persistência em nuvem (Supabase) ser ativada.</p>
      </CardBody></Card>
      <Card className="lg:col-span-2"><CardHeader title="Privacidade" /><CardBody className="grid grid-cols-1 gap-4 text-xs text-ink-soft md:grid-cols-2">
        <ul className="list-inside list-disc space-y-1">
          <li>Dados pessoais ficam apenas no seu navegador (localStorage); nada é enviado a servidores nesta versão.</li>
          <li>Você pode editar ou excluir qualquer registro diretamente em cada módulo.</li>
          <li>Contatos: registre só informações profissionais públicas. O NEXO não coleta dados de terceiros automaticamente.</li>
          <li>Origem visível em cada registro: <OriginBadge origin="demo" /> <OriginBadge origin="nexo" /> <OriginBadge origin="user" /> <OriginBadge origin="import" /></li>
        </ul>
        <div className="rounded-xl border border-pink/30 bg-pink-50 p-4">
          <div className="mb-2 flex items-center gap-2 font-semibold text-pink-700"><ShieldAlert className="h-4 w-4" />Excluir todos os dados</div>
          <p className="mb-3">Remove perfil, registros e configurações deste navegador e recomeça do estado inicial.</p>
          <Button variant="primary" onClick={() => setConfirm("reset")}><Trash2 className="h-4 w-4" />Excluir tudo</Button>
        </div>
      </CardBody></Card>
      <Dialog open={!!confirm} onClose={() => setConfirm(null)} title="Confirmar"
        footer={<><Button variant="ghost" onClick={() => setConfirm(null)}>Cancelar</Button><Button onClick={() => { if (confirm === "reset") { resetAll(); toast("Dados excluídos", "info"); } else { clearDemo(); toast("Dados demo excluídos"); } setConfirm(null); }}>Confirmar</Button></>}>
        <p className="text-sm">{confirm === "reset" ? "Todos os seus dados serão apagados deste navegador. Esta ação não pode ser desfeita (exceto por um backup JSON)." : `${demoCount} registros demonstrativos serão removidos. Seus dados permanecem.`}</p>
      </Dialog>
    </div>
  );
}

export default function Page() { return <Suspense><Inner /></Suspense>; }

