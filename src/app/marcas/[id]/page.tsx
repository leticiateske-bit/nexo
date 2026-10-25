"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { ArrowLeft, ExternalLink, Lightbulb, Pencil, Plus, Trash2, TriangleAlert } from "lucide-react";
import { useStore } from "@/lib/store";
import { useDerived } from "@/lib/hooks";
import { useTab } from "@/lib/use-tab";
import { EVIDENCE_KIND, PAIN_AUDIENCE } from "@/lib/labels";
import type { Company, Evidence, Pain, PainAudience, PeopleContentInsight, Trend } from "@/lib/types";
import { cn, fmtDate, todayISO, uid } from "@/lib/utils";
import { Badge, Button, Card, CardBody, CardHeader, Dialog, Empty, Field, Input, Select, Tabs, TagInput, Textarea } from "@/components/ui";
import { ConfidenceBadge, DimensionBars, Fact, MethodNote, OriginBadge, PageHeader, ScoreRing } from "@/components/nexo";
import { BarsChart } from "@/components/charts";

const TABS = ["identidade", "fit", "tendencias", "conteudos", "dores", "valor"] as const;
type Tab = (typeof TABS)[number];

type FieldSpec = { key: string; label: string; type?: "text" | "textarea" | "select" | "number" | "date"; options?: Record<string, string>; full?: boolean; hint?: string };

function ItemDialog<T extends { id: string }>({ title, item, fields, onSave, onClose }: { title: string; item: T | null; fields: FieldSpec[]; onSave: (t: T) => void; onClose: () => void }) {
  const [v, setV] = useState<T | null>(item);
  if (item && (!v || v.id !== item.id)) setV(item);
  if (!item || !v) return null;
  const rec = v as unknown as Record<string, string | number>;
  const set = (k: string, val: string | number) => setV({ ...v, [k]: val } as T);
  return (
    <Dialog open onClose={onClose} title={title} footer={<Button onClick={() => onSave(v)}>Salvar</Button>}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <Field key={f.key} label={f.label} hint={f.hint} className={f.full || f.type === "textarea" ? "sm:col-span-2" : ""}>
            {f.type === "textarea" ? <Textarea className="min-h-[70px]" value={rec[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} />
              : f.type === "select" ? <Select value={rec[f.key] as string} onChange={(e) => set(f.key, e.target.value)}>{Object.entries(f.options!).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select>
              : <Input type={f.type ?? "text"} value={rec[f.key] ?? ""} onChange={(e) => set(f.key, f.type === "number" ? Number(e.target.value) : e.target.value)} />}
          </Field>
        ))}
      </div>
    </Dialog>
  );
}

