/**
 * Dados iniciais do NEXO.
 *
 * - `buildInitialProfile`: perfil real da usuária (fornecido no briefing), editável.
 * - Registros com origin "demo": FICTÍCIOS. Empresas, pessoas, vagas e métricas
 *   demonstrativas não existem e servem apenas para testar a experiência.
 * - Registros com origin "nexo": referências curadas (cargos-hipótese e capacitações
 *   de instituições reais). Custos, cargas horárias e datas NÃO foram verificados.
 */
import type {
  AppData, Company, Contact, Course, Job, MetricSnapshot, PlanItem, Post, Profile,
  Reference, RoleProfile, SSISnapshot, Settings,
} from "../types";
import { CHECKLIST_ITEMS } from "../labels";
import { addDays, nowISO, todayISO, weekStart } from "../utils";

export const DATA_VERSION = 1;

const meta = (id: string, origin: "demo" | "nexo" | "user" = "demo") => {
  const t = nowISO();
  return { id, origin, createdAt: t, updatedAt: t };
};

export function buildInitialProfile(): Profile {
  return {
    name: "",
    headline: "Arquiteta e Urbanista (UFPR) | Qualidade, Infraestrutura e Operações",
    about:
      "Arquiteta e Urbanista formada pela UFPR, com experiência em consultoria de qualidade, infraestrutura e operações educacionais. Acompanho unidades físicas, padronizo processos e traduzo requisitos de infraestrutura em rotinas claras para diferentes públicos.",
    location: "Curitiba, PR",
    linkedinUrl: "",
    yearsExperience: 4,
    resumeText: "",
    experiences: [
      {
        id: "exp1",
        role: "Consultora de Qualidade e Infraestrutura",
        org: "Operações educacionais (informe a organização)",
        start: "",
        end: "atual",
        description:
          "Acompanhamento de unidades físicas, padronização de processos e verificação de requisitos de infraestrutura. Comunicação com diferentes públicos e criação de materiais visuais.",
        achievements: [
          "[Descreva um resultado: ex. nº de unidades acompanhadas]",
          "[Descreva um processo que você padronizou e o efeito observado]",
        ],
      },
    ],
    education: [
      { id: "edu1", course: "Arquitetura e Urbanismo", institution: "Universidade Federal do Paraná (UFPR)", level: "Graduação", year: "" },
    ],
    skills: [
      { name: "Infraestrutura física", level: 4, evidence: "Acompanhamento de unidades físicas e requisitos de infraestrutura" },
      { name: "Padronização de processos", level: 4, evidence: "Padronização de processos em operações educacionais" },
      { name: "Auditoria e qualidade", level: 4, evidence: "Consultoria de qualidade" },
      { name: "Gestão de stakeholders", level: 4, evidence: "Relacionamento com stakeholders e públicos diversos" },
      { name: "Comunicação visual", level: 4, evidence: "Criação de materiais visuais (Canva)" },
      { name: "Indicadores e KPIs", level: 3, evidence: "Interesse e uso de indicadores — adicione exemplo" },
      { name: "Análise de dados", level: 3, evidence: "Análise de informações — adicione exemplo" },
      { name: "Excel avançado", level: 3, evidence: "" },
      { name: "Melhoria contínua", level: 3, evidence: "Interesse declarado; adicione caso prático" },
      { name: "Gestão de projetos", level: 3, evidence: "" },
      { name: "Gestão de facilities", level: 3, evidence: "Experiência correlata em infraestrutura e operações" },
      { name: "Normas técnicas (NBR/NR)", level: 3, evidence: "Formação em Arquitetura" },
      { name: "AutoCAD", level: 3, evidence: "Formação em Arquitetura" },
      { name: "SketchUp", level: 3, evidence: "Formação em Arquitetura" },
      { name: "Arquitetura comercial", level: 2, evidence: "Interesse declarado" },
      { name: "Visual merchandising", level: 2, evidence: "Interesse declarado" },
      { name: "Mapeamento de processos (BPMN)", level: 2, evidence: "" },
      { name: "Manutenção predial", level: 2, evidence: "" },
      { name: "Gestão de fornecedores e contratos", level: 2, evidence: "" },
      { name: "Orçamento e custos", level: 2, evidence: "" },
      { name: "Workplace experience", level: 2, evidence: "Interesse em experiência dos espaços" },
      { name: "Revit / BIM", level: 2, evidence: "" },
      { name: "Inglês", level: 3, evidence: "" },
      { name: "Power BI", level: 1, evidence: "" },
      { name: "SQL", level: 0, evidence: "" },
    ],
    certifications: [],
    portfolio: [],
    interests: [
      { area: "Facilities e infraestrutura", keywords: ["facilities", "infraestrutura", "manutenção", "predial", "workplace"] },
      { area: "Processos e melhoria contínua", keywords: ["processos", "melhoria contínua", "qualidade", "lean", "padronização"] },
      { area: "Operações", keywords: ["operações", "expansão", "unidades", "eficiência operacional"] },
      { area: "Gestão de projetos", keywords: ["projetos", "obras", "implantação", "cronograma"] },
      { area: "Dados e indicadores", keywords: ["indicadores", "dashboards", "dados", "kpi", "bi"] },
      { area: "Arquitetura comercial e visual merchandising", keywords: ["arquitetura comercial", "visual merchandising", "varejo", "loja", "experiência do espaço"] },
    ],
    values: ["Qualidade de vida", "Aprendizado contínuo", "Organização e clareza", "Impacto mensurável"],
    targetRoles: ["Analista de Facilities", "Analista de Processos e Melhoria Contínua", "Analista de Operações", "Analista de Infraestrutura"],
    targetSeniority: ["Pleno"],
    salaryMin: null,
    salaryMax: null,
    contractTypes: ["CLT", "PJ"],
    workModes: ["remoto", "hibrido", "presencial"],
    cities: ["Curitiba", "Florianópolis"],
    skillsToDevelop: ["Power BI", "Mapeamento de processos (BPMN)", "Gestão de facilities"],
    companiesOfInterest: [],
    objectives: "Crescimento profissional, especialização técnica, aumento de renda e preservação da qualidade de vida.",
    goals: {
      postsPerWeek: 2,
      commentsPerWeek: 10,
      newContactsPerWeek: 10,
      messagesPerWeek: 5,
      ssiTarget: 65,
      pillarTargets: { brand: 18, people: 15, insights: 15, relationships: 17 },
      applicationsPerMonth: 6,
      coursesPerQuarter: 1,
    },
    availabilityHoursWeek: 5,
    trainingBudgetMonth: null,
    checklist: CHECKLIST_ITEMS.map((c) => ({ key: c.key, status: "nao_avaliado", note: "" })),
    onboardingDone: false,
    updatedAt: nowISO(),
  };
}

