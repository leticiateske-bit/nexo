"use client";

import { Suspense, useMemo, useState } from "react";
import { BookMarked, ChevronLeft, ChevronRight, ExternalLink, FlaskConical, Lightbulb, Plus, Trash2, Wand2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useTab } from "@/lib/use-tab";
import { generateIdeas, generatePost, themePerformance, type Idea } from "@/lib/engine/content";
import { POST_APPROACH, POST_FORMAT, POST_OBJECTIVE, POST_STATUS } from "@/lib/labels";
import type { Post, PostApproach, PostObjective, PostStatus, Reference } from "@/lib/types";
import { addDays, cn, fmtDate, nowISO, todayISO, uid, weekStart } from "@/lib/utils";
import { Badge, Button, Card, CardBody, CardHeader, Dialog, Empty, Field, Input, Select, Tabs, TagInput, Textarea } from "@/components/ui";
import { MethodNote, OriginBadge, PageHeader } from "@/components/nexo";
import { PostEditor } from "@/components/post-editor";
import { BarsChart } from "@/components/charts";

const TABS = ["gerador", "calendario", "biblioteca", "desempenho"] as const;
type Tab = (typeof TABS)[number];

const STATUS_TONE: Record<PostStatus, string> = {
  ideia: "bg-paper-deep text-ink-soft", rascunho: "bg-amber-100 text-amber", revisao: "bg-pink-100 text-pink-700", publicado: "bg-green text-paper", arquivado: "bg-paper-line text-ink-mute line-through",
};

function Inner() {
  const [tab, setTab] = useTab<Tab>("gerador", TABS);
  const { view, data } = useStore();
  const [editing, setEditing] = useState<Post | null>(null);
  const posts = view("posts");
  const newBlank = () => setEditing(generatePost({ objective: "posicionamento", approach: "pessoal", theme: data.profile.interests[0]?.area ?? "Carreira" }, data.profile));
  return (
    <>
      <PageHeader index="03" title="Estúdio de conteúdo" description="Pautas a partir da sua experiência, interesses, empresas-alvo e lacunas das vagas. O NEXO nunca publica por você."
        actions={<Button onClick={newBlank}><Plus className="h-4 w-4" />Nova publicação</Button>} />
      <Tabs className="mb-5" value={tab} onChange={setTab} items={[
        { value: "gerador", label: "Gerador de pautas" }, { value: "calendario", label: "Calendário editorial", count: posts.length },
        { value: "biblioteca", label: "Biblioteca", count: view("references").length }, { value: "desempenho", label: "Desempenho" },
      ]} />
      {tab === "gerador" && <Generator onCreate={setEditing} />}
      {tab === "calendario" && <Calendar posts={posts} onOpen={setEditing} />}
      {tab === "biblioteca" && <Library />}
      {tab === "desempenho" && <Performance posts={posts} />}
      <PostEditor post={editing} open={!!editing} onClose={() => setEditing(null)} />
    </>
  );
}