function Inner() {
  const { id } = useParams<{ id: string }>();
  const { data, update, remove, toast } = useStore();
  const d = useDerived();
  const router = useRouter();
  const [tab, setTab] = useTab<Tab>("identidade", TABS);
  const c = data.companies.find((x) => x.id === id);
  if (!c) return <Empty title="Empresa não encontrada" action={<Link href="/marcas"><Button>Voltar</Button></Link>} />;
  const fit = d.brandFits.get(c.id);
  const patch = (p: Partial<Company>) => update("companies", c.id, { ...p, lastResearchAt: todayISO() });

  return (
    <>
      <Link href="/marcas" className="mb-3 inline-flex items-center gap-1 text-xs text-ink-mute hover:text-pink"><ArrowLeft className="h-3.5 w-3.5" />Inteligência de marcas</Link>
      <PageHeader index="07" title={c.name} description={<span className="flex flex-wrap items-center gap-2">{c.sector || "Setor não informado"}{c.hq && ` · ${c.hq}`} <OriginBadge origin={c.origin} /> {c.website && <a href={c.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">site oficial <ExternalLink className="h-3 w-3" /></a>}</span>}
        actions={<Button variant="danger" onClick={() => { remove("companies", c.id); toast("Dossiê excluído", "info"); router.push("/marcas"); }}><Trash2 className="h-4 w-4" />Excluir dossiê</Button>} />
      {c.origin === "demo" && <div className="mb-4 rounded-xl bg-pink-50 px-4 py-2.5 text-xs text-pink-700">Empresa fictícia. Todo o conteúdo deste dossiê é demonstrativo e serve para mostrar a estrutura da análise.</div>}

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-[auto_1fr]">
        <Card tone="green" className="flex items-center gap-4 px-5 py-4">
          <ScoreRing value={fit?.total ?? null} label="Brand Fit" track="rgba(245,240,232,.15)" />
          <div className="text-xs text-paper/80">
            <div className="font-display text-sm font-semibold text-paper">{fit?.total === null ? "Sem dados suficientes" : `${fit?.total}% de compatibilidade estimada`}</div>
            <div className="mt-1">{fit && <ConfidenceBadge confidence={fit.confidence} coverage={fit.coverage} />}</div>
            <p className="mt-1 max-w-[220px]">Estimativa analítica do NEXO — não é avaliação oficial da empresa nem chance de contratação.</p>
          </div>
        </Card>
        <Card>
          <CardBody className="pt-5 text-xs">
            <div className="mb-2 font-semibold text-ink">Informações que faltam para melhorar a análise</div>
            <div className="flex flex-wrap gap-1">
              {[...c.missingInfo, ...(fit?.dimensions.filter((x) => x.score === null).map((x) => `Dados para "${x.label}"`) ?? [])].map((m) => <Badge key={m} tone="amber">{m}</Badge>)}
              {!c.missingInfo.length && fit?.dimensions.every((x) => x.score !== null) && <span className="text-ink-mute">Cobertura completa dos critérios.</span>}
            </div>
            <div className="mt-3 text-ink-mute">Última pesquisa: {c.lastResearchAt ? fmtDate(c.lastResearchAt) : "nunca"} · {c.evidence.length} evidências · {c.trends.length} tendências · {c.pains.length} dores</div>
          </CardBody>
        </Card>
      </div>

      <Tabs className="mb-5" value={tab} onChange={setTab} items={[
        { value: "identidade", label: "1. Identidade" }, { value: "fit", label: "2. Brand Fit" }, { value: "tendencias", label: "3. Tendências", count: c.trends.length },
        { value: "conteudos", label: "4. Conteúdos de profissionais", count: c.peopleContent.length }, { value: "dores", label: "5. Dores", count: c.pains.length }, { value: "valor", label: "6. Como gerar valor" },
      ]} />
      {tab === "identidade" && <Identity c={c} patch={patch} />}
      {tab === "fit" && fit && <FitTab c={c} />}
      {tab === "tendencias" && <Trends c={c} patch={patch} />}
      {tab === "conteudos" && <PeopleContent c={c} patch={patch} />}
      {tab === "dores" && <Pains c={c} patch={patch} />}
      {tab === "valor" && <ValueTab c={c} patch={patch} />}
    </>
  );
}

function Identity({ c, patch }: { c: Company; patch: (p: Partial<Company>) => void }) {
  const [edit, setEdit] = useState(false);
  const [ev, setEv] = useState<Evidence | null>(null);
  const text: [keyof Company, string][] = [["history", "História e marcos"], ["businessModel", "Setor e modelo de negócio"], ["products", "Produtos e serviços"], ["mission", "Missão (oficial)"], ["vision", "Visão (oficial)"], ["culture", "Cultura declarada"], ["priorities", "Áreas estratégicas e prioridades divulgadas"], ["positioning", "Posicionamento e diferenciais"], ["geography", "Presença geográfica"]];
  const official = c.evidence.filter((e) => e.kind === "oficial");
  const indep = c.evidence.filter((e) => e.kind !== "oficial");
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader title="Identidade da marca" description="Preencha a partir de fontes oficiais e registre-as abaixo." action={<Button size="sm" variant={edit ? "green" : "outline"} onClick={() => setEdit(!edit)}><Pencil className="h-3.5 w-3.5" />{edit ? "Concluir edição" : "Editar"}</Button>} />
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {edit && (
            <>
              <Field label="Nome"><Input value={c.name} onChange={(e) => patch({ name: e.target.value })} /></Field>
              <Field label="Setor"><Input value={c.sector} onChange={(e) => patch({ sector: e.target.value })} /></Field>
              <Field label="Site"><Input value={c.website} onChange={(e) => patch({ website: e.target.value })} /></Field>
              <Field label="Sede"><Input value={c.hq} onChange={(e) => patch({ hq: e.target.value })} /></Field>
            </>
          )}
          {text.map(([k, l]) => (
            <div key={k} className={k === "history" ? "sm:col-span-2" : ""}>
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">{l}</div>
              {edit ? <Textarea className="min-h-[64px]" value={c[k] as string} onChange={(e) => patch({ [k]: e.target.value } as Partial<Company>)} />
                : <p className="text-sm text-ink-soft">{(c[k] as string) || <span className="text-ink-mute">Não informado</span>}</p>}
            </div>
          ))}
          <div className="sm:col-span-2">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Valores declarados</div>
            {edit ? <TagInput value={c.declaredValues} onChange={(v) => patch({ declaredValues: v })} /> : <div className="flex flex-wrap gap-1">{c.declaredValues.map((v) => <Badge key={v} tone="green">{v}</Badge>)}{!c.declaredValues.length && <span className="text-sm text-ink-mute">Não informado</span>}</div>}
          </div>
          <div className="sm:col-span-2">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Áreas de atuação (base do Brand Fit)</div>
            {edit ? <TagInput value={c.areas} onChange={(v) => patch({ areas: v })} /> : <div className="flex flex-wrap gap-1">{c.areas.map((v) => <Badge key={v} tone="outline">{v}</Badge>)}</div>}
          </div>
          <div className="sm:col-span-2">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Cargos prováveis</div>
            {edit ? <TagInput value={c.likelyRoles} onChange={(v) => patch({ likelyRoles: v })} /> : <div className="flex flex-wrap gap-1">{c.likelyRoles.map((v) => <Badge key={v} tone="outline">{v}</Badge>)}</div>}
          </div>
          {edit && <Field label="Informações que faltam" hint="vírgulas" className="sm:col-span-2"><TagInput value={c.missingInfo} onChange={(v) => patch({ missingInfo: v })} /></Field>}
        </CardBody>
      </Card>
      <div className="space-y-4">
        <Card>
          <CardHeader title="Discurso × comportamento" description="Separe o que a empresa diz do que fontes independentes observam." action={<Button size="icon" variant="subtle" onClick={() => setEv({ id: uid("ev"), text: "", kind: "oficial", source: "", url: "", date: todayISO() })} aria-label="Adicionar evidência"><Plus className="h-4 w-4" /></Button>} />
          <CardBody className="space-y-4">
            <EvidenceList title="Discurso institucional" items={official} onDelete={(id) => patch({ evidence: c.evidence.filter((x) => x.id !== id) })} />
            <EvidenceList title="Fontes independentes, inferências e hipóteses" items={indep} onDelete={(id) => patch({ evidence: c.evidence.filter((x) => x.id !== id) })} />
          </CardBody>
        </Card>
      </div>
      <ItemDialog title="Nova evidência" item={ev} onClose={() => setEv(null)}
        onSave={(e) => { patch({ evidence: [...c.evidence, e] }); setEv(null); }}
        fields={[{ key: "text", label: "Afirmação ou observação", type: "textarea" }, { key: "kind", label: "Tipo", type: "select", options: EVIDENCE_KIND }, { key: "date", label: "Data da publicação/consulta", type: "date" }, { key: "source", label: "Fonte" }, { key: "url", label: "Link", full: true }]} />
    </div>
  );
}

function EvidenceList({ title, items, onDelete }: { title: string; items: Evidence[]; onDelete: (id: string) => void }) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">{title}</div>
      {items.length ? (
        <ul className="space-y-2">
          {items.map((e) => (
            <li key={e.id} className="rounded-xl bg-paper p-2.5 text-xs">
              <div className="flex items-start justify-between gap-2"><Badge tone={e.kind === "oficial" ? "green" : e.kind === "independente" ? "solidGreen" : e.kind === "inferencia" ? "outline" : "pink"}>{EVIDENCE_KIND[e.kind]}</Badge><button onClick={() => onDelete(e.id)} className="text-ink-mute hover:text-pink" aria-label="Excluir"><Trash2 className="h-3 w-3" /></button></div>
              <p className="mt-1 text-ink-soft">{e.text}</p>
              <div className="mt-1 text-[10px] text-ink-mute">{e.url ? <a href={e.url} target="_blank" rel="noreferrer" className="underline">{e.source}</a> : e.source} · {fmtDate(e.date)}</div>
            </li>
          ))}
        </ul>
      ) : <p className="text-xs text-ink-mute">Nenhuma registrada.</p>}
    </div>
  );
}

