/**
 * Gerador local de pautas e rascunhos (sem IA externa).
 * Princípio: usar somente o que está no perfil. Fatos que o NEXO não conhece
 * aparecem como [colchetes] para a usuária completar — nunca são inventados.
 */
import type { AppData, Post, PostApproach, PostFormat, PostObjective, Profile, Trend } from "../types";
import { POST_APPROACH, POST_OBJECTIVE } from "../labels";
import { marketGaps } from "../scoring/career";
import { nowISO, uid } from "../utils";

export interface Idea {
  id: string;
  title: string;
  objective: PostObjective;
  approach: PostApproach;
  theme: string;
  format: PostFormat;
  why: string;
  basedOn: string;
  trend?: Trend & { company: string };
}

const FORMAT_BY_OBJECTIVE: Record<PostObjective, PostFormat> = {
  autoridade: "texto", competencia_tecnica: "carrossel", atrair_recrutadores: "texto", relacionamento: "texto",
  tendencias: "texto", capacidade_analitica: "documento", estudo_de_caso: "carrossel", posicionamento: "texto",
};

const topSkills = (p: Profile, n = 3) => p.skills.slice().sort((a, b) => b.level - a.level).slice(0, n).map((s) => s.name);

export function generateIdeas(d: AppData): Idea[] {
  const p = d.profile;
  const ideas: Idea[] = [];
  const skills = topSkills(p);
  const role = p.targetRoles[0] ?? "o cargo que você busca";

  p.interests.slice(0, 4).forEach((it, i) => {
    const theme = it.area;
    const k = it.keywords[0] ?? theme;
    ideas.push({ id: uid("idea"), theme, objective: "estudo_de_caso", approach: "tecnica", format: "carrossel",
      title: `Um problema de ${k} que resolvi — e o que mudou depois`,
      why: `Prioridade nº ${i + 1}. Estudos de caso transformam experiência em evidência concreta para ${role}.`, basedOn: "Experiências + áreas de interesse" });
    ideas.push({ id: uid("idea"), theme, objective: i % 2 ? "capacidade_analitica" : "competencia_tecnica", approach: i % 2 ? "analitica" : "educativa", format: i % 2 ? "documento" : "carrossel",
      title: i % 2 ? `Quais indicadores eu acompanharia em ${k} (e por quê)` : `Checklist prático: o que verificar em ${k}`,
      why: `Mostra método aplicado a ${theme.toLowerCase()}, usando ${skills[0]?.toLowerCase() ?? "suas competências"}.`, basedOn: "Competências do perfil" });
  });

  ideas.push({ id: uid("idea"), theme: "Transição de carreira", objective: "posicionamento", approach: "pessoal", format: "texto",
    title: `Da arquitetura para ${p.interests[0]?.area.toLowerCase() ?? "operações"}: o que a formação me deu de vantagem`,
    why: "Explica a ponte entre formação e cargos-alvo — reduz a dúvida de recrutadores sobre aderência.", basedOn: "Formação + cargos-alvo" });
  ideas.push({ id: uid("idea"), theme: "Comunicação com stakeholders", objective: "atrair_recrutadores", approach: "pessoal", format: "texto",
    title: "Como adapto a mesma informação técnica para públicos diferentes",
    why: "Comunicação para públicos diversos é uma competência forte registrada e é pedida em vagas de operações e facilities.", basedOn: "Competências avançadas" });

  for (const c of d.companies.filter((c) => d.settings.showDemo || c.origin !== "demo")) {
    for (const tr of c.trends.slice(0, 2)) {
      ideas.push({ id: uid("idea"), theme: tr.what, objective: "tendencias", approach: "tendencia", format: "texto",
        title: tr.action.replace(/^(Publicar|Post|Carrossel):\s*/i, "").replace(/^'|'\.?$/g, "") || `O que ${tr.what.toLowerCase()} muda para quem trabalha com operações`,
        why: `Tendência ${tr.kind === "hipotese" ? "(hipótese — não afirme como fato)" : tr.kind} na ${c.name}.`, basedOn: `Dossiê ${c.name}`, trend: { ...tr, company: c.name } });
    }
  }

  const gap = marketGaps(p, d.jobs.filter((j) => d.settings.showDemo || j.origin !== "demo")).find((g) => g.level < 3);
  if (gap) ideas.push({ id: uid("idea"), theme: gap.skill, objective: "relacionamento", approach: "educativa", format: "texto",
    title: `Estou aprendendo ${gap.skill}: primeiro aprendizado aplicado ao meu contexto`,
    why: `${gap.skill} aparece em ${gap.count} vagas acompanhadas. Aprender em público abre conversa com especialistas.`, basedOn: "Lacunas das vagas" });

  const perf = themePerformance(d.posts.filter((x) => d.settings.showDemo || x.origin !== "demo"));
  if (perf[0]) ideas.push({ id: uid("idea"), theme: perf[0].key, objective: "autoridade", approach: "analitica", format: "documento",
    title: `Aprofundar ${perf[0].key}: segunda parte com um exemplo novo`,
    why: `Tema com mais interações por publicação na sua amostra (${perf[0].avg.toFixed(0)} em média, ${perf[0].n} post(s)). Hipótese a testar, não regra.`, basedOn: "Desempenho registrado" });

  return ideas;
}

