"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Building2, Loader2, Plus, Search, SlidersHorizontal, Sparkles, TriangleAlert, X } from "lucide-react";
import { useAI } from "@/lib/ai-client";
import { useStore } from "@/lib/store";
import { useDerived } from "@/lib/hooks";
import type { BrandWeights, Company } from "@/lib/types";
import { cn, fmtDate } from "@/lib/utils";
import { blankCompany } from "@/lib/factories";
import { Badge, Button, Card, CardBody, Dialog, Empty, Field, Input, TagInput } from "@/components/ui";
import { ConfidenceBadge, MethodNote, OriginBadge, PageHeader, ScoreRing } from "@/components/nexo";

export default function Brands() {
  const { add, data, toast, research, runResearch, dismissResearch } = useStore();
  const d = useDerived();
  const router = useRouter();
  const ai = useAI();
  const [creating, setCreating] = useState<Company | null>(null);
  const [manual, setManual] = useState(false);
  const [wOpen, setWOpen] = useState(false);
  const list = d.companies.map((c) => ({ c, f: d.brandFits.get(c.id)! })).sort((a, b) => (b.f.total ?? -1) - (a.f.total ?? -1));
  const suggestions = data.profile.companiesOfInterest.filter((n) => !d.companies.some((c) => c.name.toLowerCase() === n.toLowerCase()));

  const create = () => {
    if (!creating?.name.trim()) return toast("Informe o nome da empresa.", "warn");
    add("companies", creating);
    toast("Dossiê criado — complete as seções com fontes");
    router.push(`/marcas/${creating.id}`);
  };
  const auto = (name: string, website = "") => {
    if (!name.trim()) return toast("Informe o nome da empresa.", "warn");
    if (research.some((r) => r.key === name.toLowerCase() && !r.error)) return;
    setCreating(null);
    runResearch(name.trim(), website.trim());
  };
  const openNew = (name = "") => { setManual(false); setCreating(blankCompany(name)); };

  return (
    <>
      <PageHeader index="07" title="Inteligência de marcas" description="Dossiês de empresas com fontes, tendências, dores públicas e o NEXO Brand Fit — uma estimativa analítica, não uma avaliação da empresa nem previsão de contratação."
        actions={<><Button variant="outline" onClick={() => setWOpen(true)}><SlidersHorizontal className="h-4 w-4" />Pesos do Brand Fit</Button><Button onClick={() => openNew()}><Sparkles className="h-4 w-4" />Nova empresa</Button></>} />

      <ResearchPanel jobs={research} onDismiss={dismissResearch} onRetry={(n) => auto(n)} />

      {suggestions.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-paper-line bg-paper-card px-4 py-3 text-xs">
          <span className="text-ink-soft">Empresas de interesse no seu perfil sem dossiê:</span>
          {suggestions.map((n) => <Button key={n} size="sm" variant="subtle" onClick={() => (ai === "ready" ? auto(n) : openNew(n))}>{ai === "ready" ? <Sparkles className="h-3 w-3" /> : <Plus className="h-3 w-3" />}{n}</Button>)}
        </div>
      )}

      {list.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map(({ c, f }, i) => (
            <Link key={c.id} href={`/marcas/${c.id}`}>
              <Card tone={i === 0 ? "green" : "white"} className="group h-full transition hover:-translate-y-0.5">
                <CardBody className="flex h-full flex-col pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap gap-1"><OriginBadge origin={c.origin} />{f.partial && <Badge tone="amber">análise parcial</Badge>}</div>
                      <h3 className={cn("font-display text-lg font-semibold leading-tight", i === 0 ? "text-paper" : "text-green group-hover:text-pink")}>{c.name}</h3>
                      <div className="text-xs opacity-70">{c.sector || "Setor não informado"}{c.hq && ` · ${c.hq}`}</div>
                    </div>
                    <ScoreRing value={f.total} size={84} label="Brand Fit" track={i === 0 ? "rgba(245,240,232,.15)" : undefined} />
                  </div>
                  <div className="mt-4 space-y-1.5">
                    {f.dimensions.map((dm) => (
                      <div key={dm.key} className="flex items-center gap-2 text-[11px]">
                        <span className="w-40 truncate opacity-70">{dm.label}</span>
                        <div className={cn("h-1 flex-1 rounded-full", i === 0 ? "bg-white/15" : "bg-paper-deep")}><div className="h-full rounded-full bg-pink" style={{ width: `${dm.score ?? 0}%` }} /></div>
                        <span className="w-7 text-right font-medium">{dm.score ?? "—"}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-4 text-[11px] opacity-70">
                    <span>{c.trends.length} tendências · {c.pains.length} dores · {c.evidence.length} fontes</span>
                    <span>{c.lastResearchAt ? fmtDate(c.lastResearchAt) : "sem pesquisa"}</span>
                  </div>
                  <div className="mt-2"><ConfidenceBadge confidence={f.confidence} coverage={f.coverage} /></div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      ) : <Empty icon={<Building2 className="h-8 w-8" />} title="Nenhuma empresa cadastrada" action={<Button onClick={() => openNew()}>Criar primeiro dossiê</Button>}>Cadastre empresas que você admira. O NEXO organiza a pesquisa e calcula o Brand Fit com o que estiver documentado.</Empty>}

      <div className="mt-6">
        <MethodNote title="NEXO Brand Fit — metodologia">
          <p>Competências × áreas de atuação ({data.settings.brandWeights.skills}%) · Experiência × trajetórias ({data.settings.brandWeights.experience}%) · Valores e cultura declarados ({data.settings.brandWeights.values}%) · Interesses e objetivos ({data.settings.brandWeights.interests}%) · Cargos disponíveis ({data.settings.brandWeights.roles}%).</p>
          <p>Dimensões sem dados são excluídas e os pesos redistribuídos; a análise é marcada como parcial e a confiança cai. Valores declarados pela empresa são discurso institucional — confirme com fontes independentes.</p>
        </MethodNote>
      </div>

      <Dialog open={!!creating} onClose={() => setCreating(null)} title="Nova empresa"
        footer={manual || ai !== "ready"
          ? <><Button variant="ghost" onClick={() => setManual(false)} className={cn(ai !== "ready" && "hidden")}>Voltar</Button><Button onClick={create}>Criar dossiê manual</Button></>
          : <><Button variant="ghost" onClick={() => setManual(true)}>Preencher manualmente</Button><Button onClick={() => auto(creating!.name, creating!.website)}><Search className="h-4 w-4" />Gerar dossiê automático</Button></>}>
        {creating && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Nome da empresa"><Input autoFocus value={creating.name} onChange={(e) => setCreating({ ...creating, name: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter" && ai === "ready" && !manual) auto(creating.name, creating.website); }} /></Field>
              <Field label="Site oficial" hint="opcional — ajuda a achar a empresa certa"><Input placeholder="https://" value={creating.website} onChange={(e) => setCreating({ ...creating, website: e.target.value })} /></Field>
            </div>
            {ai === "ready" && !manual && (
              <div className="rounded-xl bg-green-50 p-3 text-xs text-green-700">
                <Sparkles className="mr-1 inline h-3.5 w-3.5 text-pink" />O NEXO pesquisa na web — site, notícias, relatórios e avaliações públicas — e preenche as 6 seções com as fontes. Leva de 1 a 4 minutos e continua mesmo se você trocar de página. Links que a pesquisa não confirmou são removidos.
              </div>
            )}
            {ai === "needs_code" && <div className="rounded-xl bg-amber-100 p-3 text-xs text-amber">A pesquisa automática está ativa no servidor, mas este aparelho ainda não tem o código de acesso. Cadastre em <a className="underline" href="/perfil?tab=integracoes">Perfil → Integrações</a>.</div>}
            {ai === "off" && <div className="rounded-xl bg-paper p-3 text-xs text-ink-soft">A geração automática precisa da chave da API do Claude configurada na Vercel. Veja <a className="underline" href="/perfil?tab=integracoes">Perfil → Integrações</a>. Por enquanto, crie o dossiê manualmente.</div>}
            {(manual || ai !== "ready") && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Setor"><Input value={creating.sector} onChange={(e) => setCreating({ ...creating, sector: e.target.value })} /></Field>
                <Field label="Sede"><Input value={creating.hq} onChange={(e) => setCreating({ ...creating, hq: e.target.value })} /></Field>
                <Field label="Áreas de atuação relevantes" hint="vírgulas" className="sm:col-span-2"><TagInput value={creating.areas} onChange={(v) => setCreating({ ...creating, areas: v })} placeholder="Gestão de facilities, Visual merchandising…" /></Field>
                <Field label="Valores declarados" hint="da fonte oficial" className="sm:col-span-2"><TagInput value={creating.declaredValues} onChange={(v) => setCreating({ ...creating, declaredValues: v })} /></Field>
              </div>
            )}
          </div>
        )}
      </Dialog>
      <WeightsDialog open={wOpen} onClose={() => setWOpen(false)} />
    </>
  );
}

function WeightsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, setSettings, toast } = useStore();
  const [w, setW] = useState<BrandWeights>(data.settings.brandWeights);
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  const labels: Record<keyof BrandWeights, string> = { skills: "Competências × áreas", experience: "Experiência × trajetórias", values: "Valores e cultura", interests: "Interesses e objetivos", roles: "Cargos disponíveis" };
  return (
    <Dialog open={open} onClose={onClose} title="Pesos do NEXO Brand Fit"
      footer={<><Button variant="ghost" onClick={() => setW({ skills: 25, experience: 25, values: 20, interests: 15, roles: 15 })}>Restaurar padrão</Button><Button disabled={total !== 100} onClick={() => { setSettings({ brandWeights: w }); toast("Pesos atualizados"); onClose(); }}>Aplicar</Button></>}>
      <div className="space-y-4">
        {(Object.keys(w) as (keyof BrandWeights)[]).map((k) => (
          <div key={k}>
            <div className="mb-1 flex justify-between text-xs"><span>{labels[k]}</span><span className="font-display font-semibold text-green">{w[k]}%</span></div>
            <input type="range" min={0} max={60} step={5} className="w-full" value={w[k]} onChange={(e) => setW({ ...w, [k]: Number(e.target.value) })} />
          </div>
        ))}
        <p className={cn("text-xs", total === 100 ? "text-green-600" : "text-pink-700")}>Total: {total}%</p>
      </div>
    </Dialog>
  );
}

