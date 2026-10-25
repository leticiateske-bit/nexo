"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Copy, ExternalLink, MessageSquareText, Pencil, Plus, Search, Send, Trash2, UserPlus, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { contactRelevance } from "@/lib/scoring/career";
import { generateMessage, SITUATIONS, suggestSituation, type MessageSituation } from "@/lib/engine/messages";
import { CONTACT_CATEGORY, CONTACT_STATUS } from "@/lib/labels";
import type { Contact, ContactCategory, ContactStatus, Interaction } from "@/lib/types";
import { cn, fmtDate, nowISO, todayISO, uid } from "@/lib/utils";
import { Badge, Button, Card, CardBody, Dialog, Empty, Field, Input, Select, Textarea } from "@/components/ui";
import { MethodNote, OriginBadge, PageHeader } from "@/components/nexo";

const blank = (): Contact => {
  const t = nowISO();
  return { id: uid("ct"), origin: "user", createdAt: t, updatedAt: t, name: "", role: "", company: "", area: "", category: "funcao_alvo", reason: "", learn: "", topic: "", profileUrl: "", source: "Perfil público no LinkedIn (consulta manual)", verifiedAt: todayISO(), status: "identificado", interactions: [], nextStep: "", nextStepDate: null, tags: [] };
};

export default function Networking() {
  const { view, data, add, update, remove, toast } = useStore();
  const contacts = view("contacts");
  const targets = [...data.profile.companiesOfInterest, ...view("companies").map((c) => c.name)];
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<ContactCategory | "all">("all");
  const [st, setSt] = useState<ContactStatus | "all">("all");
  const [editing, setEditing] = useState<Contact | null>(null);
  const [msgFor, setMsgFor] = useState<Contact | null>(null);
  const [logFor, setLogFor] = useState<Contact | null>(null);

  const scored = useMemo(() => contacts.map((c) => ({ c, r: contactRelevance(c, data.profile, targets) })).sort((a, b) => b.r.score - a.r.score), [contacts, data.profile, targets]); // eslint-disable-line react-hooks/exhaustive-deps
  const list = scored.filter(({ c }) => (cat === "all" || c.category === cat) && (st === "all" || c.status === st) && (!q || `${c.name} ${c.role} ${c.company} ${c.area}`.toLowerCase().includes(q.toLowerCase())));
  const counts = (Object.keys(CONTACT_STATUS) as ContactStatus[]).map((s) => ({ s, n: contacts.filter((c) => c.status === s).length }));
  const t = todayISO();

  const saveContact = (c: Contact) => {
    if (!c.name.trim() || !c.role.trim()) return toast("Nome e cargo são obrigatórios.", "warn");
    if (contacts.some((x) => x.id === c.id)) update("contacts", c.id, c); else add("contacts", c);
    toast("Contato salvo");
    setEditing(null);
  };

  return (
    <>
      <PageHeader index="04" title="Networking estratégico" description="Relacionamentos que contribuem para seus objetivos — não volume de conexões. O NEXO não envia convites nem mensagens: você copia, revisa e envia."
        actions={<Button onClick={() => setEditing(blank())}><UserPlus className="h-4 w-4" />Registrar contato</Button>} />

      <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {counts.map(({ s, n }) => (
          <button key={s} onClick={() => setSt(st === s ? "all" : s)} className={cn("rounded-xl border px-3 py-2.5 text-left transition", st === s ? "border-green bg-green text-paper" : "border-paper-line bg-paper-card hover:border-green/40")}>
            <div className="font-display text-xl font-semibold">{n}</div>
            <div className="text-[11px] opacity-70">{CONTACT_STATUS[s]}</div>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative w-full max-w-xs"><Search className="absolute left-3 top-3 h-4 w-4 text-ink-mute" /><Input className="pl-9" placeholder="Buscar nome, cargo, empresa…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Select className="w-auto" value={cat} onChange={(e) => setCat(e.target.value as ContactCategory | "all")}>
          <option value="all">Todas as categorias</option>{Object.entries(CONTACT_CATEGORY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
      </div>

      {list.length ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {list.map(({ c, r }) => {
            const overdue = c.nextStepDate && c.nextStepDate < t;
            return (
              <Card key={c.id} tone="white">
                <CardBody className="pt-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green font-display text-sm font-semibold text-paper">{c.name.split(" ").map((x) => x[0]).slice(0, 2).join("")}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-[15px] font-semibold text-green">{c.name}</h3>
                        <OriginBadge origin={c.origin} />
                      </div>
                      <div className="text-xs text-ink-soft">{c.role} · {c.company}</div>
                      <div className="mt-1 flex flex-wrap gap-1"><Badge tone="green">{CONTACT_CATEGORY[c.category]}</Badge><Badge tone="outline">{CONTACT_STATUS[c.status]}</Badge>{c.area && <Badge tone="outline">{c.area}</Badge>}</div>
                    </div>
                    <div className="text-center" title={r.reasons.join("\n")}>
                      <div className="font-display text-2xl font-semibold text-pink">{r.score}</div>
                      <div className="text-[9px] uppercase leading-tight tracking-wider text-ink-mute">Relevância<br />estratégica</div>
                    </div>
                  </div>
                  <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                    <div><dt className="font-medium text-ink">Por que recomendar</dt><dd className="text-ink-soft">{c.reason || "—"}</dd></div>
                    <div><dt className="font-medium text-ink">O que posso aprender</dt><dd className="text-ink-soft">{c.learn || "—"}</dd></div>
                    <div className="sm:col-span-2"><dt className="font-medium text-ink">Tema para iniciar conversa</dt><dd className="text-ink-soft">{c.topic || "—"}</dd></div>
                  </dl>
                  <details className="mt-2 text-[11px] text-ink-mute"><summary className="cursor-pointer">Justificativa da relevância</summary><ul className="mt-1 list-inside list-disc">{r.reasons.map((x) => <li key={x}>{x}</li>)}</ul></details>
                  {(c.nextStep || c.nextStepDate) && (
                    <div className={cn("mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs", overdue ? "bg-pink-50 text-pink-700" : "bg-paper text-ink-soft")}>
                      <CalendarClock className="h-3.5 w-3.5" />{c.nextStep || "Próximo passo"} · {fmtDate(c.nextStepDate)}{overdue && " · atrasado"}
                    </div>
                  )}
                  {c.interactions.length > 0 && (
                    <div className="mt-2 text-[11px] text-ink-mute">Última interação: {c.interactions[c.interactions.length - 1].kind} em {fmtDate(c.interactions[c.interactions.length - 1].date)} · {c.interactions.length} registro(s)</div>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-paper-line pt-3">
                    <Button size="sm" onClick={() => setMsgFor(c)}><MessageSquareText className="h-3.5 w-3.5" />Mensagem</Button>
                    {c.profileUrl ? <a href={c.profileUrl} target="_blank" rel="noreferrer"><Button size="sm" variant="outline"><ExternalLink className="h-3.5 w-3.5" />Perfil</Button></a>
                      : <Button size="sm" variant="outline" disabled title={c.origin === "demo" ? "Pessoa fictícia — sem perfil" : "Adicione o link do perfil"}><ExternalLink className="h-3.5 w-3.5" />Perfil</Button>}
                    <Button size="sm" variant="subtle" onClick={() => setLogFor(c)}><Plus className="h-3.5 w-3.5" />Registrar</Button>
                    <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setEditing(c)} aria-label="Editar"><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="danger" onClick={() => { remove("contacts", c.id); toast("Contato excluído", "info"); }} aria-label="Excluir"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                  <div className="mt-2 text-[10px] text-ink-mute">Fonte: {c.source} · {c.verifiedAt ? `verificado em ${fmtDate(c.verifiedAt)}` : "não verificado"}</div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      ) : <Empty icon={<Users className="h-8 w-8" />} title="Nenhum contato com esses filtros" action={<Button onClick={() => setEditing(blank())}>Registrar contato</Button>}>Encontre pessoas pela busca do LinkedIn e registre aqui apenas informações públicas profissionais.</Empty>}

      <div className="mt-6">
        <MethodNote title="Como a relevância estratégica é calculada">
          <p>Soma transparente de pontos (máx. 100): categoria (gestor 30, recrutador 28, função-alvo 26, liderança 22, especialista 20, criador 14, complementar 10) + trabalha em empresa-alvo (+25) + cargo relacionado a um cargo-alvo (+20) + área ligada às suas prioridades (+20 para a prioridade nº 1, diminuindo 3 por posição).</p>
          <p>Nunca são usadas características pessoais sensíveis. O NEXO não busca pessoas automaticamente: a identificação é feita por você, em fontes públicas, respeitando os termos do LinkedIn.</p>
        </MethodNote>
      </div>

      <ContactDialog contact={editing} onClose={() => setEditing(null)} onSave={saveContact} />
      <MessageDialog contact={msgFor} onClose={() => setMsgFor(null)} />
      <LogDialog contact={logFor} onClose={() => setLogFor(null)} />
    </>
  );
}

function ContactDialog({ contact, onClose, onSave }: { contact: Contact | null; onClose: () => void; onSave: (c: Contact) => void }) {
  const [c, setC] = useState<Contact | null>(contact);
  if (contact && (!c || c.id !== contact.id)) setC(contact);
  if (!contact || !c) return null;
  const s = <K extends keyof Contact>(k: K, v: Contact[K]) => setC({ ...c, [k]: v });
  return (
    <Dialog open onClose={onClose} title={c.name ? `Contato: ${c.name}` : "Registrar contato"} footer={<Button onClick={() => onSave(c)}>Salvar</Button>}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Nome"><Input value={c.name} onChange={(e) => s("name", e.target.value)} /></Field>
        <Field label="Cargo"><Input value={c.role} onChange={(e) => s("role", e.target.value)} /></Field>
        <Field label="Empresa atual"><Input value={c.company} onChange={(e) => s("company", e.target.value)} /></Field>
        <Field label="Área de atuação"><Input value={c.area} onChange={(e) => s("area", e.target.value)} /></Field>
        <Field label="Categoria"><Select value={c.category} onChange={(e) => s("category", e.target.value as ContactCategory)}>{Object.entries(CONTACT_CATEGORY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
        <Field label="Status"><Select value={c.status} onChange={(e) => s("status", e.target.value as ContactStatus)}>{Object.entries(CONTACT_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
        <Field label="Link do perfil" className="sm:col-span-2"><Input placeholder="https://www.linkedin.com/in/…" value={c.profileUrl} onChange={(e) => s("profileUrl", e.target.value)} /></Field>
        <Field label="Motivo da recomendação / relação com objetivos" className="sm:col-span-2"><Textarea className="min-h-[60px]" value={c.reason} onChange={(e) => s("reason", e.target.value)} /></Field>
        <Field label="O que posso aprender"><Input value={c.learn} onChange={(e) => s("learn", e.target.value)} /></Field>
        <Field label="Tema para iniciar conversa"><Input value={c.topic} onChange={(e) => s("topic", e.target.value)} /></Field>
        <Field label="Próximo passo"><Input value={c.nextStep} onChange={(e) => s("nextStep", e.target.value)} /></Field>
        <Field label="Data do próximo passo"><Input type="date" value={c.nextStepDate ?? ""} onChange={(e) => s("nextStepDate", e.target.value || null)} /></Field>
        <Field label="Fonte das informações"><Input value={c.source} onChange={(e) => s("source", e.target.value)} /></Field>
        <Field label="Data da verificação"><Input type="date" value={c.verifiedAt ?? ""} onChange={(e) => s("verifiedAt", e.target.value || null)} /></Field>
      </div>
      <p className="mt-3 text-[11px] text-ink-mute">Registre apenas dados profissionais públicos. Não inclua informações pessoais sensíveis.</p>
    </Dialog>
  );
}

function MessageDialog({ contact, onClose }: { contact: Contact | null; onClose: () => void }) {
  const { data, update, toast } = useStore();
  const [sit, setSit] = useState<MessageSituation>("orientacao");
  const [text, setText] = useState("");
  const [forId, setForId] = useState<string | null>(null);
  if (contact && forId !== contact.id) {
    const s = suggestSituation(contact);
    setForId(contact.id); setSit(s); setText(generateMessage(s, contact, data.profile));
  }
  if (!contact) return null;
  const change = (s: MessageSituation) => { setSit(s); setText(generateMessage(s, contact, data.profile)); };
  const mark = () => {
    const kind: Interaction["kind"] = contact.status === "identificado" ? "convite" : "mensagem";
    update("contacts", contact.id, { status: contact.status === "identificado" ? "abordado" : contact.status, interactions: [...contact.interactions, { id: uid("int"), date: todayISO(), kind, note: SITUATIONS[sit] }] });
    toast("Marcado como abordado");
    setForId(null); onClose();
  };
  const placeholders = (text.match(/\[[^\]]+\]/g) ?? []).length;
  return (
    <Dialog open onClose={() => { setForId(null); onClose(); }} title={`Mensagem para ${contact.name}`}
      footer={<>
        <Button variant="outline" onClick={async () => { await navigator.clipboard.writeText(text); toast("Mensagem copiada"); }}><Copy className="h-4 w-4" />Copiar</Button>
        {contact.profileUrl && <a href={contact.profileUrl} target="_blank" rel="noreferrer"><Button variant="outline"><ExternalLink className="h-4 w-4" />Abrir perfil</Button></a>}
        <Button onClick={mark}><Send className="h-4 w-4" />Marcar como abordado</Button>
      </>}>
      <div className="space-y-3">
        <Field label="Situação"><Select value={sit} onChange={(e) => change(e.target.value as MessageSituation)}>{Object.entries(SITUATIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
        <Textarea className="min-h-[160px]" value={text} onChange={(e) => setText(e.target.value)} />
        <div className="flex flex-wrap justify-between gap-2 text-[11px]">
          <span className={cn(text.length > 300 ? "text-pink-700" : "text-ink-mute")}>{text.length} caracteres {text.length > 300 && "· longo para nota de convite (confira o limite da sua conta)"}</span>
          {placeholders > 0 && <span className="text-pink-700">{placeholders} trecho(s) [entre colchetes] para completar com informação real</span>}
        </div>
        <p className="text-[11px] text-ink-mute">A mensagem usa só o que está registrado sobre o contato. Não afirma contato anterior nem elogios que você não possa sustentar. Envie manualmente pelo LinkedIn.</p>
      </div>
    </Dialog>
  );
}

function LogDialog({ contact, onClose }: { contact: Contact | null; onClose: () => void }) {
  const { update, toast } = useStore();
  const [kind, setKind] = useState<Interaction["kind"]>("resposta");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISO());
  const [status, setStatus] = useState<ContactStatus | "">("");
  const [next, setNext] = useState("");
  const [nextDate, setNextDate] = useState("");
  if (!contact) return null;
  const save = () => {
    update("contacts", contact.id, {
      interactions: [...contact.interactions, { id: uid("int"), date, kind, note }],
      ...(status ? { status } : {}),
      ...(next || nextDate ? { nextStep: next || contact.nextStep, nextStepDate: nextDate || contact.nextStepDate } : {}),
    });
    toast("Interação registrada");
    setNote(""); setNext(""); setNextDate(""); setStatus("");
    onClose();
  };
  return (
    <Dialog open onClose={onClose} title={`Registrar interação — ${contact.name}`} footer={<Button onClick={save}>Salvar</Button>}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Tipo"><Select value={kind} onChange={(e) => setKind(e.target.value as Interaction["kind"])}>{["convite", "mensagem", "resposta", "comentario", "conversa", "nota"].map((k) => <option key={k}>{k}</option>)}</Select></Field>
        <Field label="Data"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Nota" className="sm:col-span-2"><Textarea className="min-h-[60px]" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        <Field label="Atualizar status"><Select value={status} onChange={(e) => setStatus(e.target.value as ContactStatus)}><option value="">Manter ({CONTACT_STATUS[contact.status]})</option>{Object.entries(CONTACT_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
        <div />
        <Field label="Próximo passo"><Input value={next} placeholder={contact.nextStep} onChange={(e) => setNext(e.target.value)} /></Field>
        <Field label="Data"><Input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} /></Field>
      </div>
      {contact.interactions.length > 0 && (
        <div className="mt-4">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Histórico</div>
          <ul className="space-y-1 text-xs text-ink-soft">{contact.interactions.slice().reverse().map((i) => <li key={i.id}>{fmtDate(i.date)} · <strong>{i.kind}</strong> {i.note && `— ${i.note}`}</li>)}</ul>
        </div>
      )}
    </Dialog>
  );
}

