"use client";

import { useEffect, useState } from "react";
import { Copy, CopyPlus, Loader2, Plus, Sparkles, Trash2, X } from "lucide-react";
import { useAI, writePost } from "@/lib/ai-client";
import type { Post, PostApproach, PostFormat, PostObjective, PostStatus } from "@/lib/types";
import { POST_APPROACH, POST_FORMAT, POST_OBJECTIVE, POST_STATUS } from "@/lib/labels";
import { postFullText } from "@/lib/engine/content";
import { useStore } from "@/lib/store";
import { nowISO, uid } from "@/lib/utils";
import { Button, Dialog, Field, Input, Select, TagInput, Textarea } from "./ui";
import { OriginBadge } from "./nexo";

export function PostEditor({ post, open, onClose }: { post: Post | null; open: boolean; onClose: () => void }) {
  const { add, update, remove, toast, data } = useStore();
  const [p, setP] = useState<Post | null>(post);
  const [writing, setWriting] = useState(false);
  const ai = useAI();
  useEffect(() => setP(post), [post]);
  if (!p) return null;
  const exists = data.posts.some((x) => x.id === p.id);
  const set = <K extends keyof Post>(k: K, v: Post[K]) => setP({ ...p, [k]: v });
  const setR = (k: keyof Post["results"], v: string) => setP({ ...p, results: { ...p.results, [k]: v === "" ? null : Number(v) } });

  const save = () => {
    const fixed = { ...p, publishedDate: p.status === "publicado" && !p.publishedDate ? new Date().toISOString().slice(0, 10) : p.publishedDate };
    if (exists) update("posts", p.id, fixed); else add("posts", fixed);
    toast(exists ? "Publicação atualizada" : "Rascunho salvo no calendário");
    onClose();
  };
  const duplicate = () => {
    const t = nowISO();
    add("posts", { ...p, id: uid("post"), origin: "user", title: p.title + " (cópia)", status: "rascunho", publishedDate: null, createdAt: t, updatedAt: t, results: { impressions: null, reactions: null, comments: null, shares: null, profileVisitsAfter: null } });
    toast("Publicação duplicada");
    onClose();
  };
  const rewrite = async () => {
    setWriting(true);
    try {
      const w = await writePost({ title: p.title, objective: p.objective, approach: p.approach, theme: p.theme, format: p.format }, data.profile,
        data.posts.filter((x) => x.id !== p.id && x.origin !== "demo").map((x) => x.hook).filter(Boolean));
      setP({ ...p, hook: w.hook, body: w.body, conclusion: w.conclusion, cta: w.cta, hashtags: w.hashtags, keywords: w.keywords, visualGuide: w.visualGuide || p.visualGuide,
        rationale: `${w.rationale}${w.factsUsed.length ? `\n\nFatos do perfil usados (confira): ${w.factsUsed.join("; ")}` : ""}` });
      toast("Texto reescrito — revise e salve");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Falha ao reescrever", "warn");
    } finally {
      setWriting(false);
    }
  };
  const copy = async () => { await navigator.clipboard.writeText(postFullText(p)); toast("Texto copiado — publique manualmente no LinkedIn"); };

  return (
    <Dialog open={open} onClose={onClose} wide title={<span className="flex items-center gap-2">{exists ? "Editar publicação" : "Novo rascunho"} <OriginBadge origin={p.origin} /></span>}
      footer={<>
        {exists && <Button variant="danger" className="mr-auto" onClick={() => { remove("posts", p.id); toast("Publicação excluída", "info"); onClose(); }}><Trash2 className="h-4 w-4" />Excluir</Button>}
        {ai === "ready" && <Button variant="outline" disabled={writing} onClick={rewrite}>{writing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{writing ? "Escrevendo…" : "Reescrever com IA"}</Button>}
        <Button variant="outline" onClick={copy}><Copy className="h-4 w-4" />Copiar texto</Button>
        {exists && <Button variant="outline" onClick={duplicate}><CopyPlus className="h-4 w-4" />Duplicar</Button>}
        <Button onClick={save}>Salvar</Button>
      </>}>
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-3">
          <Field label="Título interno"><Input value={p.title} onChange={(e) => set("title", e.target.value)} /></Field>
          <Field label="Gancho inicial" hint="primeiras 2 linhas — aparecem antes do “ver mais”"><Textarea className="min-h-[60px]" value={p.hook} onChange={(e) => set("hook", e.target.value)} /></Field>
          <Field label="Desenvolvimento" hint="complete os [colchetes] com fatos reais"><Textarea className="min-h-[220px]" value={p.body} onChange={(e) => set("body", e.target.value)} /></Field>
          <Field label="Conclusão"><Textarea className="min-h-[56px]" value={p.conclusion} onChange={(e) => set("conclusion", e.target.value)} /></Field>
          <Field label="Chamada para interação" hint="opcional"><Input value={p.cta} onChange={(e) => set("cta", e.target.value)} /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Hashtags"><TagInput value={p.hashtags} onChange={(v) => set("hashtags", v)} /></Field>
            <Field label="Palavras-chave"><TagInput value={p.keywords} onChange={(v) => set("keywords", v)} /></Field>
          </div>
          <Field label="Fontes e referências" hint="obrigatório para afirmações factuais">
            <div className="space-y-2">
              {p.sources.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <Input placeholder="Nome da fonte" value={s.label} onChange={(e) => set("sources", p.sources.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                  <Input placeholder="https://" value={s.url} onChange={(e) => set("sources", p.sources.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
                  <Button variant="ghost" size="icon" onClick={() => set("sources", p.sources.filter((_, j) => j !== i))} aria-label="Remover"><X className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button size="sm" variant="subtle" onClick={() => set("sources", [...p.sources, { label: "", url: "" }])}><Plus className="h-3.5 w-3.5" />Adicionar fonte</Button>
            </div>
          </Field>
        </div>
        <div className="space-y-3">
          <Field label="Status"><Select value={p.status} onChange={(e) => set("status", e.target.value as PostStatus)}>{Object.entries(POST_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Agendada"><Input type="date" value={p.scheduledDate ?? ""} onChange={(e) => set("scheduledDate", e.target.value || null)} /></Field>
            <Field label="Publicada"><Input type="date" value={p.publishedDate ?? ""} onChange={(e) => set("publishedDate", e.target.value || null)} /></Field>
          </div>
          <Field label="Formato"><Select value={p.format} onChange={(e) => set("format", e.target.value as PostFormat)}>{Object.entries(POST_FORMAT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
          <Field label="Objetivo"><Select value={p.objective} onChange={(e) => set("objective", e.target.value as PostObjective)}>{Object.entries(POST_OBJECTIVE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
          <Field label="Abordagem"><Select value={p.approach} onChange={(e) => set("approach", e.target.value as PostApproach)}>{Object.entries(POST_APPROACH).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
          <Field label="Tema"><Input value={p.theme} onChange={(e) => set("theme", e.target.value)} /></Field>
          <Field label="Público"><Textarea className="min-h-[56px]" value={p.audience} onChange={(e) => set("audience", e.target.value)} /></Field>
          <Field label="Justificativa estratégica"><Textarea className="min-h-[70px]" value={p.rationale} onChange={(e) => set("rationale", e.target.value)} /></Field>
          <Field label="Orientação visual"><Textarea className="min-h-[70px]" value={p.visualGuide} onChange={(e) => set("visualGuide", e.target.value)} /></Field>
          {(p.status === "publicado" || p.publishedDate) && (
            <div className="rounded-xl bg-paper p-3">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Resultados (manual)</div>
              <div className="grid grid-cols-2 gap-2">
                {([["impressions", "Impressões"], ["reactions", "Reações"], ["comments", "Comentários"], ["shares", "Compart."], ["profileVisitsAfter", "Visitas ao perfil"]] as const).map(([k, l]) => (
                  <Field key={k} label={l}><Input type="number" min={0} placeholder="—" value={p.results[k] ?? ""} onChange={(e) => setR(k, e.target.value)} /></Field>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