function FitTab({ c }: { c: Company }) {
  const d = useDerived();
  const { data } = useStore();
  const f = d.brandFits.get(c.id)!;
  const strong = f.dimensions.filter((x) => x.score !== null && x.score >= 70);
  const weak = f.dimensions.filter((x) => x.score !== null && x.score < 50);
  const gapSkills = c.areas.filter((a) => !data.profile.skills.some((s) => s.level >= 3 && s.name.toLowerCase() === a.toLowerCase()));
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_380px]">
      <Card>
        <CardHeader title="Pontuação por dimensão" description={f.partial ? "Análise parcial — dimensões sem dados foram excluídas e os pesos redistribuídos." : "Todas as dimensões com dados."} action={<ConfidenceBadge confidence={f.confidence} coverage={f.coverage} />} />
        <CardBody><DimensionBars dims={f.dimensions} /></CardBody>
      </Card>
      <div className="space-y-3">
        <Card><CardBody className="space-y-3 pt-5">
          <Fact kind="estimativa"><strong>{f.total ?? "—"}%</strong> de compatibilidade estimada{strong.length ? `, com forte aderência em ${strong.map((x) => x.label.toLowerCase()).join(" e ")}` : ""}{weak.length ? ` e lacunas em ${weak.map((x) => x.label.toLowerCase()).join(", ")}` : ""}.</Fact>
          <Fact kind="fato"><strong>Evidências:</strong> {f.dimensions.flatMap((x) => x.reasons).slice(0, 3).join(" ") || "Nenhuma evidência registrada."}</Fact>
          <Fact kind="inferencia"><strong>Principais lacunas:</strong> {f.dimensions.flatMap((x) => x.gaps).slice(0, 3).join(" ") || "—"}</Fact>
          <Fact kind="recomendacao"><strong>Competências que aumentariam a aderência:</strong> {gapSkills.slice(0, 4).join(", ") || "—"}</Fact>
          <Fact kind="inferencia"><strong>Cargos mais compatíveis:</strong> {c.likelyRoles.join(", ") || "Nenhum cargo provável registrado."}</Fact>
        </CardBody></Card>
        <MethodNote title="Por que existe esse alinhamento?" defaultOpen>
          <p>O Brand Fit cruza as áreas de atuação da empresa com seus níveis de competência, procura essas áreas nas experiências descritas no seu perfil, compara valores declarados com os seus, verifica a prioridade da área nos seus interesses e usa a melhor vaga acompanhada da empresa (ou cargos prováveis).</p>
          <p>Não usa avaliações de terceiros nem dados pessoais. Valores e cultura são o discurso da empresa até que haja evidência independente.</p>
        </MethodNote>
      </div>
    </div>
  );
}