export const DEFAULT_SETTINGS: Settings = {
  jobWeights: { skills: 30, experience: 25, education: 20, goals: 15, logistics: 10 },
  brandWeights: { skills: 25, experience: 25, values: 20, interests: 15, roles: 15 },
  engagementRateDefinition: "por_impressao",
  showDemo: true,
};

/* ------------------------------------------------------------- Cargos-hipótese */

function roles(): RoleProfile[] {
  const r = (id: string, title: string, description: string, requirements: [string, number][], tools: string[], evidenceToShow: string[], paths: string[]): RoleProfile => ({
    ...meta(id, "nexo"),
    title,
    description,
    requirements: requirements.map(([skill, required]) => ({ skill, required })),
    tools,
    evidenceToShow,
    paths,
    salaryNote: "Sem fonte salarial verificada nesta versão. Registre faixas apenas a partir de vagas que as divulguem ou pesquisas salariais com data e metodologia.",
  });
  return [
    r("role_fac", "Analista de Facilities", "Gestão de serviços, manutenção, contratos e infraestrutura de espaços corporativos.",
      [["Gestão de facilities", 4], ["Manutenção predial", 3], ["Gestão de fornecedores e contratos", 4], ["Orçamento e custos", 3], ["Indicadores e KPIs", 3], ["Infraestrutura física", 4], ["Normas técnicas (NBR/NR)", 3], ["Excel avançado", 3]],
      ["Excel", "CMMS / sistemas de manutenção", "Power BI", "AutoCAD"],
      ["Nº de unidades/espaços acompanhados", "Requisitos de infraestrutura verificados", "Fornecedores ou chamados geridos"],
      ["Analista Sr. de Facilities", "Coordenação de Facilities", "Workplace / Real Estate"]),
    r("role_infra", "Analista de Infraestrutura (física)", "Planejamento e acompanhamento de infraestrutura física, adequações e padrões de unidades.",
      [["Infraestrutura física", 4], ["Normas técnicas (NBR/NR)", 4], ["Gestão de projetos", 3], ["AutoCAD", 3], ["Orçamento e custos", 3], ["Gestão de fornecedores e contratos", 3]],
      ["AutoCAD", "Revit", "MS Project", "Excel"],
      ["Padrões de unidade definidos", "Adequações acompanhadas", "Checklists de infraestrutura criados"],
      ["Coordenação de Infraestrutura", "Expansão e implantação de unidades"]),
    r("role_proj", "Analista de Projetos", "Planejamento, cronograma, riscos e comunicação de projetos.",
      [["Gestão de projetos", 4], ["Gestão de stakeholders", 4], ["Orçamento e custos", 3], ["Indicadores e KPIs", 3], ["Excel avançado", 3], ["Comunicação visual", 2]],
      ["MS Project", "Jira/Trello", "Excel", "Power BI"],
      ["Projetos conduzidos com prazo e escopo", "Stakeholders envolvidos", "Riscos mitigados"],
      ["PMO", "Gerência de projetos"]),
    r("role_proc", "Analista de Processos e Melhoria Contínua", "Mapeamento, padronização e otimização de processos com base em indicadores.",
      [["Mapeamento de processos (BPMN)", 4], ["Padronização de processos", 4], ["Melhoria contínua", 4], ["Indicadores e KPIs", 4], ["Análise de dados", 3], ["Gestão de stakeholders", 3], ["Power BI", 3]],
      ["Bizagi / BPMN", "Excel", "Power BI", "Ferramentas Lean (5W2H, PDCA, Ishikawa)"],
      ["Processos padronizados e efeito medido", "Indicadores criados/monitorados", "Projeto de melhoria com antes/depois"],
      ["Especialista em Processos", "Excelência Operacional", "Coordenação de Qualidade"]),
    r("role_qual", "Consultor(a) de Qualidade", "Auditorias, padrões, conformidade e planos de ação.",
      [["Auditoria e qualidade", 4], ["Padronização de processos", 4], ["Indicadores e KPIs", 3], ["Gestão de stakeholders", 4], ["Melhoria contínua", 3], ["Normas técnicas (NBR/NR)", 3]],
      ["Checklists digitais", "Excel", "Power BI", "ISO 9001 (conhecimento)"],
      ["Auditorias realizadas", "Planos de ação acompanhados", "Conformidade alcançada"],
      ["Consultoria sênior", "Coordenação de Qualidade"]),
    r("role_ops", "Analista de Operações", "Eficiência de rotinas, indicadores operacionais e suporte a unidades.",
      [["Indicadores e KPIs", 4], ["Análise de dados", 3], ["Padronização de processos", 3], ["Gestão de stakeholders", 3], ["Excel avançado", 4], ["Power BI", 3], ["Melhoria contínua", 3]],
      ["Excel", "Power BI", "SQL (desejável)"],
      ["Rotinas operacionais estruturadas", "Indicadores operacionais", "Unidades apoiadas"],
      ["Coordenação de Operações", "Planejamento operacional"]),
    r("role_wx", "Workplace Experience", "Experiência das pessoas nos espaços de trabalho: serviços, ambiente e cultura.",
      [["Workplace experience", 4], ["Gestão de facilities", 3], ["Gestão de stakeholders", 4], ["Comunicação visual", 3], ["Indicadores e KPIs", 3], ["Inglês", 3]],
      ["Pesquisas de satisfação", "Ferramentas de reserva de espaços", "Excel"],
      ["Melhorias de experiência em espaços", "Comunicação com usuários", "Pesquisas aplicadas"],
      ["Workplace Manager", "Employee Experience"]),
    r("role_arqcom", "Arquiteta – Arquitetura Comercial", "Projetos de lojas e espaços comerciais, padrões de marca e implantação.",
      [["Arquitetura comercial", 4], ["AutoCAD", 4], ["Revit / BIM", 3], ["SketchUp", 3], ["Visual merchandising", 3], ["Gestão de projetos", 3], ["Normas técnicas (NBR/NR)", 3]],
      ["AutoCAD", "Revit", "SketchUp", "Renderização"],
      ["Projetos comerciais (portfólio)", "Implantações acompanhadas", "Padrões de marca aplicados"],
      ["Coordenação de Projetos de Expansão", "Store Design"]),
    r("role_vm", "Visual Merchandising", "Exposição de produtos, padrões visuais e experiência em loja.",
      [["Visual merchandising", 4], ["Comunicação visual", 4], ["Arquitetura comercial", 3], ["Análise de dados", 2], ["Gestão de stakeholders", 3]],
      ["Canva/Adobe", "Planogramas", "SketchUp"],
      ["Portfólio visual", "Guias de exposição", "Resultados por loja (quando houver)"],
      ["VM Sênior", "Coordenação de VM", "Store Experience"]),
    r("role_data", "Analista de Inteligência de Mercado / Dados", "Análise de dados para decisões de negócio. Aderência a validar com evidências.",
      [["Análise de dados", 4], ["Power BI", 4], ["SQL", 3], ["Excel avançado", 4], ["Indicadores e KPIs", 4], ["Comunicação visual", 3]],
      ["Power BI", "SQL", "Excel", "Python (desejável)"],
      ["Dashboards construídos", "Análises que embasaram decisões"],
      ["BI Sênior", "Inteligência de mercado"]),
  ];
}

