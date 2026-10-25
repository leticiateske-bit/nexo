/**
 * Modelo de domínio do NEXO.
 * Todo registro carrega `origin`, para que a interface possa separar
 * dados demonstrativos, dados informados pelo usuário, importados ou vindos de API.
 */

/** demo = fictício para demonstração · nexo = referência curada, não verificada · user/import/api = dados reais */
export type Origin = "demo" | "nexo" | "user" | "import" | "api";

export interface Meta {
  id: string;
  origin: Origin;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ Perfil */

export type WorkMode = "remoto" | "hibrido" | "presencial";
export type ContractType = "CLT" | "PJ" | "Temporário" | "Estágio" | "Freelance";
export type Seniority = "Júnior" | "Pleno" | "Sênior" | "Especialista" | "Coordenação";

export interface Experience {
  id: string;
  role: string;
  org: string;
  start: string;
  end: string;
  description: string;
  achievements: string[];
}

export interface Education {
  id: string;
  course: string;
  institution: string;
  level: string;
  year: string;
}

export interface Skill {
  name: string;
  /** 0 = não possui · 1 inicial · 2 básico · 3 intermediário · 4 avançado · 5 referência */
  level: number;
  evidence: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  year: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  url: string;
}

export interface InterestArea {
  area: string;
  keywords: string[];
}

export type ChecklistStatus = "ok" | "melhorar" | "ausente" | "nao_avaliado";

export interface ChecklistItem {
  key: string;
  status: ChecklistStatus;
  note: string;
}

export interface Goals {
  postsPerWeek: number;
  commentsPerWeek: number;
  newContactsPerWeek: number;
  messagesPerWeek: number;
  ssiTarget: number;
  pillarTargets: { brand: number; people: number; insights: number; relationships: number };
  applicationsPerMonth: number;
  coursesPerQuarter: number;
}

export interface Profile {
  name: string;
  headline: string;
  about: string;
  location: string;
  linkedinUrl: string;
  yearsExperience: number;
  resumeText: string;
  experiences: Experience[];
  education: Education[];
  skills: Skill[];
  certifications: Certification[];
  portfolio: PortfolioItem[];
  /** Ordem do array = prioridade (índice 0 = maior prioridade). */
  interests: InterestArea[];
  values: string[];
  targetRoles: string[];
  targetSeniority: Seniority[];
  salaryMin: number | null;
  salaryMax: number | null;
  contractTypes: ContractType[];
  workModes: WorkMode[];
  cities: string[];
  skillsToDevelop: string[];
  companiesOfInterest: string[];
  objectives: string;
  goals: Goals;
  availabilityHoursWeek: number;
  trainingBudgetMonth: number | null;
  checklist: ChecklistItem[];
  onboardingDone: boolean;
  updatedAt: string;
}

/* ------------------------------------------------------- LinkedIn & métricas */

export interface SSISnapshot extends Meta {
  date: string;
  total: number;
  brand: number;
  people: number;
  insights: number;
  relationships: number;
  industryRank?: number | null;
  networkRank?: number | null;
}

export interface MetricSnapshot extends Meta {
  /** Data de fechamento da semana (ou do registro). */
  date: string;
  connections: number | null;
  followers: number | null;
  profileViews: number | null;
  searchAppearances: number | null;
  impressions: number | null;
  reactions: number | null;
  comments: number | null;
  shares: number | null;
  /** Comentários que eu fiz em publicações de terceiros. */
  commentsMade: number | null;
  invitesSent: number | null;
  invitesAccepted: number | null;
}

/* ---------------------------------------------------------------- Conteúdo */

export type PostStatus = "ideia" | "rascunho" | "revisao" | "publicado" | "arquivado";
export type PostFormat = "texto" | "carrossel" | "documento" | "imagem";
export type PostObjective =
  | "autoridade"
  | "competencia_tecnica"
  | "atrair_recrutadores"
  | "relacionamento"
  | "tendencias"
  | "capacidade_analitica"
  | "estudo_de_caso"
  | "posicionamento";
export type PostApproach = "tecnica" | "analitica" | "educativa" | "pessoal" | "tendencia";

export interface PostResults {
  impressions: number | null;
  reactions: number | null;
  comments: number | null;
  shares: number | null;
  profileVisitsAfter: number | null;
}

export interface Post extends Meta {
  title: string;
  hook: string;
  body: string;
  conclusion: string;
  cta: string;
  hashtags: string[];
  keywords: string[];
  format: PostFormat;
  objective: PostObjective;
  approach: PostApproach;
  theme: string;
  audience: string;
  rationale: string;
  visualGuide: string;
  sources: { label: string; url: string }[];
  status: PostStatus;
  scheduledDate: string | null;
  publishedDate: string | null;
  results: PostResults;
}

export interface Reference extends Meta {
  title: string;
  url: string;
  kind: "artigo" | "tendencia" | "exemplo" | "insight" | "dado";
  note: string;
  tags: string[];
}

/* -------------------------------------------------------------- Networking */

export type ContactCategory =
  | "recrutador"
  | "gestor"
  | "funcao_alvo"
  | "especialista"
  | "lideranca"
  | "criador"
  | "complementar";

export type ContactStatus = "identificado" | "abordado" | "conectado" | "em_conversa" | "sem_resposta" | "arquivado";

export interface Interaction {
  id: string;
  date: string;
  kind: "convite" | "mensagem" | "resposta" | "comentario" | "conversa" | "nota";
  note: string;
}

export interface Contact extends Meta {
  name: string;
  role: string;
  company: string;
  area: string;
  category: ContactCategory;
  reason: string;
  learn: string;
  topic: string;
  profileUrl: string;
  source: string;
  verifiedAt: string | null;
  status: ContactStatus;
  interactions: Interaction[];
  nextStep: string;
  nextStepDate: string | null;
  /** Indica se a empresa do contato está entre as empresas-alvo. Calculado. */
  tags: string[];
}

/* -------------------------------------------------------------------- Vagas */

export type JobStatus =
  | "interessada"
  | "analisar"
  | "preparada"
  | "enviada"
  | "entrevista"
  | "encerrado"
  | "descartada";

export interface Job extends Meta {
  title: string;
  company: string;
  area: string;
  city: string;
  mode: WorkMode;
  contract: ContractType | null;
  seniority: Seniority | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salarySource: string;
  publishedAt: string | null;
  requirements: string[];
  skills: string[];
  education: string;
  url: string;
  source: string;
  verifiedAt: string | null;
  activeConfirmed: boolean;
  status: JobStatus;
  notes: string;
  nextStep: string;
  history: { date: string; status: JobStatus; note: string }[];
}

/* ------------------------------------------------------------------- Marcas */

export type EvidenceKind = "oficial" | "independente" | "inferencia" | "hipotese";

export interface Evidence {
  id: string;
  text: string;
  kind: EvidenceKind;
  source: string;
  url: string;
  date: string;
}

export interface Trend {
  id: string;
  what: string;
  since: string;
  source: string;
  url: string;
  why: string;
  opportunities: string;
  skills: string;
  action: string;
  kind: "confirmada" | "tendencia" | "hipotese";
}

export interface PeopleContentInsight {
  id: string;
  personType: "lideranca" | "recrutador" | "especialista" | "area_interesse" | "cultura";
  theme: string;
  format: string;
  opening: string;
  approach: string;
  observable: string;
  dataQuality: "comparavel" | "parcial" | "qualitativa";
  source: string;
}

export type PainAudience = "consumidores" | "funcionarios" | "candidatos";

export interface Pain {
  id: string;
  audience: PainAudience;
  theme: string;
  category: string;
  recurrence: number;
  sampleSize: number;
  severity: "baixa" | "media" | "alta";
  summary: string;
  source: string;
  url: string;
  period: string;
  companyResponse: string;
  evolution: "persistente" | "em_melhora" | "isolado" | "indefinido";
  causeHypothesis: string;
  opportunity: string;
}

export interface Company extends Meta {
  name: string;
  sector: string;
  website: string;
  hq: string;
  /* identidade */
  history: string;
  businessModel: string;
  products: string;
  mission: string;
  vision: string;
  declaredValues: string[];
  culture: string;
  priorities: string;
  positioning: string;
  geography: string;
  /** Áreas de atuação/competências que a empresa demanda — base do Brand Fit. */
  areas: string[];
  likelyRoles: string[];
  evidence: Evidence[];
  trends: Trend[];
  peopleContent: PeopleContentInsight[];
  pains: Pain[];
  valueCreation: {
    problems: string;
    skills: string;
    areas: string;
    content: string;
    people: string;
    develop: string;
    profile: string;
    nextStep: string;
  };
  missingInfo: string[];
  lastResearchAt: string | null;
}

/* --------------------------------------------------------------- Carreira */

export interface RoleRequirement {
  skill: string;
  required: number;
}

export interface RoleProfile extends Meta {
  title: string;
  description: string;
  requirements: RoleRequirement[];
  tools: string[];
  evidenceToShow: string[];
  paths: string[];
  salaryNote: string;
}

export type CourseType = "introdutorio" | "pratico" | "certificacao" | "pos";

export interface Course extends Meta {
  name: string;
  institution: string;
  skill: string;
  type: CourseType;
  relevance: string;
  prerequisites: string;
  duration: string;
  cost: string;
  mode: string;
  url: string;
  source: string;
  verifiedAt: string | null;
  benefit: string;
  priority: "alta" | "media" | "baixa";
  status: "sugerido" | "planejado" | "em_andamento" | "concluido" | "descartado";
}

export interface PlanItem extends Meta {
  phase: 30 | 60 | 90;
  title: string;
  hours: number;
  done: boolean;
  skill: string;
}

/* ------------------------------------------------------------------ Tarefas */

export type TaskStatus = "pendente" | "concluida" | "descartada";

export interface Task extends Meta {
  title: string;
  why: string;
  module: "linkedin" | "conteudo" | "networking" | "carreira" | "vagas" | "marcas";
  weekOf: string;
  status: TaskStatus;
  ruleId: string | null;
}

/* ---------------------------------------------------------- Configurações */

export interface JobWeights {
  skills: number;
  experience: number;
  education: number;
  goals: number;
  logistics: number;
}

export interface BrandWeights {
  skills: number;
  experience: number;
  values: number;
  interests: number;
  roles: number;
}

export interface Settings {
  jobWeights: JobWeights;
  brandWeights: BrandWeights;
  engagementRateDefinition: "por_impressao" | "por_seguidor";
  showDemo: boolean;
}

/* ---------------------------------------------------------- Importações */

export interface PendingImport extends Meta {
  kind: "curriculo" | "metricas" | "contatos" | "vagas";
  fileName: string;
  summary: string;
  payload: unknown;
}

export interface AppData {
  version: number;
  profile: Profile;
  ssi: SSISnapshot[];
  metrics: MetricSnapshot[];
  posts: Post[];
  references: Reference[];
  contacts: Contact[];
  jobs: Job[];
  companies: Company[];
  roles: RoleProfile[];
  courses: Course[];
  plan: PlanItem[];
  tasks: Task[];
  imports: PendingImport[];
  settings: Settings;
}

export type CollectionKey = {
  [K in keyof AppData]: AppData[K] extends Meta[] ? K : never;
}[keyof AppData];