const TREND_KIND = { confirmada: "Notícia confirmada", tendencia: "Tendência observada", hipotese: "Hipótese" };

function Trends({ c, patch }: { c: Company; patch: (p: Partial<Company>) => void }) {
  const [it, setIt] = useState<Trend | null>(null);
  return (
    <div className="space-y-4">
      <div className="flex justify-between gap-2">
        <div className="flex flex-wrap gap-1 text-[11px]">{Object.entries(TREND_KIND).map(([k, l]) => <Badge key={k} tone={k === "confirmada" ? "green" : k === "tendencia" ? "outline" : "pink"}>{l}</Badge>)}</div>
        <Button onClick={() => setIt({ id: uid("tr"), what: "", since: "", source: "", url: "", why: "", opportunities: "", skills: "", action: "", kind: "confirmada" })}><Plus className="h-4 w-4" />Registrar movimento</Button>
      </div>
      {c.trends.length ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {c.trends.map((t) => (
            <Card key={t.id} tone="white"><CardBody className="pt-5">
              <div className="flex items-start justify-between gap-2">
                <Badge tone={t.kind === "confirmada" ? "green" : t.kind === "tendencia" ? "outline" : "pink"}>{TREND_KIND[t.kind]}</Badge>
                <div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => setIt(t)} aria-label="Editar"><Pencil className="h-3.5 w-3.5" /></Button><Button size="icon" variant="danger" onClick={() => patch({ trends: c.trends.filter((x) => x.id !== t.id) })} aria-label="Excluir"><Trash2 className="h-3.5 w-3.5" /></Button></div>
              </div>
              <h3 className="mt-2 font-display text-[15px] font-semibold text-green">{t.what}</h3>
              <dl className="mt-2 space-y-1.5 text-xs text-ink-soft">
                <div><dt className="inline font-medium text-ink">Desde: </dt><dd className="inline">{t.since ? fmtDate(t.since) : "—"}</dd></div>
                <div><dt className="inline font-medium text-ink">Fonte: </dt><dd className="inline">{t.url ? <a href={t.url} className="underline" target="_blank" rel="noreferrer">{t.source}</a> : t.source || "—"}</dd></div>
                <div><dt className="inline font-medium text-ink">Por que importa: </dt><dd className="inline">{t.why}</dd></div>
                <div><dt className="inline font-medium text-ink">Oportunidades profissionais: </dt><dd className="inline">{t.opportunities}</dd></div>
                <div><dt className="inline font-medium text-ink">Competências em alta: </dt><dd className="inline">{t.skills}</dd></div>
              </dl>
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-pink-50 p-2.5 text-xs text-pink-700"><Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span><strong>Publicação ou networking:</strong> {t.action}</span></div>
            </CardBody></Card>
          ))}
        </div>
      ) : <Empty title="Nenhum movimento registrado">Registre notícias, expansões, lançamentos e mudanças organizacionais com fonte e data. Integração com provedores de notícias depende de credenciais.</Empty>}
      <ItemDialog title="Movimento estratégico" item={it} onClose={() => setIt(null)}
        onSave={(t) => { patch({ trends: c.trends.some((x) => x.id === t.id) ? c.trends.map((x) => (x.id === t.id ? t : x)) : [...c.trends, t] }); setIt(null); }}
        fields={[{ key: "what", label: "O que está acontecendo", full: true }, { key: "kind", label: "Classificação", type: "select", options: TREND_KIND }, { key: "since", label: "Desde quando", type: "date" }, { key: "source", label: "Fonte" }, { key: "url", label: "Link" }, { key: "why", label: "Por que importa para a empresa", type: "textarea" }, { key: "opportunities", label: "Oportunidades profissionais", type: "textarea" }, { key: "skills", label: "Competências que ganham relevância", full: true }, { key: "action", label: "Como transformar em publicação ou networking", type: "textarea" }]} />
    </div>
  );
}