/* ------------------------------------------------------------- Capacitações */

function courses(): Course[] {
  const c = (id: string, o: Omit<Course, keyof ReturnType<typeof meta>>): Course => ({ ...meta(id, "nexo"), ...o });
  const notVerified = "Não verificado — confirme no site oficial";
  return [
    c("crs_pbi", { name: "Microsoft Certified: Power BI Data Analyst Associate (exame PL-300)", institution: "Microsoft", skill: "Power BI", type: "certificacao",
      relevance: "Power BI aparece em cargos de processos, operações e facilities e é sua maior lacuna técnica entre as competências desejadas.",
      prerequisites: "Excel intermediário; noções de modelagem de dados", duration: notVerified, cost: notVerified, mode: "Online (trilhas gratuitas no Microsoft Learn + exame pago)",
      url: "https://learn.microsoft.com/credentials/", source: "Catálogo oficial Microsoft Learn", verifiedAt: null,
      benefit: "Comprovar capacidade de construir dashboards, transformando interesse declarado em evidência.", priority: "alta", status: "sugerido" }),
    c("crs_kaggle_sql", { name: "Intro to SQL", institution: "Kaggle Learn", skill: "SQL", type: "introdutorio",
      relevance: "Base para análises em operações e dados; útil se o cargo de dados se confirmar como caminho.",
      prerequisites: "Nenhum", duration: notVerified, cost: "Gratuito segundo o site (verificar)", mode: "Online",
      url: "https://www.kaggle.com/learn", source: "kaggle.com/learn", verifiedAt: null,
      benefit: "Primeiro contato prático com consultas a bases de dados.", priority: "baixa", status: "sugerido" }),
    c("crs_ifma_fmp", { name: "Facility Management Professional (FMP)", institution: "IFMA — International Facility Management Association", skill: "Gestão de facilities", type: "certificacao",
      relevance: "Credencial específica de facilities; ajuda a formalizar a transição de infraestrutura/qualidade para FM.",
      prerequisites: "Verificar requisitos no site", duration: notVerified, cost: notVerified, mode: "Online (em inglês — verificar)",
      url: "https://www.ifma.org", source: "Site oficial IFMA", verifiedAt: null,
      benefit: "Vocabulário e estrutura de facilities reconhecidos internacionalmente.", priority: "media", status: "sugerido" }),
    c("crs_pmi_capm", { name: "Certified Associate in Project Management (CAPM)", institution: "PMI — Project Management Institute", skill: "Gestão de projetos", type: "certificacao",
      relevance: "Gestão de projetos é requisito recorrente em infraestrutura e arquitetura comercial.",
      prerequisites: "Verificar horas de formação exigidas", duration: notVerified, cost: notVerified, mode: "Online / centro de provas",
      url: "https://www.pmi.org", source: "Site oficial PMI", verifiedAt: null,
      benefit: "Evidência formal de conhecimento em gestão de projetos.", priority: "media", status: "sugerido" }),
    c("crs_ev_excel", { name: "Cursos de Excel (Escola Virtual)", institution: "Fundação Bradesco", skill: "Excel avançado", type: "introdutorio",
      relevance: "Excel avançado é base para indicadores, operações e facilities.",
      prerequisites: "Nenhum", duration: notVerified, cost: "Gratuito segundo o site (verificar)", mode: "Online",
      url: "https://www.ev.org.br", source: "ev.org.br", verifiedAt: null,
      benefit: "Consolidar fórmulas, tabelas dinâmicas e organização de dados.", priority: "media", status: "sugerido" }),
    c("crs_evg_proc", { name: "Cursos de gestão de processos (catálogo)", institution: "Escola Virtual.Gov (ENAP)", skill: "Mapeamento de processos (BPMN)", type: "introdutorio",
      relevance: "Mapeamento de processos é requisito central de Analista de Processos — sua lacuna mais relevante para esse cargo.",
      prerequisites: "Nenhum", duration: notVerified, cost: "Gratuito segundo o site (verificar)", mode: "Online",
      url: "https://www.escolavirtual.gov.br", source: "escolavirtual.gov.br", verifiedAt: null,
      benefit: "Fundamentos de modelagem; combine com um mapeamento real (anonimizado) para o portfólio.", priority: "alta", status: "sugerido" }),
    c("crs_autodesk", { name: "Trilhas de aprendizado Revit", institution: "Autodesk", skill: "Revit / BIM", type: "pratico",
      relevance: "Relevante apenas se arquitetura comercial subir na sua ordem de prioridades.",
      prerequisites: "AutoCAD", duration: notVerified, cost: notVerified, mode: "Online",
      url: "https://www.autodesk.com/learn", source: "autodesk.com/learn", verifiedAt: null,
      benefit: "Atualização em BIM para projetos de lojas e expansão.", priority: "baixa", status: "sugerido" }),
    c("crs_pos_fm", { name: "Pós-graduação em Facilities / Gestão de Operações", institution: "Instituição a pesquisar (Curitiba, Florianópolis ou EAD)", skill: "Gestão de facilities", type: "pos",
      relevance: "Considerar após validar a direção com vagas e conversas — investimento alto de tempo e dinheiro.",
      prerequisites: "Graduação", duration: notVerified, cost: notVerified, mode: "A definir",
      url: "", source: "Pesquisa pendente", verifiedAt: null,
      benefit: "Especialização formal; só faz sentido se as vagas-alvo valorizarem.", priority: "baixa", status: "sugerido" }),
  ];
}

