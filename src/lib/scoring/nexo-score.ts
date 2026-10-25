/**
 * NEXO Score — estimativa interna (0–100, quatro pilares de 0–25).
 * Inspirado conceitualmente nos quatro pilares do Social Selling Index do LinkedIn,
 * mas NÃO reproduz o algoritmo proprietário e não deve ser comparado como se fosse o SSI.
 * Calculado apenas com dados registrados no NEXO (checklist, publicações, contatos, métricas).
 */
import type { AppData } from "../types";
import { addDays, clamp, sum, todayISO } from "../utils";
import { confidenceFrom, type Confidence } from "./common";

export type PillarKey = "brand" | "people" | "insights" | "relationships";

export interface PillarResult {
  key: PillarKey;
  label: string;
  score: number | null;
  coverage: number;
  confidence: Confidence;
  components: { label: string; value: number | null; weight: number; detail: string }[];
}

export interface NexoScore {
  total: number | null;
  pillars: PillarResult[];
  coverage: number;
  confidence: Confidence;
}

export const PILLAR_LABEL: Record<PillarKey, string> = {
  brand: "Estabelecer marca profissional",
  people: "Encontrar as pessoas certas",
  insights: "Interagir com insights",
  relationships: "Construir relacionamentos",
};

function pillar(key: PillarKey, components: PillarResult["components"]): PillarResult {
  const tot = sum(components.map((c) => c.weight)) || 1;
  const avail = components.filter((c) => c.value !== null);
  const aw = sum(avail.map((c) => c.weight));
  const coverage = aw / tot;
  const score = aw ? (sum(avail.map((c) => (c.value as number) * c.weight)) / aw) * 25 : null;
  return { key, label: PILLAR_LABEL[key], components, coverage, confidence: confidenceFrom(coverage), score: score === null ? null : Math.round(score * 10) / 10 };
}

const ratio = (v: number, goal: number) => (goal > 0 ? clamp(v / goal, 0, 1) : null);

export function nexoScore(d: AppData, asOf = todayISO(), opts: { includeDemo: boolean } = { includeDemo: true }): NexoScore {
  const keep = <T extends { origin: string }>(xs: T[]) => (opts.includeDemo ? xs : xs.filter((x) => x.origin !== "demo"));
  const g = d.profile.goals;
  const from30 = addDays(asOf, -30);
  const in30 = (date: string | null) => !!date && date >= from30 && date <= asOf;
  const weeks = 30 / 7;

  const posts = keep(d.posts);
  const contacts = keep(d.contacts);
  const metrics = keep(d.metrics).filter((m) => m.date <= asOf).sort((a, b) => a.date.localeCompare(b.date));
  const last4 = metrics.slice(-4);

  // Marca
  const evaluated = d.profile.checklist.filter((c) => c.status !== "nao_avaliado");
  const checklistValue = evaluated.length ? sum(evaluated.map((c) => (c.status === "ok" ? 1 : c.status === "melhorar" ? 0.5 : 0))) / d.profile.checklist.length : null;
  const published30 = posts.filter((p) => p.status === "publicado" && in30(p.publishedDate)).length;
  const brand = pillar("brand", [
    { label: "Checklist do perfil", value: checklistValue, weight: 0.6, detail: evaluated.length ? `${evaluated.length}/${d.profile.checklist.length} itens avaliados` : "Checklist ainda não avaliado" },
    { label: "Conteúdo de autoria própria (30 dias)", value: ratio(published30, g.postsPerWeek * weeks), weight: 0.4, detail: `${published30} publicações vs meta de ${Math.round(g.postsPerWeek * weeks)}` },
  ]);

  // Pessoas
  const new30 = contacts.filter((c) => in30(c.createdAt.slice(0, 10))).length;
  const cats = new Set(contacts.map((c) => c.category));
  const keyCats = ["recrutador", "gestor", "funcao_alvo", "lideranca"] as const;
  const targetNames = [...d.profile.companiesOfInterest, ...keep(d.companies).map((c) => c.name)].map((s) => s.toLowerCase());
  const atTargets = contacts.filter((c) => targetNames.some((t) => t && c.company.toLowerCase().includes(t))).length;
  const people = pillar("people", [
    { label: "Novos contatos identificados (30 dias)", value: contacts.length ? ratio(new30, g.newContactsPerWeek * weeks) : null, weight: 0.5, detail: `${new30} vs meta de ${Math.round(g.newContactsPerWeek * weeks)}` },
    { label: "Cobertura de categorias-chave", value: contacts.length ? keyCats.filter((k) => cats.has(k)).length / keyCats.length : null, weight: 0.25, detail: `${keyCats.filter((k) => cats.has(k)).length}/4 (recrutadores, gestores, função-alvo, lideranças)` },
    { label: "Pessoas em empresas-alvo", value: contacts.length && targetNames.length ? clamp(atTargets / 5, 0, 1) : null, weight: 0.25, detail: `${atTargets} contatos (referência: 5)` },
  ]);

  // Insights
  const commentsMade = last4.length ? sum(last4.map((m) => m.commentsMade)) : null;
  const messages30 = contacts.flatMap((c) => c.interactions).filter((i) => (i.kind === "mensagem" || i.kind === "comentario") && in30(i.date)).length;
  const insights = pillar("insights", [
    { label: "Comentários relevantes feitos (4 semanas)", value: commentsMade === null ? null : ratio(commentsMade, g.commentsPerWeek * 4), weight: 0.5, detail: commentsMade === null ? "Sem métricas registradas" : `${commentsMade} vs meta de ${g.commentsPerWeek * 4}` },
    { label: "Frequência de publicação", value: ratio(published30, g.postsPerWeek * weeks), weight: 0.25, detail: `${published30} em 30 dias` },
    { label: "Mensagens contextualizadas (30 dias)", value: contacts.length ? ratio(messages30, g.messagesPerWeek * weeks) : null, weight: 0.25, detail: `${messages30} registradas` },
  ]);

  // Relacionamentos
  const sent = last4.length ? sum(last4.map((m) => m.invitesSent)) : 0;
  const acc = last4.length ? sum(last4.map((m) => m.invitesAccepted)) : 0;
  const recurring = contacts.filter((c) => c.interactions.length >= 2).length;
  const withNext = contacts.filter((c) => c.nextStepDate);
  const onTime = withNext.filter((c) => (c.nextStepDate as string) >= asOf).length;
  const growth = metrics.length >= 5 && metrics[metrics.length - 1].connections !== null && metrics[metrics.length - 5].connections !== null
    ? (metrics[metrics.length - 1].connections as number) - (metrics[metrics.length - 5].connections as number) : null;
  const relationships = pillar("relationships", [
    { label: "Taxa de aceitação de convites", value: sent >= 5 ? acc / sent : null, weight: 0.3, detail: sent >= 5 ? `${acc}/${sent} nas últimas 4 semanas` : "Menos de 5 convites registrados — sem base" },
    { label: "Interações recorrentes", value: contacts.length ? clamp(recurring / 5, 0, 1) : null, weight: 0.3, detail: `${recurring} contatos com 2+ interações (referência: 5)` },
    { label: "Acompanhamentos em dia", value: withNext.length ? onTime / withNext.length : null, weight: 0.2, detail: withNext.length ? `${onTime}/${withNext.length} próximos passos no prazo` : "Nenhum próximo passo agendado" },
    { label: "Crescimento da rede (4 semanas)", value: growth === null ? null : ratio(growth, g.newContactsPerWeek * 4), weight: 0.2, detail: growth === null ? "Mínimo de 5 registros semanais" : `+${growth} conexões` },
  ]);

  const pillars = [brand, people, insights, relationships];
  const coverage = sum(pillars.map((p) => p.coverage)) / 4;
  const scored = pillars.filter((p) => p.score !== null);
  const total = scored.length === 4 ? Math.round(sum(scored.map((p) => p.score))) : scored.length ? Math.round((sum(scored.map((p) => p.score)) / scored.length) * 4) : null;
  return { total, pillars, coverage, confidence: confidenceFrom(coverage) };
}