export function themePerformance(posts: Post[], key: "theme" | "format" | "objective" | "approach" = "theme") {
  const map = new Map<string, { key: string; n: number; total: number; impressions: number; withImpr: number }>();
  for (const p of posts.filter((x) => x.status === "publicado" && (x.results.reactions !== null || x.results.comments !== null))) {
    const k = String(p[key]);
    const cur = map.get(k) ?? { key: k, n: 0, total: 0, impressions: 0, withImpr: 0 };
    cur.n++;
    cur.total += (p.results.reactions ?? 0) + (p.results.comments ?? 0) + (p.results.shares ?? 0);
    if (p.results.impressions) { cur.impressions += p.results.impressions; cur.withImpr++; }
    map.set(k, cur);
  }
  return Array.from(map.values()).map((m) => ({ ...m, avg: m.total / m.n, rate: m.impressions ? (m.total / m.impressions) * 100 : null })).sort((a, b) => b.avg - a.avg);
}

const VISUAL: Record<PostFormat, string> = {
  texto: "Sem imagem ou com uma foto real do contexto (sem dados sensíveis). Parágrafos curtos, uma ideia por bloco.",
  carrossel: "6–8 slides em PDF 1080×1350. Capa com o gancho em fonte grande; um passo por slide; último slide com síntese. Paleta da sua marca pessoal, sem excesso de texto.",
  documento: "PDF de 4–6 páginas com um quadro/tabela central (ex.: indicador, definição, por que importa). Cite fontes no rodapé.",
  imagem: "Uma imagem única: diagrama simples ou antes/depois. Legenda explica a lógica em 3–4 linhas.",
};