function Generator({ onCreate }: { onCreate: (p: Post) => void }) {
  const { data } = useStore();
  const [seed, setSeed] = useState(0);
  const ideas = useMemo(() => generateIdeas(data), [data, seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const [obj, setObj] = useState<PostObjective | "all">("all");
  const [pick, setPick] = useState<Idea | null>(null);
  const [approach, setApproach] = useState<PostApproach>("tecnica");
  const list = ideas.filter((i) => obj === "all" || i.objective === obj);
  const preview = pick ? generatePost({ objective: pick.objective, approach, theme: pick.theme, format: pick.format, trend: pick.trend, title: pick.title }, data.profile) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select className="w-auto" value={obj} onChange={(e) => setObj(e.target.value as PostObjective | "all")}>
          <option value="all">Todos os objetivos</option>
          {Object.entries(POST_OBJECTIVE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Button variant="outline" onClick={() => setSeed(seed + 1)}><Wand2 className="h-4 w-4" />Gerar novamente</Button>
        <span className="text-xs text-ink-mute">{list.length} pautas · geradas localmente a partir do seu perfil</span>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {list.map((i) => (
          <Card key={i.id} tone="white" className="flex flex-col">
            <CardBody className="flex flex-1 flex-col pt-5">
              <div className="mb-2 flex flex-wrap gap-1">
                <Badge tone="green">{POST_OBJECTIVE[i.objective]}</Badge>
                <Badge tone="outline">{POST_FORMAT[i.format]}</Badge>
                {i.trend?.kind === "hipotese" && <Badge tone="pink">hipótese</Badge>}
              </div>
              <h3 className="font-display text-[15px] font-semibold leading-snug text-green">{i.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-ink-soft">{i.why}</p>
              <div className="mt-auto flex items-center justify-between pt-4">
                <span className="text-[11px] text-ink-mute">Base: {i.basedOn}</span>
                <Button size="sm" onClick={() => { setPick(i); setApproach(i.approach); }}><Lightbulb className="h-3.5 w-3.5" />Desenvolver</Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
      <MethodNote title="Como as pautas e textos são gerados">
        <p>Gerador local baseado em regras: cruza suas áreas de interesse (pela ordem de prioridade), competências mais fortes, cargos-alvo, tendências dos dossiês de empresas, lacunas das vagas e o desempenho das suas publicações.</p>
        <p>Os rascunhos deixam <strong>[colchetes]</strong> onde é preciso um fato real que o NEXO não conhece — números, resultados, nomes. Nada é inventado. A integração com IA generativa é uma etapa futura e também exigirá revisão humana.</p>
      </MethodNote>

      <Dialog open={!!pick} onClose={() => setPick(null)} wide title="Escolha a abordagem"
        footer={<><Button variant="outline" onClick={() => setPick(null)}>Cancelar</Button><Button onClick={() => { if (preview) { onCreate(preview); setPick(null); } }}>Abrir no editor</Button></>}>
        {pick && preview && (
          <div className="space-y-4">
            <Tabs value={approach} onChange={setApproach} items={(Object.keys(POST_APPROACH) as PostApproach[]).map((a) => ({ value: a, label: POST_APPROACH[a] }))} />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]">
              <div className="whitespace-pre-wrap rounded-2xl border border-paper-line bg-white p-5 text-sm leading-relaxed text-ink">
                <p className="font-semibold">{preview.hook}</p>{"\n"}{preview.body}{"\n\n"}{preview.conclusion}{"\n\n"}<span className="text-green-600">{preview.cta}</span>{"\n\n"}<span className="text-pink-700">{preview.hashtags.join(" ")}</span>
              </div>
              <div className="space-y-3 text-xs text-ink-soft">
                <div><div className="font-semibold text-ink">Formato recomendado</div>{POST_FORMAT[preview.format]}</div>
                <div><div className="font-semibold text-ink">Orientação visual</div>{preview.visualGuide}</div>
                <div><div className="font-semibold text-ink">Público</div>{preview.audience}</div>
                <div><div className="font-semibold text-ink">Justificativa</div>{preview.rationale}</div>
                <div><div className="font-semibold text-ink">Fontes</div>{preview.sources.length ? preview.sources.map((s) => s.label).join(", ") : "Nenhuma afirmação factual externa no modelo. Se adicionar dados, inclua a fonte."}</div>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

function Calendar({ posts, onOpen }: { posts: Post[]; onOpen: (p: Post) => void }) {
  const [mode, setMode] = useState<"semana" | "mes" | "lista">("semana");
  const [anchor, setAnchor] = useState(todayISO());
  const [status, setStatus] = useState<PostStatus | "all">("all");
  const [fmt, setFmt] = useState<string>("all");
  const filtered = posts.filter((p) => (status === "all" || p.status === status) && (fmt === "all" || p.format === fmt));
  const dateOf = (p: Post) => p.publishedDate ?? p.scheduledDate;
  const start = mode === "semana" ? weekStart(anchor) : weekStart(anchor.slice(0, 8) + "01");
  const days = mode === "semana" ? 7 : 42;
  const month = anchor.slice(0, 7);
  const grid = Array.from({ length: days }, (_, i) => addDays(start, i));
  const unscheduled = filtered.filter((p) => !dateOf(p));
  const shift = (dir: number) => setAnchor(mode === "semana" ? addDays(anchor, dir * 7) : (() => { const d = new Date(anchor + "T12:00:00"); d.setMonth(d.getMonth() + dir); return d.toISOString().slice(0, 10); })());

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Tabs value={mode} onChange={setMode} items={[{ value: "semana", label: "Semana" }, { value: "mes", label: "Mês" }, { value: "lista", label: "Lista" }]} />
        {mode !== "lista" && (
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" onClick={() => shift(-1)} aria-label="Anterior"><ChevronLeft className="h-4 w-4" /></Button>
            <span className="min-w-[150px] text-center text-sm font-medium text-green">{mode === "semana" ? `${fmtDate(start, { day: "2-digit", month: "short" })} – ${fmtDate(addDays(start, 6), { day: "2-digit", month: "short" })}` : fmtDate(anchor, { month: "long", year: "numeric" })}</span>
            <Button size="icon" variant="ghost" onClick={() => shift(1)} aria-label="Próximo"><ChevronRight className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" onClick={() => setAnchor(todayISO())}>Hoje</Button>
          </div>
        )}
        <div className="ml-auto flex gap-2">
          <Select className="w-auto" value={status} onChange={(e) => setStatus(e.target.value as PostStatus | "all")}><option value="all">Todos os status</option>{Object.entries(POST_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>
          <Select className="w-auto" value={fmt} onChange={(e) => setFmt(e.target.value)}><option value="all">Todos os formatos</option>{Object.entries(POST_FORMAT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>
        </div>
      </div>

      {mode === "lista" ? (
        <Card><CardBody className="pt-5">
          {filtered.length ? (
            <ul className="divide-y divide-paper-line">
              {filtered.slice().sort((a, b) => (dateOf(b) ?? "9").localeCompare(dateOf(a) ?? "9")).map((p) => (
                <li key={p.id}><button onClick={() => onOpen(p)} className="flex w-full flex-wrap items-center gap-3 py-3 text-left hover:bg-paper/60">
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px]", STATUS_TONE[p.status])}>{POST_STATUS[p.status]}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.title}</span>
                  <span className="text-xs text-ink-mute">{POST_FORMAT[p.format]} · {p.theme}</span>
                  <span className="w-24 text-right text-xs text-ink-mute">{fmtDate(dateOf(p), { day: "2-digit", month: "short" })}</span>
                  {p.origin === "demo" && <OriginBadge origin="demo" />}
                </button></li>
              ))}
            </ul>
          ) : <Empty title="Nenhuma publicação com esses filtros" />}
        </CardBody></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_260px]">
          <div className="overflow-x-auto">
            <div className={cn("grid min-w-[640px] grid-cols-7 gap-1.5")}>
              {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => <div key={d} className="px-2 text-[11px] font-medium uppercase tracking-wider text-ink-mute">{d}</div>)}
              {grid.map((day) => {
                const items = filtered.filter((p) => dateOf(p) === day);
                const other = mode === "mes" && day.slice(0, 7) !== month;
                return (
                  <div key={day} className={cn("rounded-xl border p-1.5", mode === "semana" ? "min-h-[180px]" : "min-h-[96px]", day === todayISO() ? "border-pink bg-white" : "border-paper-line bg-paper-card", other && "opacity-40")}>
                    <div className={cn("mb-1 px-1 text-[11px]", day === todayISO() ? "font-semibold text-pink" : "text-ink-mute")}>{Number(day.slice(8))}</div>
                    <div className="space-y-1">
                      {items.map((p) => (
                        <button key={p.id} onClick={() => onOpen(p)} className={cn("block w-full truncate rounded-lg px-1.5 py-1 text-left text-[11px] leading-tight", STATUS_TONE[p.status])} title={p.title}>
                          {p.origin === "demo" && "◦ "}{p.title}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <Card>
            <CardHeader title="Sem data" description="Ideias e rascunhos ainda não agendados" />
            <CardBody className="space-y-1.5">
              {unscheduled.length ? unscheduled.map((p) => (
                <button key={p.id} onClick={() => onOpen(p)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-paper">
                  <span className={cn("rounded-full px-1.5 py-0.5 text-[10px]", STATUS_TONE[p.status])}>{POST_STATUS[p.status]}</span>
                  <span className="truncate">{p.title}</span>
                </button>
              )) : <p className="text-xs text-ink-mute">Tudo agendado.</p>}
              <p className="pt-2 text-[10px] text-ink-mute">◦ = item demonstrativo</p>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}

function Library() {
  const { view, add, remove, update, toast } = useStore();
  const refs = view("references");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Reference | null>(null);
  const blank = (): Reference => { const t = nowISO(); return { id: uid("ref"), origin: "user", createdAt: t, updatedAt: t, title: "", url: "", kind: "artigo", note: "", tags: [] }; };
  const list = refs.filter((r) => !q || `${r.title} ${r.note} ${r.tags.join(" ")}`.toLowerCase().includes(q.toLowerCase()));
  const exists = editing && refs.some((r) => r.id === editing.id);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input className="max-w-xs" placeholder="Buscar na biblioteca…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button onClick={() => setEditing(blank())}><Plus className="h-4 w-4" />Salvar referência</Button>
      </div>
      {list.length ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {list.map((r) => (
            <Card key={r.id} tone="white"><CardBody className="pt-5">
              <div className="mb-2 flex items-center gap-2"><Badge tone="green">{r.kind}</Badge><OriginBadge origin={r.origin} /></div>
              <button onClick={() => setEditing(r)} className="text-left font-display text-sm font-semibold text-green hover:text-pink">{r.title || "(sem título)"}</button>
              <p className="mt-1 text-xs text-ink-soft">{r.note}</p>
              <div className="mt-3 flex flex-wrap items-center gap-1">
                {r.tags.map((t) => <Badge key={t} tone="outline">{t}</Badge>)}
                {r.url && <a href={r.url} target="_blank" rel="noreferrer" className="ml-auto text-ink-mute hover:text-pink"><ExternalLink className="h-3.5 w-3.5" /></a>}
              </div>
            </CardBody></Card>
          ))}
        </div>
      ) : <Empty icon={<BookMarked className="h-8 w-8" />} title="Biblioteca vazia">Salve artigos, tendências, exemplos públicos e insights — sempre com link para a fonte original.</Empty>}
      <Dialog open={!!editing} onClose={() => setEditing(null)} title={exists ? "Editar referência" : "Nova referência"}
        footer={<>{exists && <Button variant="danger" className="mr-auto" onClick={() => { remove("references", editing!.id); setEditing(null); }}><Trash2 className="h-4 w-4" />Excluir</Button>}
          <Button onClick={() => { if (!editing!.title.trim()) return toast("Informe um título.", "warn"); if (exists) update("references", editing!.id, editing!); else add("references", editing!); toast("Referência salva"); setEditing(null); }}>Salvar</Button></>}>
        {editing && (
          <div className="space-y-3">
            <Field label="Título"><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
            <Field label="Link da fonte original"><Input placeholder="https://" value={editing.url} onChange={(e) => setEditing({ ...editing, url: e.target.value })} /></Field>
            <Field label="Tipo"><Select value={editing.kind} onChange={(e) => setEditing({ ...editing, kind: e.target.value as Reference["kind"] })}>{["artigo", "tendencia", "exemplo", "insight", "dado"].map((k) => <option key={k}>{k}</option>)}</Select></Field>
            <Field label="Anotação" hint="resuma com suas palavras — não copie o texto de terceiros"><Textarea value={editing.note} onChange={(e) => setEditing({ ...editing, note: e.target.value })} /></Field>
            <Field label="Tags" hint="separadas por vírgula"><TagInput value={editing.tags} onChange={(v) => setEditing({ ...editing, tags: v })} /></Field>
          </div>
        )}
      </Dialog>
    </div>
  );
}

function Performance({ posts }: { posts: Post[] }) {
  const [dim, setDim] = useState<"theme" | "format" | "objective" | "approach">("format");
  const perf = themePerformance(posts, dim);
  const labelOf = (k: string) => (dim === "format" ? POST_FORMAT[k as keyof typeof POST_FORMAT] : dim === "objective" ? POST_OBJECTIVE[k as PostObjective] : dim === "approach" ? POST_APPROACH[k as PostApproach] : k) ?? k;
  const pub = posts.filter((p) => p.status === "publicado");
  const withRes = pub.filter((p) => p.results.reactions !== null || p.results.comments !== null);
  const demo = withRes.some((p) => p.origin === "demo");
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Tabs value={dim} onChange={setDim} items={[{ value: "format", label: "Por formato" }, { value: "theme", label: "Por tema" }, { value: "objective", label: "Por objetivo" }, { value: "approach", label: "Por abordagem" }]} />
        {demo && <OriginBadge origin="demo" />}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Interações médias por publicação" description="Reações + comentários + compartilhamentos ÷ nº de publicações com resultados registrados." />
          <CardBody>
            {perf.length ? <BarsChart height={240} x="label" series={[{ key: "avg", name: "Interações médias" }]} data={perf.map((p) => ({ label: labelOf(p.key), avg: Math.round(p.avg) }))} />
              : <Empty title="Sem resultados registrados">Registre reações e comentários nas publicações publicadas.</Empty>}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Detalhe" description={`${withRes.length} de ${pub.length} publicações com resultados`} />
          <CardBody>
            <table className="w-full text-xs">
              <thead className="text-left text-ink-mute"><tr><th className="py-2">Grupo</th><th>Posts</th><th>Interações médias</th><th>Taxa / impressão</th></tr></thead>
              <tbody className="divide-y divide-paper-line">{perf.map((p) => <tr key={p.key}><td className="py-2">{labelOf(p.key)}</td><td>{p.n}</td><td className="font-semibold text-green">{p.avg.toFixed(1)}</td><td>{p.rate === null ? "—" : `${p.rate.toFixed(2)}%`}</td></tr>)}</tbody>
            </table>
          </CardBody>
        </Card>
      </div>
      <Card tone="green">
        <CardHeader eyebrow="Padrões observados e experimentos" title="O que testar a seguir" />
        <CardBody className="space-y-2 text-sm text-paper/85">
          {withRes.length < 6 ? (
            <p><FlaskConical className="mr-1 inline h-4 w-4 text-pink" />Amostra pequena ({withRes.length} publicações). Qualquer padrão aqui é <strong>hipótese</strong>, não conclusão. Referência NEXO: ao menos 6–10 publicações por grupo antes de comparar.</p>
          ) : null}
          {perf[0] && <p>• Na sua amostra, <strong>{labelOf(perf[0].key)}</strong> teve mais interações médias ({perf[0].avg.toFixed(1)}). Experimento: publicar 2 conteúdos nesse grupo e 2 em outro, com temas equivalentes, e comparar.</p>}
          <p>• Horário e algoritmo: o NEXO não conhece o melhor horário. Teste alternar dias/horários e registre — só conclua com repetição.</p>
          <p>• Gancho: compare aberturas com pergunta vs. afirmação concreta em temas semelhantes.</p>
        </CardBody>
      </Card>
    </div>
  );
}

export default function Page() { return <Suspense><Inner /></Suspense>; }