/**
 * Pontuação complementar de desempenho de carreira (0–100).
 * Mede execução do plano — não empregabilidade.
 */
export function careerScore(d: AppData, opts: { includeDemo: boolean } = { includeDemo: true }) {
  const keep = <T extends { origin: string }>(xs: T[]) => (opts.includeDemo ? xs : xs.filter((x) => x.origin !== "demo"));
  const jobs = keep(d.jobs);
  const from30 = addDays(todayISO(), -30);
  const applied30 = jobs.filter((j) => j.history.some((h) => h.status === "enviada" && h.date >= from30)).length;
  const plan = keep(d.plan);
  const courses = d.courses.filter((c) => c.status !== "descartado");
  const parts = [
    { label: "Candidaturas enviadas (30 dias) vs meta", value: ratio(applied30, d.profile.goals.applicationsPerMonth), weight: 0.35, detail: `${applied30} de ${d.profile.goals.applicationsPerMonth}` },
    { label: "Plano 30/60/90 concluído", value: plan.length ? plan.filter((p) => p.done).length / plan.length : null, weight: 0.35, detail: `${plan.filter((p) => p.done).length}/${plan.length} ações` },
    { label: "Capacitações em andamento ou concluídas", value: courses.length ? clamp(courses.filter((c) => c.status === "em_andamento" || c.status === "concluido").length / Math.max(1, d.profile.goals.coursesPerQuarter), 0, 1) : null, weight: 0.3, detail: `${courses.filter((c) => c.status === "em_andamento" || c.status === "concluido").length} vs meta trimestral de ${d.profile.goals.coursesPerQuarter}` },
  ];
  const aw = sum(parts.filter((p) => p.value !== null).map((p) => p.weight));
  const total = aw ? Math.round((sum(parts.filter((p) => p.value !== null).map((p) => (p.value as number) * p.weight)) / aw) * 100) : null;
  return { total, parts, coverage: aw, confidence: confidenceFrom(aw) };
}