const PERSON_TYPE = { lideranca: "Liderança", recrutador: "Recrutador(a)", especialista: "Especialista técnico", area_interesse: "Área de interesse", cultura: "Cultura / desafios do setor" };
const DATA_Q = { comparavel: "Métricas comparáveis", parcial: "Métricas parciais", qualitativa: "Análise qualitativa" };

function PeopleContent({ c, patch }: { c: Company; patch: (p: Partial<Company>) => void }) {
  const [it, setIt] = useState<PeopleContentInsight | null>(null);
  const count = (k: keyof PeopleContentInsight) => Object.entries(c.peopleContent.reduce<Record<string, number>>((a, x) => ({ ...a, [String(x[k])]: (a[String(x[k])] ?? 0) + 1 }), {}));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-2xl text-xs text-ink-soft">Registre observações sobre publicações públicas de profissionais da empresa — temas, formatos, aberturas. Resuma com suas palavras; não copie textos. Alcance e impressões de terceiros não são públicos e não devem ser estimados.</p>
        <Button onClick={() => setIt({ id: uid("pc"), personType: "lideranca", theme: "", format: "", opening: "", approach: "", observable: "", dataQuality: "qualitativa", source: "" })}><Plus className="h-4 w-4" />Registrar observação</Button>
      </div>
      {c.peopleContent.length ? (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Card><CardHeader title="Temas recorrentes" /><CardBody className="flex flex-wrap gap-1">{count("theme").map(([k, n]) => <Badge key={k} tone="green">{k} · {n}</Badge>)}</CardBody></Card>
            <Card><CardHeader title="Formatos" /><CardBody className="flex flex-wrap gap-1">{count("format").map(([k, n]) => <Badge key={k} tone="outline">{k} · {n}</Badge>)}</CardBody></Card>
            <Card><CardHeader title="Qualidade dos dados" /><CardBody className="flex flex-wrap gap-1">{count("dataQuality").map(([k, n]) => <Badge key={k} tone={k === "comparavel" ? "green" : "amber"}>{DATA_Q[k as keyof typeof DATA_Q]} · {n}</Badge>)}</CardBody></Card>
          </div>
          <Card><CardBody className="overflow-x-auto pt-5">
            <table className="w-full min-w-[720px] text-xs">
              <thead className="text-left text-ink-mute"><tr><th className="py-2">Perfil</th><th>Tema</th><th>Formato</th><th>Abertura</th><th>Abordagem</th><th>Resultado observável</th><th>Dados</th><th /></tr></thead>
              <tbody className="divide-y divide-paper-line">{c.peopleContent.map((p) => <tr key={p.id}><td className="py-2">{PERSON_TYPE[p.personType]}</td><td>{p.theme}</td><td>{p.format}</td><td>{p.opening}</td><td>{p.approach}</td><td>{p.observable}</td><td><Badge tone={p.dataQuality === "comparavel" ? "green" : "amber"}>{DATA_Q[p.dataQuality]}</Badge></td>
                <td><Button size="icon" variant="danger" onClick={() => patch({ peopleContent: c.peopleContent.filter((x) => x.id !== p.id) })} aria-label="Excluir"><Trash2 className="h-3.5 w-3.5" /></Button></td></tr>)}</tbody>
            </table>
          </CardBody></Card>
          <Card tone="green"><CardHeader eyebrow="Relatório" title="O que posso aprender com esses conteúdos" /><CardBody className="text-sm text-paper/85">
            {c.peopleContent.every((p) => p.dataQuality !== "comparavel") && <p className="mb-2 text-xs text-pink-300">Sem métricas comparáveis: as conclusões abaixo são qualitativas.</p>}
            <ul className="list-inside list-disc space-y-1">
              {count("theme").slice(0, 2).map(([k]) => <li key={k}>Tema presente na amostra: “{k}”. Considere abordar a partir da sua experiência — sem replicar o conteúdo.</li>)}
              {count("format").slice(0, 1).map(([k]) => <li key={k}>Formato mais usado na amostra: {k}. Teste em uma das suas próximas publicações.</li>)}
              <li>Amostra de {c.peopleContent.length} observação(ões) — pequena para generalizar.</li>
            </ul>
          </CardBody></Card>
        </>
      ) : <Empty title="Nenhuma observação registrada" />}
      <ItemDialog title="Observação de conteúdo" item={it} onClose={() => setIt(null)} onSave={(p) => { patch({ peopleContent: [...c.peopleContent, p] }); setIt(null); }}
        fields={[{ key: "personType", label: "Tipo de profissional", type: "select", options: PERSON_TYPE }, { key: "dataQuality", label: "Qualidade dos dados", type: "select", options: DATA_Q }, { key: "theme", label: "Tema" }, { key: "format", label: "Formato" }, { key: "opening", label: "Tipo de abertura" }, { key: "approach", label: "Abordagem narrativa" }, { key: "observable", label: "Resultado observável (reações/comentários visíveis)", full: true }, { key: "source", label: "Fonte / link", full: true }]} />
    </div>
  );
}