/* --------------------------------------------------------- Dados demonstrativos */

function demoSSI(): SSISnapshot[] {
  const base = [
    [38, 9.5, 8.2, 9.8, 10.5],
    [40, 10.1, 8.6, 10.2, 11.1],
    [41, 10.8, 8.9, 10.0, 11.3],
    [44, 11.6, 9.4, 11.2, 11.8],
    [46, 12.4, 9.8, 11.6, 12.2],
    [47, 13.0, 9.9, 11.5, 12.6],
    [50, 13.8, 10.6, 12.4, 13.2],
    [52, 14.5, 11.0, 13.0, 13.5],
  ];
  return base.map(([total, brand, people, insights, relationships], i) => ({
    ...meta(`ssi_demo_${i}`),
    date: addDays(todayISO(), -(base.length - 1 - i) * 14),
    total, brand, people, insights, relationships, industryRank: null, networkRank: null,
  }));
}

function demoMetrics(): MetricSnapshot[] {
  const out: MetricSnapshot[] = [];
  let connections = 612, followers = 640;
  for (let i = 11; i >= 0; i--) {
    const w = 11 - i;
    connections += 6 + (w % 3) * 3 + (w > 6 ? 5 : 0);
    followers += 7 + (w % 4) * 2 + (w > 6 ? 6 : 0);
    const posted = w % 2 === 0 || w > 7;
    out.push({
      ...meta(`met_demo_${w}`),
      date: addDays(weekStart(), -i * 7 + 6),
      connections, followers,
      profileViews: 28 + w * 3 + (posted ? 12 : 0),
      searchAppearances: 40 + w * 4,
      impressions: posted ? 900 + w * 160 : 210 + w * 20,
      reactions: posted ? 22 + w * 3 : 4,
      comments: posted ? 4 + Math.round(w / 2) : 0,
      shares: posted ? 1 + (w % 3) : 0,
      commentsMade: 3 + (w % 4) + (w > 6 ? 4 : 0),
      invitesSent: 6 + (w % 3) * 2,
      invitesAccepted: 3 + (w % 3),
    });
  }
  return out;
}

function demoPosts(): Post[] {
  const p = (id: string, o: Partial<Post> & Pick<Post, "title" | "status" | "format" | "objective" | "approach" | "theme">): Post => ({
    ...meta(id), hook: "", body: "", conclusion: "", cta: "", hashtags: [], keywords: [], audience: "", rationale: "", visualGuide: "", sources: [],
    scheduledDate: null, publishedDate: null, results: { impressions: null, reactions: null, comments: null, shares: null, profileVisitsAfter: null }, ...o,
  });
  return [
    p("post_d1", { title: "Checklist de infraestrutura que reduziu retrabalho", status: "publicado", format: "carrossel", objective: "estudo_de_caso", approach: "tecnica", theme: "Infraestrutura",
      hook: "Uma vistoria de unidade costumava levar duas visitas. O problema não era a equipe — era o checklist.",
      publishedDate: addDays(todayISO(), -40), results: { impressions: 2410, reactions: 61, comments: 14, shares: 5, profileVisitsAfter: 22 } }),
    p("post_d2", { title: "O que arquitetura ensina sobre gestão de facilities", status: "publicado", format: "texto", objective: "posicionamento", approach: "pessoal", theme: "Facilities",
      hook: "Fui formada para projetar espaços. Hoje trabalho para que eles funcionem todos os dias.",
      publishedDate: addDays(todayISO(), -26), results: { impressions: 1820, reactions: 48, comments: 11, shares: 2, profileVisitsAfter: 15 } }),
    p("post_d3", { title: "3 indicadores para acompanhar unidades físicas", status: "publicado", format: "documento", objective: "capacidade_analitica", approach: "analitica", theme: "Indicadores",
      hook: "Se só medimos chamados abertos, enxergamos o problema tarde demais.",
      publishedDate: addDays(todayISO(), -12), results: { impressions: 2980, reactions: 74, comments: 19, shares: 8, profileVisitsAfter: 31 } }),
    p("post_d4", { title: "Visual merchandising e operação: onde os dois se encontram", status: "revisao", format: "imagem", objective: "relacionamento", approach: "educativa", theme: "Visual merchandising",
      scheduledDate: addDays(todayISO(), 2) }),
    p("post_d5", { title: "Padronizar não é engessar", status: "rascunho", format: "texto", objective: "autoridade", approach: "analitica", theme: "Processos", scheduledDate: addDays(todayISO(), 5) }),
    p("post_d6", { title: "Workplace híbrido: o que muda na manutenção dos espaços", status: "ideia", format: "carrossel", objective: "tendencias", approach: "tendencia", theme: "Workplace" }),
  ];
}