function ResearchPanel({ jobs, onDismiss, onRetry }: { jobs: { key: string; name: string; startedAt: number; error?: string }[]; onDismiss: (k: string) => void; onRetry: (n: string) => void }) {
  const [, tick] = useState(0);
  useEffect(() => { if (!jobs.some((j) => !j.error)) return; const t = setInterval(() => tick((x) => x + 1), 1000); return () => clearInterval(t); }, [jobs]);
  if (!jobs.length) return null;
  const steps = ["Buscando site institucional", "Lendo notícias recentes", "Procurando avaliações públicas", "Cruzando com seu perfil", "Conferindo fontes"];
  return (
    <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
      {jobs.map((j) => {
        const secs = Math.floor((Date.now() - j.startedAt) / 1000);
        return (
          <div key={j.key} className={cn("flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm", j.error ? "border-pink/40 bg-pink-50" : "border-green-100 bg-white")}>
            {j.error ? <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-pink" /> : <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-pink" />}
            <div className="min-w-0 flex-1">
              <div className="font-display font-semibold text-green">{j.name}</div>
              {j.error ? <div className="text-xs text-pink-700">{j.error}</div>
                : <div className="text-xs text-ink-mute">{steps[Math.min(steps.length - 1, Math.floor(secs / 25))]}… {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")}</div>}
            </div>
            {j.error && <><Button size="sm" variant="outline" onClick={() => onRetry(j.name)}>Tentar de novo</Button><Button size="icon" variant="ghost" onClick={() => onDismiss(j.key)} aria-label="Fechar"><X className="h-4 w-4" /></Button></>}
          </div>
        );
      })}
    </div>
  );
}