export function generatePost(input: { objective: PostObjective; approach: PostApproach; theme: string; format?: PostFormat; trend?: Idea["trend"]; title?: string }, p: Profile): Post {
  const format = input.format ?? FORMAT_BY_OBJECTIVE[input.objective];
  const theme = input.theme;
  const exp = p.experiences[0];
  const skills = topSkills(p);
  const role = p.targetRoles[0] ?? "minha área-alvo";
  const t = theme.toLowerCase();

  let hook = "", body = "", conclusion = "", cta = "";
  switch (input.approach) {
    case "tecnica":
      hook = `Em ${t}, o problema raramente é falta de esforço. Quase sempre é falta de critério claro.`;
      body = [
        `No meu trabalho com ${exp ? exp.description.split(".")[0].toLowerCase() : "infraestrutura e processos"}, encontrei uma situação assim: [descreva o problema em 1 frase, sem expor a organização].`,
        "O que fiz, em três passos:",
        `1. Defini o que é "certo": [critério/requisito que você padronizou].`,
        "2. Transformei em rotina verificável: [checklist, formulário, visita, indicador].",
        "3. Medi o efeito: [resultado real — se não houver número, descreva a mudança observada].",
        `A parte técnica que mais pesou foi ${skills[0]?.toLowerCase() ?? "a padronização"}; a que mais exigiu cuidado foi alinhar pessoas com rotinas diferentes.`,
      ].join("\n\n");
      conclusion = `Padronizar não é engessar: é dar à equipe um ponto de partida comum para melhorar.`;
      cta = `Quem trabalha com ${t}: qual critério vocês usam para decidir o que é prioridade?`;
      break;
    case "analitica":
      hook = `Se você só mede o que deu errado em ${t}, enxerga o problema tarde demais.`;
      body = [
        "Três indicadores que eu acompanharia — e o que cada um responde:",
        "▸ [Indicador 1] — responde: [pergunta de gestão]. Fonte de dado: [onde vem].",
        "▸ [Indicador 2] — responde: [pergunta]. Cuidado: [limitação do dado].",
        "▸ [Indicador 3] — responde: [pergunta]. Frequência: [semanal/mensal].",
        "O erro comum é olhar o número sem o contexto: uma unidade com mais ocorrências pode ser apenas a que mais registra.",
      ].join("\n\n");
      conclusion = "Indicador bom é aquele que muda uma decisão. Se ninguém age diferente ao vê-lo, ele é só decoração.";
      cta = "Que indicador você incluiria nessa lista?";
      break;
    case "educativa":
      hook = `Um guia rápido para quem está começando a olhar ${t} com mais método.`;
      body = [
        `O que é, em uma frase: [defina ${t} com suas palavras].`,
        "Por que importa: [impacto em custo, experiência ou segurança — cite fonte se usar dado].",
        "Como começar:",
        "• [passo 1]",
        "• [passo 2]",
        "• [passo 3]",
        "Erro que vejo com frequência: [erro observado na sua prática].",
      ].join("\n\n");
      conclusion = "Começar simples e medir é melhor do que planejar o sistema perfeito que nunca sai do papel.";
      cta = "Salve para consultar depois — e me conte o que faltou.";
      break;
    case "pessoal":
      hook = `Me formei em Arquitetura e Urbanismo na UFPR para projetar espaços. Hoje, meu trabalho é fazer com que eles funcionem.`;
      body = [
        `Essa mudança me ensinou que ${t} começa muito antes de um problema aparecer: [aprendizado concreto].`,
        `Da arquitetura, trouxe ${skills.slice(0, 2).map((s) => s.toLowerCase()).join(" e ")} — e um olhar para como as pessoas usam o espaço.`,
        "Da prática em operações, aprendi [segundo aprendizado — algo que só a experiência ensinou].",
        `É por isso que tenho me aproximado de ${role.toLowerCase()}: [motivo verdadeiro, em uma frase].`,
      ].join("\n\n");
      conclusion = "Carreiras não precisam ser lineares para serem coerentes.";
      cta = `Quem fez transição parecida: o que levou da formação original?`;
      break;
    case "tendencia":
      hook = input.trend ? `${input.trend.what}: o que isso muda na prática para quem cuida de operações e espaços?` : `${theme} está mudando a forma como espaços e operações são geridos.`;
      body = [
        input.trend ? `O que está acontecendo: ${input.trend.what}${input.trend.since ? ` (desde ${input.trend.since})` : ""}. Fonte: ${input.trend.source || "[adicione a fonte]"}.` : "O que está acontecendo: [fato + fonte com data].",
        input.trend ? `Por que importa: ${input.trend.why}` : "Por que importa: [impacto].",
        `Minha leitura, a partir de ${skills[0]?.toLowerCase() ?? "minha experiência"}: [sua análise — deixe claro que é opinião].`,
        input.trend?.kind === "hipotese" ? "⚠ Isso é uma hipótese, não um fato confirmado — escreva como pergunta, não como afirmação." : "O que eu observaria a seguir: [sinal concreto].",
      ].join("\n\n");
      conclusion = "Tendência só vira vantagem para quem traduz em rotina.";
      cta = "Você já percebe esse movimento no seu setor?";
      break;
  }

  const kw = [theme, ...skills.slice(0, 2), role].filter(Boolean);
  const tag = (s: string) => "#" + s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9 ]/g, "").split(" ").map((w, i) => (i ? w.charAt(0).toUpperCase() + w.slice(1) : w.charAt(0).toUpperCase() + w.slice(1))).join("");
  const t0 = nowISO();
  return {
    id: uid("post"), origin: "user", createdAt: t0, updatedAt: t0,
    title: input.title ?? hook.slice(0, 80),
    hook, body, conclusion, cta,
    hashtags: Array.from(new Set(kw.map(tag))).slice(0, 4),
    keywords: kw,
    format, objective: input.objective, approach: input.approach, theme,
    audience: `Recrutadores e gestores de ${role.toLowerCase()}; profissionais de ${p.interests[0]?.area.toLowerCase() ?? theme.toLowerCase()}.`,
    rationale: `${POST_OBJECTIVE[input.objective]} com abordagem ${POST_APPROACH[input.approach].toLowerCase()}. Conecta "${theme}" às suas competências (${skills.slice(0, 2).join(", ")}) e ao cargo-alvo ${role}.`,
    visualGuide: VISUAL[format],
    sources: input.trend?.url ? [{ label: input.trend.source, url: input.trend.url }] : [],
    status: "rascunho", scheduledDate: null, publishedDate: null,
    results: { impressions: null, reactions: null, comments: null, shares: null, profileVisitsAfter: null },
  };
}

export function postFullText(p: Post) {
  return [p.hook, p.body, p.conclusion, p.cta, p.hashtags.join(" ")].filter(Boolean).join("\n\n");
}