function demoReferences(): Reference[] {
  return [
    { ...meta("ref_d1"), title: "Exemplo: anotação sobre carrosséis de estudo de caso", url: "", kind: "insight", note: "Na sua amostra demonstrativa, carrosséis e documentos tiveram mais comentários por publicação. Hipótese a testar com dados reais.", tags: ["formato", "hipótese"] },
    { ...meta("ref_d2"), title: "Exemplo: tema recorrente — ocupação híbrida e uso de espaços", url: "", kind: "tendencia", note: "Registre aqui a fonte real (relatório, notícia) antes de usar em uma publicação.", tags: ["workplace", "facilities"] },
  ];
}

function demoContacts(): Contact[] {
  const c = (id: string, o: Partial<Contact> & Pick<Contact, "name" | "role" | "company" | "category">): Contact => ({
    ...meta(id), area: "", reason: "", learn: "", topic: "", profileUrl: "", source: "Dado demonstrativo (pessoa fictícia)", verifiedAt: null,
    status: "identificado", interactions: [], nextStep: "", nextStepDate: null, tags: [], ...o,
  });
  return [
    c("ct_d1", { name: "Camila Exemplo", role: "Tech Recruiter — Operações e Facilities", company: "Pinhal Facilities (demo)", category: "recrutador", area: "Recrutamento",
      reason: "Recruta para facilities em Curitiba, sua área de maior prioridade.", learn: "Como recrutadores leem perfis em transição de carreira.", topic: "Quais evidências pesam mais para analistas de facilities vindos de qualidade.",
      status: "abordado", interactions: [{ id: "i1", date: addDays(todayISO(), -9), kind: "convite", note: "Convite com nota personalizada" }], nextStep: "Verificar aceite e enviar mensagem curta", nextStepDate: addDays(todayISO(), -1) }),
    c("ct_d2", { name: "Rafael Demonstração", role: "Coordenador de Facilities", company: "Ilha Workplace (demo)", category: "gestor", area: "Facilities",
      reason: "Gere a área de facilities em Florianópolis; contrata analistas.", learn: "Rotina e indicadores de uma coordenação de FM.", topic: "Indicadores que ele usa para priorizar manutenção.",
      status: "conectado", interactions: [{ id: "i2", date: addDays(todayISO(), -20), kind: "convite", note: "" }, { id: "i3", date: addDays(todayISO(), -15), kind: "resposta", note: "Aceitou o convite" }], nextStep: "Comentar publicação dele sobre ocupação de escritórios", nextStepDate: addDays(todayISO(), 2) }),
    c("ct_d3", { name: "Juliana Fictícia", role: "Analista de Processos Sr.", company: "Atlântica Varejo (demo)", category: "funcao_alvo", area: "Processos",
      reason: "Exerce o cargo-alvo em uma empresa-alvo.", learn: "Ferramentas de mapeamento usadas no dia a dia.", topic: "Como fez a transição para processos.",
      status: "em_conversa", interactions: [{ id: "i4", date: addDays(todayISO(), -6), kind: "mensagem", note: "Pedido de conversa de 15 min" }, { id: "i5", date: addDays(todayISO(), -4), kind: "resposta", note: "Topou conversar na próxima semana" }], nextStep: "Confirmar data da conversa", nextStepDate: addDays(todayISO(), 1) }),
    c("ct_d4", { name: "Bruno Modelo", role: "Especialista em Manutenção Predial", company: "Pinhal Facilities (demo)", category: "especialista", area: "Manutenção",
      reason: "Publica sobre manutenção preventiva — sua lacuna técnica.", learn: "Planos de manutenção e sistemas CMMS.", topic: "Pergunta sobre um post dele de manutenção preventiva." }),
    c("ct_d5", { name: "Patrícia Ilustrativa", role: "Diretora de Expansão", company: "Atlântica Varejo (demo)", category: "lideranca", area: "Expansão e lojas",
      reason: "Lidera expansão de lojas: conecta arquitetura comercial e operações.", learn: "Visão de negócio sobre abertura de lojas.", topic: "Comentar anúncio público de expansão (quando houver fonte)." }),
    c("ct_d6", { name: "Diego Amostra", role: "Consultor e criador de conteúdo sobre Lean", company: "Autônomo (demo)", category: "criador", area: "Melhoria contínua",
      reason: "Compartilha conteúdos de melhoria contínua com boa discussão.", learn: "Formatos de conteúdo técnico acessível.", topic: "Comentário agregando um caso de padronização.",
      status: "sem_resposta", interactions: [{ id: "i6", date: addDays(todayISO(), -30), kind: "convite", note: "" }] }),
    c("ct_d7", { name: "Larissa Teste", role: "Analista de Dados — Operações", company: "Serra Logística (demo)", category: "complementar", area: "Dados",
      reason: "Área complementar: dados aplicados a operações.", learn: "Como estruturar dashboards operacionais.", topic: "Dica de primeiros passos em Power BI." }),
  ];
}