const SEVERITY = { baixa: "Baixa", media: "Média", alta: "Alta" };
const EVOLUTION = { persistente: "Persistente", em_melhora: "Em melhora", isolado: "Isolado", indefinido: "Indefinido" };

function Pains({ c, patch }: { c: Company; patch: (p: Partial<Company>) => void }) {
  const [it, setIt] = useState<Pain | null>(null);
  const [aud, setAud] = useState<PainAudience>("consumidores");
  const list = c.pains.filter((p) => p.audience === aud);
  const blank = (): Pain => ({ id: uid("pain"), audience: aud, theme: "", category: "", recurrence: 0, sampleSize: 0, severity: "media", summary: "", source: "", url: "", period: "", companyResponse: "", evolution: "indefinido", causeHypothesis: "", opportunity: "" });
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Tabs value={aud} onChange={setAud} items={(Object.keys(PAIN_AUDIENCE) as PainAudience[]).map((k) => ({ value: k, label: PAIN_AUDIENCE[k], count: c.pains.filter((p) => p.audience === k).length }))} />
        <Button className="ml-auto" onClick={() => setIt(blank())}><Plus className="h-4 w-4" />Registrar dor</Button>
      </div>
      <p className="flex items-start gap-2 text-xs text-ink-soft"><TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber" />Categorias mantidas separadas — não há nota única. Recorrência = ocorrências do tema ÷ tamanho da amostra analisada. Avaliações públicas não representam necessariamente todos os clientes ou funcionários. Não registre dados pessoais.</p>
      {list.length ? (
        <>
          <Card>
            <CardHeader title="Recorrência na amostra" description="% das avaliações analisadas que citam o tema" />
            <CardBody><BarsChart layout="vertical" height={Math.max(140, list.length * 40)} x="theme" unit="%" series={[{ key: "pct", name: "Recorrência" }]} data={list.map((p) => ({ theme: p.theme, pct: p.sampleSize ? Math.round((p.recurrence / p.sampleSize) * 100) : 0 }))} /></CardBody>
          </Card>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {list.map((p) => {
              const pattern = p.sampleSize >= 20 && p.recurrence / Math.max(1, p.sampleSize) >= 0.1;
              return (
                <Card key={p.id} tone="white"><CardBody className="pt-5">
                  <div className="flex flex-wrap items-center gap-1">
                    <Badge tone={p.severity === "alta" ? "solidPink" : p.severity === "media" ? "pink" : "outline"}>gravidade {SEVERITY[p.severity]}</Badge>
                    <Badge tone={pattern ? "solidGreen" : "outline"}>{pattern ? "padrão recorrente" : p.sampleSize < 20 ? "amostra pequena" : "pontual"}</Badge>
                    <Badge tone="outline">{EVOLUTION[p.evolution]}</Badge>
                    <div className="ml-auto flex"><Button size="icon" variant="ghost" onClick={() => setIt(p)} aria-label="Editar"><Pencil className="h-3.5 w-3.5" /></Button><Button size="icon" variant="danger" onClick={() => patch({ pains: c.pains.filter((x) => x.id !== p.id) })} aria-label="Excluir"><Trash2 className="h-3.5 w-3.5" /></Button></div>
                  </div>
                  <h3 className="mt-2 font-display text-[15px] font-semibold text-green">{p.theme}</h3>
                  <div className="text-[11px] text-ink-mute">{p.category} · {p.recurrence} de {p.sampleSize} na amostra · {p.period}</div>
                  <p className="mt-2 text-xs text-ink-soft">{p.summary}</p>
                  <dl className="mt-2 space-y-1 text-xs">
                    <div><dt className="inline font-medium">Resposta pública da empresa: </dt><dd className="inline text-ink-soft">{p.companyResponse || "Não identificada"}</dd></div>
                    <div><dt className="inline font-medium">Possível causa </dt><Badge tone="pink">hipótese</Badge><dd className="mt-0.5 text-ink-soft">{p.causeHypothesis}</dd></div>
                    <div><dt className="inline font-medium">Oportunidade profissional: </dt><dd className="inline text-green-600">{p.opportunity}</dd></div>
                  </dl>
                  <div className="mt-2 text-[10px] text-ink-mute">Fonte: {p.url ? <a href={p.url} target="_blank" rel="noreferrer" className="underline">{p.source}</a> : p.source}</div>
                </CardBody></Card>
              );
            })}
          </div>
        </>
      ) : <Empty title={`Nenhuma dor registrada em “${PAIN_AUDIENCE[aud]}”`}>Analise fontes públicas autorizadas e registre temas com amostra e período. Não há coleta automática de avaliações nesta versão.</Empty>}
      <ItemDialog title="Dor ou problema público" item={it} onClose={() => setIt(null)}
        onSave={(p) => { patch({ pains: c.pains.some((x) => x.id === p.id) ? c.pains.map((x) => (x.id === p.id ? p : x)) : [...c.pains, p] }); setIt(null); }}
        fields={[{ key: "theme", label: "Tema do problema" }, { key: "audience", label: "Categoria de fonte", type: "select", options: PAIN_AUDIENCE }, { key: "category", label: "Categoria (ex.: processos, infraestrutura)" }, { key: "severity", label: "Gravidade potencial", type: "select", options: SEVERITY },
          { key: "recurrence", label: "Ocorrências na amostra", type: "number" }, { key: "sampleSize", label: "Tamanho da amostra", type: "number" }, { key: "period", label: "Período analisado" }, { key: "evolution", label: "Evolução", type: "select", options: EVOLUTION },
          { key: "summary", label: "Evidências resumidas (sem dados pessoais)", type: "textarea" }, { key: "companyResponse", label: "Resposta pública da empresa", type: "textarea" }, { key: "causeHypothesis", label: "Possível causa (hipótese)", type: "textarea" }, { key: "opportunity", label: "Oportunidade profissional relacionada", type: "textarea" }, { key: "source", label: "Fonte original" }, { key: "url", label: "Link" }]} />
    </div>
  );
}

