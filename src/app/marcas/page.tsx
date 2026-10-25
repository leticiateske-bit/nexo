"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Building2, Plus, SlidersHorizontal } from "lucide-react";
import { useStore } from "@/lib/store";
import { useDerived } from "@/lib/hooks";
import type { BrandWeights, Company } from "@/lib/types";
import { cn, fmtDate } from "@/lib/utils";
import { blankCompany } from "@/lib/factories";
import { Badge, Button, Card, CardBody, Dialog, Empty, Field, Input, TagInput } from "@/components/ui";
import { ConfidenceBadge, MethodNote, OriginBadge, PageHeader, ScoreRing } from "@/components/nexo";

export default function Brands() {
  const { add, data, toast } = useStore();
  const d = useDerived();
  const router = useRouter();
  const [creating, setCreating] = useState<Company | null>(null);
  const [wOpen, setWOpen] = useState(false);
  const list = d.companies.map((c) => ({ c, f: d.brandFits.get(c.id)! })).sort((a, b) => (b.f.total ?? -1) - (a.f.total ?? -1));
  const suggestions = data.profile.companiesOfInterest.filter((n) => !d.companies.some((c) => c.name.toLowerCase() === n.toLowerCase()));

  const create = () => {
    if (!creating?.name.trim()) return toast("Informe o nome da empresa.", "warn");
    add("companies", creating);
    toast("Dossiê criado — complete as seções com fontes");
    router.push(`/marcas/${creating.id}`);
  };

  return (
    <>
      <PageHeader index="07" title="Inteligência de marcas" description="Dossiês de empresas com fontes, tendências, dores públicas e o NEXO Brand Fit — uma estimativa analítica, não uma avaliação da empresa nem previsão de contratação."
        actions={<><Button variant="outline" onClick={() => setWOpen(true)}><SlidersHorizontal className="h-4 w-4" />Pesos do Brand Fit</Button><Button onClick={() => setCreating(blankCompany())}><Plus className="h-4 w-4" />Nova empresa</Button></>} />

      {suggestions.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-paper-line bg-paper-card px-4 py-3 text-xs">
          <span className="text-ink-soft">Empresas de interesse no seu perfil sem dossiê:</span>
          {suggestions.map((n) => <Button key={n} size="sm" variant="subtle" onClick={() => setCreating(blankCompany(n))}><Plus className="h-3 w-3" />{n}</Button>)}
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
      ) : <Empty icon={<Building2 className="h-8 w-8" />} title="Nenhuma empresa cadastrada" action={<Button onClick={() => setCreating(blankCompany())}>Criar primeiro dossiê</Button>}>Cadastre empresas que você admira. O NEXO organiza a pesquisa e calcula o Brand Fit com o que estiver documentado.</Empty>}

      <div className="mt-6">
        <MethodNote title="NEXO Brand Fit — metodologia">
          <p>Competências × áreas de atuação ({data.settings.brandWeights.skills}%) · Experiência × trajetórias ({data.settings.brandWeights.experience}%) · Valores e cultura declarados ({data.settings.brandWeights.values}%) · Interesses e objetivos ({data.settings.brandWeights.interests}%) · Cargos disponíveis ({data.settings.brandWeights.roles}%).</p>
          <p>Dimensões sem dados são excluídas e os pesos redistribuídos; a análise é marcada como parcial e a confiança cai. Valores declarados pela empresa são discurso institucional — confirme com fontes independentes.</p>
        </MethodNote>
      </div>

      <Dialog open={!!creating} onClose={() => setCreating(null)} title="Nova empresa" footer={<Button onClick={create}>Criar dossiê</Button>}>
        {creating && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Nome"><Input value={creating.name} onChange={(e) => setCreating({ ...creating, name: e.target.value })} /></Field>
            <Field label="Setor"><Input value={creating.sector} onChange={(e) => setCreating({ ...creating, sector: e.target.value })} /></Field>
            <Field label="Site oficial"><Input placeholder="https://" value={creating.website} onChange={(e) => setCreating({ ...creating, website: e.target.value })} /></Field>
            <Field label="Sede"><Input value={creating.hq} onChange={(e) => setCreating({ ...creating, hq: e.target.value })} /></Field>
            <Field label="Áreas de atuação relevantes" hint="vírgulas" className="sm:col-span-2"><TagInput value={creating.areas} onChange={(v) => setCreating({ ...creating, areas: v })} placeholder="Gestão de facilities, Visual merchandising…" /></Field>
            <Field label="Valores declarados" hint="da fonte oficial" className="sm:col-span-2"><TagInput value={creating.declaredValues} onChange={(v) => setCreating({ ...creating, declaredValues: v })} /></Field>
            <Field label="Cargos prováveis de interesse" className="sm:col-span-2"><TagInput value={creating.likelyRoles} onChange={(v) => setCreating({ ...creating, likelyRoles: v })} /></Field>
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