function demoJobs(): Job[] {
  const j = (id: string, o: Partial<Job> & Pick<Job, "title" | "company" | "city" | "mode" | "skills">): Job => ({
    ...meta(id), area: "", contract: "CLT", seniority: "Pleno", salaryMin: null, salaryMax: null, salarySource: "", publishedAt: null,
    requirements: [], education: "", url: "", source: "Vaga fictícia (demonstração)", verifiedAt: null, activeConfirmed: false,
    status: "interessada", notes: "", nextStep: "", history: [], ...o,
  });
  const t = todayISO();
  return [
    j("job_d1", { title: "Analista de Facilities Pleno", company: "Pinhal Facilities (demo)", area: "Facilities", city: "Curitiba", mode: "hibrido", publishedAt: addDays(t, -3),
      skills: ["Gestão de facilities", "Manutenção predial", "Gestão de fornecedores e contratos", "Indicadores e KPIs", "Excel avançado", "Infraestrutura física"],
      requirements: ["Superior em Engenharia, Arquitetura ou Administração", "Experiência com gestão de fornecedores", "Excel avançado", "Desejável Power BI"],
      education: "Arquitetura", salaryMin: 5500, salaryMax: 7000, salarySource: "Divulgada no anúncio (fictício)", status: "analisar",
      history: [{ date: addDays(t, -2), status: "interessada", note: "Salva" }, { date: addDays(t, -1), status: "analisar", note: "" }], nextStep: "Ajustar resumo do currículo para facilities" }),
    j("job_d2", { title: "Analista de Processos e Melhoria Contínua", company: "Atlântica Varejo (demo)", area: "Processos", city: "Florianópolis", mode: "hibrido", publishedAt: addDays(t, -6),
      skills: ["Mapeamento de processos (BPMN)", "Melhoria contínua", "Indicadores e KPIs", "Power BI", "Padronização de processos", "Gestão de stakeholders"],
      requirements: ["Experiência com mapeamento de processos", "Power BI", "Metodologias Lean"], education: "", status: "interessada" }),
    j("job_d3", { title: "Analista de Operações — Expansão", company: "Araucária Educação (demo)", area: "Operações", city: "Remoto", mode: "remoto", publishedAt: addDays(t, -10),
      skills: ["Indicadores e KPIs", "Padronização de processos", "Infraestrutura física", "Gestão de stakeholders", "Excel avançado", "Gestão de projetos"],
      requirements: ["Experiência em operações multiunidade", "Excel avançado", "Boa comunicação"], education: "", status: "preparada",
      history: [{ date: addDays(t, -9), status: "interessada", note: "" }, { date: addDays(t, -5), status: "preparada", note: "Carta e currículo adaptados" }], nextStep: "Enviar até sexta" }),
    j("job_d4", { title: "Arquiteta — Projetos de Lojas", company: "Atlântica Varejo (demo)", area: "Arquitetura comercial", city: "Florianópolis", mode: "presencial", publishedAt: addDays(t, -15),
      skills: ["Arquitetura comercial", "AutoCAD", "Revit / BIM", "Visual merchandising", "Gestão de projetos"], requirements: ["CAU ativo", "Revit avançado", "Portfólio de varejo"], education: "Arquitetura", seniority: "Pleno" }),
    j("job_d5", { title: "Workplace Experience Analyst", company: "Ilha Workplace (demo)", area: "Workplace", city: "Florianópolis", mode: "hibrido", publishedAt: addDays(t, -4),
      skills: ["Workplace experience", "Gestão de facilities", "Gestão de stakeholders", "Comunicação visual", "Inglês"], requirements: ["Inglês avançado", "Experiência com atendimento a usuários de espaços"], education: "" , status: "enviada",
      history: [{ date: addDays(t, -4), status: "interessada", note: "" }, { date: addDays(t, -2), status: "enviada", note: "Candidatura pelo site" }], nextStep: "Acompanhar retorno em 7 dias" }),
    j("job_d6", { title: "Consultora de Qualidade Sr.", company: "Araucária Educação (demo)", area: "Qualidade", city: "Curitiba", mode: "presencial", publishedAt: addDays(t, -21), seniority: "Sênior",
      skills: ["Auditoria e qualidade", "Padronização de processos", "Indicadores e KPIs", "Gestão de stakeholders", "Melhoria contínua"], requirements: ["5+ anos em qualidade"], education: "", status: "entrevista",
      history: [{ date: addDays(t, -20), status: "enviada", note: "" }, { date: addDays(t, -3), status: "entrevista", note: "Entrevista com RH marcada" }], nextStep: "Preparar casos STAR" }),
    j("job_d7", { title: "Analista de BI", company: "Serra Logística (demo)", area: "Dados", city: "São Paulo", mode: "presencial", publishedAt: addDays(t, -2),
      skills: ["SQL", "Power BI", "Análise de dados", "Excel avançado"], requirements: ["SQL avançado", "Python desejável"], education: "", status: "interessada" }),
    j("job_d8", { title: "Analista de Infraestrutura Predial", company: "Litoral Shopping Centers (demo)", area: "Infraestrutura", city: "Curitiba", mode: "presencial", publishedAt: addDays(t, -8),
      skills: ["Infraestrutura física", "Manutenção predial", "Normas técnicas (NBR/NR)", "AutoCAD", "Orçamento e custos"], requirements: ["Conhecimento de NRs", "AutoCAD"], education: "Arquitetura", contract: "CLT" }),
  ];
}