function ValueTab({ c, patch }: { c: Company; patch: (p: Partial<Company>) => void }) {
  const v = c.valueCreation;
  const fields: [keyof Company["valueCreation"], string][] = [["problems", "Problemas da empresa que se conectam à minha experiência"], ["skills", "Minhas competências relevantes"], ["areas", "Áreas onde investigar oportunidades"], ["content", "Conteúdo que eu poderia publicar"], ["people", "Profissionais com quem criar conexão"], ["develop", "Competências que preciso desenvolver"], ["profile", "Como adaptar meu LinkedIn"], ["nextStep", "Próximo passo concreto e realista"]];
  const suggest = () => {
    const pains = c.pains.filter((p) => p.opportunity && p.opportunity !== "—");
    patch({ valueCreation: {
      problems: v.problems || pains.map((p) => p.theme).slice(0, 3).join("; "),
      skills: v.skills || c.areas.slice(0, 4).join(", "),
      areas: v.areas || c.likelyRoles.join(", "),
      content: v.content || (c.trends[0]?.action ?? ""),
      people: v.people || "Profissionais das áreas de " + c.areas.slice(0, 2).join(" e "),
      develop: v.develop, profile: v.profile, nextStep: v.nextStep || "Identificar 3 pessoas da área e pedir uma conversa breve de 15 min.",
    } });
  };
  return (
    <Card>
      <CardHeader title="Como posso gerar valor para essa empresa?" description="Recomendações pessoais. Edite livremente — o NEXO só pré-preenche a partir das dores, tendências e áreas registradas."
        action={<Button size="sm" variant="subtle" onClick={suggest}><Lightbulb className="h-3.5 w-3.5" />Pré-preencher com o dossiê</Button>} />
      <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {fields.map(([k, l]) => (
          <Field key={k} label={l} className={cn(k === "nextStep" && "md:col-span-2")}>
            <Textarea className={cn("min-h-[70px]", k === "nextStep" && "border-pink/40 bg-pink-50/40")} value={v[k]} onChange={(e) => patch({ valueCreation: { ...v, [k]: e.target.value } })} />
          </Field>
        ))}
      </CardBody>
    </Card>
  );
}

export default function Page() { return <Suspense><Inner /></Suspense>; }
