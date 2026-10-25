/**
 * Motor de recomendações baseado em regras explícitas.
 * Cada recomendação informa a regra, os dados usados (basis) e o impacto esperado.
 * Nenhuma recomendação usa métricas inexistentes: se faltam dados, a regra sugere registrá-los.
 */
import type { AppData, Task } from "../types";
import { daysBetween, nowISO, termMatch, todayISO, weekStart } from "../utils";
import { jobFit } from "../scoring/job-fit";
import { brandFit } from "../scoring/brand-fit";
import { marketGaps } from "../scoring/career";
import { skillLevel } from "../scoring/common";

export interface Recommendation {
  ruleId: string;
  title: string;
  why: string;
  basis: string[];
  impact: string;
  module: Task["module"];
  href: string;
  priority: number;
  usesDemo: boolean;
}

export function recommendations(d: AppData): Recommendation[] {
  const out: Recommendation[] = [];
  const t = todayISO();
  const p = d.profile;
  const show = d.settings.showDemo;
  const keep = <T extends { origin: string }>(xs: T[]) => (show ? xs : xs.filter((x) => x.origin !== "demo"));
  const posts = keep(d.posts), contacts = keep(d.contacts), jobs = keep(d.jobs), companies = keep(d.companies), metrics = keep(d.metrics), ssi = keep(d.ssi);
  const anyDemo = (xs: { origin: string }[]) => xs.some((x) => x.origin === "demo");

  // Posicionamento estratégico: prioridade nº 1 sem conteúdo recente
  const top = p.interests[0];
  if (top) {
    const recent = posts.filter((x) => x.status === "publicado" && x.publishedDate && daysBetween(x.publishedDate, t) <= 30);
    const covered = recent.some((x) => [top.area, ...top.keywords].some((k) => termMatch(k, x.theme) || termMatch(k, x.title)));
    const strong = p.skills.filter((s) => s.level >= 4).map((s) => s.name).slice(0, 2);
    if (!covered) {
      out.push({
        ruleId: "pos_top_interest",
        title: `Publique um estudo de caso ligado a ${top.area.toLowerCase()} e conecte-se com quem lidera essa área`,
        why: `${top.area} é sua prioridade nº 1, mas nenhuma publicação dos últimos 30 dias trata do tema. Sua experiência com ${strong.join(" e ").toLowerCase() || "suas competências principais"} pode ser apresentada como evidência para esse mercado.`,
        basis: ["Ordem de prioridades do onboarding", `${recent.length} publicações nos últimos 30 dias`, "Competências com nível avançado no perfil"],
        impact: "Reforça a coerência entre posicionamento e cargos-alvo (pilar Marca) e cria motivo legítimo para novas conexões.",
        module: "conteudo", href: "/conteudo?tab=gerador", priority: 88, usesDemo: anyDemo(posts),
      });
    }
  }

  // Checklist
  const notEval = p.checklist.filter((c) => c.status === "nao_avaliado").length;
  if (notEval > p.checklist.length / 2) {
    out.push({ ruleId: "checklist_eval", title: "Avalie o checklist do seu perfil do LinkedIn", why: `${notEval} de ${p.checklist.length} itens ainda não foram avaliados — sem isso, o pilar Marca do NEXO Score fica com cobertura baixa.`, basis: ["Checklist do perfil"], impact: "Aumenta a confiança das análises de marca profissional.", module: "linkedin", href: "/linkedin?tab=checklist", priority: 86, usesDemo: false });
  }
  const weakHeadline = p.checklist.find((c) => (c.key === "titulo" || c.key === "sobre") && (c.status === "ausente" || c.status === "melhorar"));
  if (weakHeadline) {
    out.push({ ruleId: "fix_" + weakHeadline.key, title: weakHeadline.key === "titulo" ? "Reescreva o título com seu cargo-alvo" : "Reestruture a seção Sobre", why: `Item marcado como "${weakHeadline.status}". Título e Sobre são os primeiros pontos lidos por recrutadores nas buscas.`, basis: ["Checklist do perfil", `Cargos-alvo: ${p.targetRoles.slice(0, 2).join(", ")}`], impact: "Melhora a coerência do posicionamento e o pilar Marca.", module: "linkedin", href: "/linkedin?tab=checklist", priority: 84, usesDemo: false });
  }

  // Follow-ups atrasados
  const overdue = contacts.filter((c) => c.nextStepDate && c.nextStepDate < t && c.status !== "arquivado");
  if (overdue.length) {
    const c = overdue[0];
    out.push({ ruleId: "followup_" + c.id, title: `Retome o contato com ${c.name}: ${c.nextStep || "próximo passo pendente"}`, why: `Próximo passo venceu há ${daysBetween(c.nextStepDate as string, t)} dia(s). ${overdue.length > 1 ? `Há outros ${overdue.length - 1} acompanhamentos atrasados.` : ""}`, basis: ["Próximos passos registrados em Networking"], impact: "Relacionamentos com acompanhamento consistente (pilar Relacionamentos).", module: "networking", href: "/networking", priority: 82, usesDemo: c.origin === "demo" });
  }

  // Frequência de publicação
  const pub7 = posts.filter((x) => x.status === "publicado" && x.publishedDate && daysBetween(x.publishedDate, t) <= 7).length;
  if (pub7 < p.goals.postsPerWeek) {
    const draft = posts.find((x) => x.status === "revisao") ?? posts.find((x) => x.status === "rascunho");
    out.push({ ruleId: "post_freq", title: draft ? `Finalize e publique: "${draft.title}"` : "Gere e agende uma publicação para esta semana", why: `Meta de ${p.goals.postsPerWeek} publicação(ões) por semana; ${pub7} nos últimos 7 dias.`, basis: ["Calendário editorial", "Metas de LinkedIn"], impact: "Consistência de presença (pilares Marca e Insights).", module: "conteudo", href: "/conteudo?tab=calendario", priority: 78, usesDemo: !!draft && draft.origin === "demo" });
  }

  // Comentários
  const last = metrics.slice().sort((a, b) => b.date.localeCompare(a.date))[0];
  if (last && last.commentsMade !== null && last.commentsMade < p.goals.commentsPerWeek) {
    out.push({ ruleId: "comments", title: `Faça ${p.goals.commentsPerWeek - last.commentsMade} comentários com contribuição técnica esta semana`, why: `Último registro: ${last.commentsMade} comentários feitos vs meta semanal de ${p.goals.commentsPerWeek}. Priorize publicações de contatos estratégicos.`, basis: ["Registro semanal de métricas"], impact: "Pilar Insights e visibilidade junto a pessoas-alvo.", module: "networking", href: "/networking", priority: 66, usesDemo: last.origin === "demo" });
  }

  // Vaga de maior compatibilidade
  const open = jobs.filter((j) => j.status === "interessada" || j.status === "analisar").map((j) => ({ j, f: jobFit(j, p, d.settings.jobWeights) })).sort((a, b) => (b.f.total ?? 0) - (a.f.total ?? 0));
  if (open[0] && (open[0].f.total ?? 0) >= 65) {
    const { j, f } = open[0];
    out.push({ ruleId: "job_" + j.id, title: `Analise os requisitos de "${j.title}" — ${j.company}`, why: `Compatibilidade ${f.total}/100 (${f.confidence}). ${f.missing.length ? `Lacunas a endereçar: ${f.missing.slice(0, 2).join(", ")}.` : "Sem lacunas críticas registradas."}`, basis: ["Índice de compatibilidade da vaga", "Competências do perfil"], impact: "Candidatura mais direcionada. Compatibilidade não é probabilidade de contratação.", module: "vagas", href: "/vagas", priority: 74, usesDemo: j.origin === "demo" });
  }

  // Lacuna de mercado
  const gaps = marketGaps(p, jobs).filter((g) => g.level < 3 && g.count >= 2);
  if (gaps[0]) {
    const g = gaps[0];
    const course = d.courses.find((c) => termMatch(c.skill, g.skill) && c.status === "sugerido");
    out.push({ ruleId: "gap_" + g.skill, title: `Desenvolva ${g.skill}${course ? ` — comece por "${course.name}"` : ""}`, why: `Aparece em ${g.count} vagas acompanhadas e seu nível atual é ${g.level}/5.`, basis: ["Requisitos das vagas acompanhadas", "Matriz de competências"], impact: "Reduz a lacuna mais frequente nas oportunidades registradas.", module: "carreira", href: "/carreira", priority: 70, usesDemo: anyDemo(jobs) });
  }

  // Marca com maior fit sem contatos
  const fits = companies.map((c) => ({ c, f: brandFit(c, p, d.settings.brandWeights, jobs, d.settings.jobWeights) })).filter((x) => x.f.total !== null).sort((a, b) => (b.f.total ?? 0) - (a.f.total ?? 0));
  const noPeople = fits.find((x) => !contacts.some((ct) => ct.company.toLowerCase() === x.c.name.toLowerCase()));
  if (noPeople) {
    out.push({ ruleId: "brand_people_" + noPeople.c.id, title: `Identifique 3 pessoas na ${noPeople.c.name}`, why: `Brand Fit estimado de ${noPeople.f.total}% e nenhum contato registrado nessa empresa.`, basis: ["NEXO Brand Fit", "Contatos registrados"], impact: "Pilar Pessoas: relacionamentos em empresas-alvo.", module: "networking", href: "/networking", priority: 64, usesDemo: noPeople.c.origin === "demo" });
  }

  // Registros
  const lastSSI = ssi.slice().sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!lastSSI || daysBetween(lastSSI.date, t) > 30) {
    out.push({ ruleId: "ssi_snapshot", title: "Registre seu SSI oficial", why: lastSSI ? `Último registro há ${daysBetween(lastSSI.date, t)} dias.` : "Nenhum SSI oficial registrado. Consulte em linkedin.com/sales/ssi e anote os 4 pilares.", basis: ["Histórico de SSI"], impact: "Permite acompanhar a evolução real sem depender da estimativa interna.", module: "linkedin", href: "/linkedin?tab=ssi", priority: 60, usesDemo: false });
  }
  const lastMet = metrics.slice().sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!lastMet || daysBetween(lastMet.date, t) > 7) {
    out.push({ ruleId: "metrics_snapshot", title: "Registre as métricas da semana do LinkedIn", why: lastMet ? `Último registro há ${daysBetween(lastMet.date, t)} dias.` : "Ainda não há métricas registradas.", basis: ["Registro semanal"], impact: "Relatórios e comparações entre períodos.", module: "linkedin", href: "/relatorios", priority: 56, usesDemo: false });
  }
  const noResults = posts.filter((x) => x.status === "publicado" && x.results.impressions === null && x.results.reactions === null);
  if (noResults.length) {
    out.push({ ruleId: "post_results", title: `Registre os resultados de ${noResults.length} publicação(ões)`, why: "Sem resultados, a análise de desempenho por tema e formato fica incompleta.", basis: ["Calendário editorial"], impact: "Hipóteses de conteúdo testáveis.", module: "conteudo", href: "/conteudo?tab=desempenho", priority: 52, usesDemo: anyDemo(noResults) });
  }

  // Desenvolvimento desejado
  const want = p.skillsToDevelop.find((s) => skillLevel(p, s) < 3);
  if (want && !out.some((r) => r.ruleId === "gap_" + want)) {
    out.push({ ruleId: "dev_" + want, title: `Reserve ${Math.min(3, p.availabilityHoursWeek)}h para ${want} esta semana`, why: `Competência que você quer desenvolver; nível atual ${skillLevel(p, want)}/5. Disponibilidade declarada: ${p.availabilityHoursWeek}h/semana.`, basis: ["Competências a desenvolver", "Disponibilidade"], impact: "Avanço no plano 30/60/90.", module: "carreira", href: "/carreira?tab=plano", priority: 50, usesDemo: false });
  }

  return out.sort((a, b) => b.priority - a.priority);
}

export function tasksFromRecommendations(recs: Recommendation[], existing: Task[]): Task[] {
  const wk = weekStart();
  const have = new Set(existing.filter((x) => x.weekOf === wk).map((x) => x.ruleId));
  const t = nowISO();
  return recs
    .filter((r) => !have.has(r.ruleId))
    .slice(0, 7)
    .map((r, i) => ({
      id: `task_${wk}_${i}_${Math.random().toString(36).slice(2, 6)}`,
      origin: r.usesDemo ? "demo" : "user",
      createdAt: t,
      updatedAt: t,
      title: r.title,
      why: r.why,
      module: r.module,
      weekOf: wk,
      status: "pendente",
      ruleId: r.ruleId,
    }));
}