function demoCompanies(): Company[] {
  const t = todayISO();
  const ev = (id: string, text: string, kind: Company["evidence"][number]["kind"], source: string) => ({ id, text, kind, source, url: "", date: addDays(t, -30) });
  const base = (id: string): Omit<Company, "name" | "sector"> => ({
    ...meta(id), website: "", hq: "", history: "", businessModel: "", products: "", mission: "", vision: "", declaredValues: [], culture: "", priorities: "",
    positioning: "", geography: "", areas: [], likelyRoles: [], evidence: [], trends: [], peopleContent: [], pains: [],
    valueCreation: { problems: "", skills: "", areas: "", content: "", people: "", develop: "", profile: "", nextStep: "" }, missingInfo: [], lastResearchAt: addDays(t, -5),
  });
  return [
    {
      ...base("co_d1"), name: "Atlântica Varejo (demo)", sector: "Varejo de moda", hq: "Florianópolis, SC",
      history: "Empresa fictícia criada para demonstração. Rede regional de lojas de moda fundada nos anos 2000, em expansão para o Paraná.",
      businessModel: "Lojas próprias + e-commerce", products: "Vestuário e acessórios", mission: "(demo) Vestir pessoas reais com qualidade e acessibilidade.",
      vision: "(demo) Ser a rede de moda mais admirada do Sul.", declaredValues: ["Organização e clareza", "Foco no cliente", "Aprendizado contínuo", "Sustentabilidade"],
      culture: "(demo) Declara cultura de dono e decisões orientadas por dados.", priorities: "(demo) Expansão de lojas e padronização da experiência em loja.",
      positioning: "Moda acessível com experiência de loja cuidada.", geography: "SC e PR (demo)",
      areas: ["Arquitetura comercial", "Visual merchandising", "Padronização de processos", "Indicadores e KPIs", "Gestão de projetos", "Melhoria contínua"],
      likelyRoles: ["Analista de Processos e Melhoria Contínua", "Arquiteta – Arquitetura Comercial", "Visual Merchandising"],
      evidence: [
        ev("e1", "Site institucional afirma foco em 'decisões orientadas por dados'.", "oficial", "Site institucional (demo)"),
        ev("e2", "Reportagem regional sobre abertura de 6 lojas em 12 meses.", "independente", "Jornal regional (demo)"),
        ev("e3", "Volume de vagas de processos sugere reestruturação operacional.", "inferencia", "Análise NEXO sobre vagas demo"),
      ],
      trends: [
        { id: "t1", what: "Plano de expansão para o Paraná", since: addDays(t, -120), source: "Comunicado (demo)", url: "", why: "Exige padrão de implantação de lojas e controle de obras.", opportunities: "Projetos de lojas, implantação, padronização.", skills: "Gestão de projetos, arquitetura comercial, checklists de implantação.", action: "Publicar: 'O que um checklist de implantação de loja precisa ter'.", kind: "confirmada" },
        { id: "t2", what: "Integração loja física + digital (retirada em loja)", since: addDays(t, -200), source: "Tendência setorial (demo)", url: "", why: "Muda layout de estoque e áreas de atendimento.", opportunities: "Layout operacional, processos de loja.", skills: "Processos, layout, VM.", action: "Comentar posts de lideranças de operações sobre o tema.", kind: "tendencia" },
        { id: "t3", what: "Possível criação de área de excelência operacional", since: addDays(t, -30), source: "Inferência sobre vagas (demo)", url: "", why: "Volume de vagas de processos.", opportunities: "Analista de processos.", skills: "BPMN, Power BI.", action: "Perguntar a profissionais da área em conversa informativa.", kind: "hipotese" },
      ],
      peopleContent: [
        { id: "pc1", personType: "lideranca", theme: "Bastidores de abertura de loja", format: "Imagem + texto", opening: "Números do dia de inauguração", approach: "Narrativa de equipe", observable: "Reações e comentários visíveis na amostra demo", dataQuality: "parcial", source: "Amostra demo de 5 publicações" },
        { id: "pc2", personType: "area_interesse", theme: "Padronização de VM entre lojas", format: "Carrossel", opening: "Antes e depois", approach: "Educativa", observable: "Comentários com perguntas técnicas", dataQuality: "qualitativa", source: "Amostra demo" },
      ],
      pains: [
        { id: "p1", audience: "consumidores", theme: "Filas e tempo de atendimento em provadores", category: "Experiência em loja", recurrence: 14, sampleSize: 60, severity: "media", summary: "Reclamações sobre espera em provadores aos fins de semana.", source: "Avaliações públicas (demo)", url: "", period: "últimos 6 meses (demo)", companyResponse: "Respostas padrão sem plano divulgado", evolution: "persistente", causeHypothesis: "Hipótese: layout e dimensionamento de provadores não acompanharam o fluxo.", opportunity: "Análise de fluxo e layout — arquitetura comercial + processos." },
        { id: "p2", audience: "consumidores", theme: "Divergência de estoque entre site e loja", category: "Processos", recurrence: 9, sampleSize: 60, severity: "alta", summary: "Produto aparece disponível no site e não está na loja.", source: "Avaliações públicas (demo)", url: "", period: "últimos 6 meses (demo)", companyResponse: "Pedido de desculpas e cupom", evolution: "indefinido", causeHypothesis: "Hipótese: processo de atualização de estoque não padronizado.", opportunity: "Padronização de processos e indicadores." },
        { id: "p3", audience: "funcionarios", theme: "Mudanças frequentes de padrão sem treinamento", category: "Comunicação interna", recurrence: 6, sampleSize: 22, severity: "media", summary: "Avaliações de empregador citam padrões de VM alterados sem orientação.", source: "Avaliações de empregador (demo)", url: "", period: "último ano (demo)", companyResponse: "Não identificada", evolution: "persistente", causeHypothesis: "Hipótese: ausência de guia visual padronizado.", opportunity: "Materiais visuais e guias de padrão — comunicação visual." },
        { id: "p4", audience: "candidatos", theme: "Processos seletivos longos", category: "Recrutamento", recurrence: 3, sampleSize: 10, severity: "baixa", summary: "Poucos relatos de demora no retorno.", source: "Relatos de candidatos (demo)", url: "", period: "último ano (demo)", companyResponse: "Não identificada", evolution: "isolado", causeHypothesis: "Amostra pequena — não é possível concluir.", opportunity: "—" },
      ],
      valueCreation: {
        problems: "Padronização de lojas em expansão e consistência de estoque/experiência (demo).",
        skills: "Padronização de processos, infraestrutura física, comunicação visual, indicadores.",
        areas: "Excelência operacional, expansão/implantação, VM.",
        content: "Carrossel: 'Como padronizar a experiência de lojas em expansão sem engessar a operação'.",
        people: "Analistas de processos e coordenação de expansão (ver Networking).",
        develop: "BPMN e Power BI.",
        profile: "Destacar 'padronização de unidades' e 'requisitos de infraestrutura' no título e nas experiências.",
        nextStep: "Conversa de 15 min com alguém de processos para validar a hipótese de excelência operacional.",
      },
      missingInfo: ["Valores e cultura verificados em fonte independente", "Faixas salariais", "Estrutura da área de operações"],
    },
    {
      ...base("co_d2"), name: "Pinhal Facilities (demo)", sector: "Serviços de facilities", hq: "Curitiba, PR",
      history: "Empresa fictícia. Prestadora de serviços integrados de facilities para escritórios e escolas.", businessModel: "B2B — contratos de serviços",
      products: "Manutenção predial, limpeza, gestão de espaços", mission: "(demo) Cuidar dos espaços para que as pessoas possam focar no que importa.",
      declaredValues: ["Segurança", "Qualidade", "Organização e clareza"], culture: "(demo) Operação de campo, foco em SLA.",
      priorities: "(demo) Digitalização de ordens de serviço.", positioning: "Facilities integrado regional.", geography: "PR (demo)",
      areas: ["Gestão de facilities", "Manutenção predial", "Infraestrutura física", "Indicadores e KPIs", "Gestão de fornecedores e contratos", "Auditoria e qualidade"],
      likelyRoles: ["Analista de Facilities", "Analista de Infraestrutura (física)", "Consultor(a) de Qualidade"],
      evidence: [ev("e4", "Site cita contratos com instituições de ensino.", "oficial", "Site (demo)")],
      trends: [{ id: "t4", what: "Digitalização de ordens de serviço", since: addDays(t, -90), source: "Post institucional (demo)", url: "", why: "Gera dados de SLA e necessidade de indicadores.", opportunities: "Análise de indicadores de manutenção.", skills: "Power BI, KPIs de manutenção.", action: "Publicar sobre indicadores de manutenção em escolas.", kind: "confirmada" }],
      pains: [{ id: "p5", audience: "funcionarios", theme: "Sobrecarga em equipes de campo", category: "Operação", recurrence: 5, sampleSize: 15, severity: "media", summary: "Relatos de muitas ordens por técnico.", source: "Avaliações de empregador (demo)", url: "", period: "último ano (demo)", companyResponse: "Não identificada", evolution: "indefinido", causeHypothesis: "Hipótese: priorização de chamados sem critério de criticidade.", opportunity: "Matriz de criticidade e indicadores." }],
      valueCreation: { problems: "Priorização de manutenção e qualidade em escolas (demo).", skills: "Experiência em unidades educacionais e qualidade.", areas: "Facilities / qualidade de contratos.", content: "Post: 'O que observar em uma vistoria de infraestrutura escolar'.", people: "Recrutadora e especialista de manutenção (demo).", develop: "Manutenção predial, contratos.", profile: "Incluir 'facilities' no título.", nextStep: "Responder à recrutadora após aceite do convite." },
      missingInfo: ["Valores verificados", "Cultura observada", "Tamanho da equipe"],
    },
    {
      ...base("co_d3"), name: "Ilha Workplace (demo)", sector: "Coworking e workplace", hq: "Florianópolis, SC",
      history: "Empresa fictícia de espaços flexíveis para empresas de tecnologia.", businessModel: "Assinatura de espaços",
      areas: ["Workplace experience", "Gestão de facilities", "Gestão de stakeholders"], likelyRoles: ["Workplace Experience"],
      declaredValues: [], missingInfo: ["Missão e valores", "Tendências", "Dores públicas", "Conteúdo de profissionais"],
    },
  ];
}

function demoPlan(): PlanItem[] {
  const p = (id: string, phase: 30 | 60 | 90, title: string, hours: number, skill: string, done = false): PlanItem => ({ ...meta(id), phase, title, hours, skill, done });
  return [
    p("pl1", 30, "Reescrever título e Sobre com foco em facilities e processos", 2, "Posicionamento", true),
    p("pl2", 30, "Concluir trilha introdutória de Power BI e montar 1 dashboard de exemplo", 8, "Power BI"),
    p("pl3", 30, "Documentar 1 estudo de caso de padronização (anonimizado)", 3, "Padronização de processos"),
    p("pl4", 60, "Mapear 1 processo em BPMN e publicar o aprendizado", 6, "Mapeamento de processos (BPMN)"),
    p("pl5", 60, "3 conversas informativas com profissionais de facilities", 3, "Gestão de facilities"),
    p("pl6", 90, "Avaliar certificação PL-300 ou FMP conforme vagas acompanhadas", 2, "Power BI"),
    p("pl7", 90, "Revisar matriz de competências com dados das vagas", 1, "Planejamento"),
  ];
}

export function buildSeed(): AppData {
  return {
    version: DATA_VERSION,
    profile: buildInitialProfile(),
    ssi: demoSSI(),
    metrics: demoMetrics(),
    posts: demoPosts(),
    references: demoReferences(),
    contacts: demoContacts(),
    jobs: demoJobs(),
    companies: demoCompanies(),
    roles: roles(),
    courses: courses(),
    plan: demoPlan(),
    tasks: [],
    imports: [],
    settings: DEFAULT_SETTINGS,
  };
}
