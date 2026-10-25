import type {
  ContactCategory, ContactStatus, CourseType, EvidenceKind, JobStatus, PainAudience,
  PostApproach, PostFormat, PostObjective, PostStatus, TaskStatus, WorkMode,
} from "./types";

export const POST_STATUS: Record<PostStatus, string> = {
  ideia: "Ideia", rascunho: "Rascunho", revisao: "Revisão", publicado: "Publicado", arquivado: "Arquivado",
};
export const POST_FORMAT: Record<PostFormat, string> = {
  texto: "Texto", carrossel: "Carrossel", documento: "Documento (PDF)", imagem: "Imagem",
};
export const POST_OBJECTIVE: Record<PostObjective, string> = {
  autoridade: "Construir autoridade",
  competencia_tecnica: "Demonstrar competência técnica",
  atrair_recrutadores: "Atrair recrutadores",
  relacionamento: "Relacionar-se com referências",
  tendencias: "Comentar tendências",
  capacidade_analitica: "Demonstrar capacidade analítica",
  estudo_de_caso: "Aprendizados e estudos de caso",
  posicionamento: "Fortalecer posicionamento",
};
export const POST_APPROACH: Record<PostApproach, string> = {
  tecnica: "Técnica", analitica: "Analítica", educativa: "Educativa", pessoal: "Pessoal-profissional", tendencia: "Orientada a tendências",
};

export const CONTACT_CATEGORY: Record<ContactCategory, string> = {
  recrutador: "Recrutadores da área-alvo",
  gestor: "Gestores que contratam",
  funcao_alvo: "Profissionais na função desejada",
  especialista: "Especialistas técnicos",
  lideranca: "Lideranças de empresas-alvo",
  criador: "Compartilham conhecimento",
  complementar: "Áreas complementares",
};
export const CONTACT_STATUS: Record<ContactStatus, string> = {
  identificado: "Identificado", abordado: "Abordado", conectado: "Conectado", em_conversa: "Em conversa", sem_resposta: "Sem resposta", arquivado: "Arquivado",
};

export const JOB_STATUS: Record<JobStatus, string> = {
  interessada: "Interessada",
  analisar: "Analisar requisitos",
  preparada: "Candidatura preparada",
  enviada: "Candidatura enviada",
  entrevista: "Entrevista",
  encerrado: "Processo encerrado",
  descartada: "Descartada",
};
export const JOB_STATUS_ORDER: JobStatus[] = ["interessada", "analisar", "preparada", "enviada", "entrevista", "encerrado", "descartada"];

export const WORK_MODE: Record<WorkMode, string> = { remoto: "Remoto", hibrido: "Híbrido", presencial: "Presencial" };

export const COURSE_TYPE: Record<CourseType, string> = {
  introdutorio: "Introdutório", pratico: "Capacitação prática", certificacao: "Certificação reconhecida", pos: "Pós-graduação",
};

export const EVIDENCE_KIND: Record<EvidenceKind, string> = {
  oficial: "Discurso institucional", independente: "Fonte independente", inferencia: "Inferência NEXO", hipotese: "Hipótese",
};

export const PAIN_AUDIENCE: Record<PainAudience, string> = {
  consumidores: "Consumidores e clientes", funcionarios: "Experiência de funcionários", candidatos: "Percepção de candidatos",
};

export const TASK_STATUS: Record<TaskStatus, string> = { pendente: "Pendente", concluida: "Concluída", descartada: "Descartada" };

export const SKILL_LEVEL = ["Não possui", "Inicial", "Básico", "Intermediário", "Avançado", "Referência"];

export const CHECKLIST_ITEMS: { key: string; label: string; pillar: "brand"; hint: string }[] = [
  { key: "foto", label: "Foto profissional", pillar: "brand", hint: "Rosto visível, fundo neutro, boa iluminação." },
  { key: "capa", label: "Imagem de capa", pillar: "brand", hint: "Comunica área de atuação; evite capa padrão." },
  { key: "titulo", label: "Título profissional claro", pillar: "brand", hint: "Cargo-alvo + especialidade + resultado/área. Evite apenas \"em busca de oportunidades\"." },
  { key: "sobre", label: "Seção Sobre", pillar: "brand", hint: "Quem você é, problemas que resolve, evidências e o que busca." },
  { key: "experiencias", label: "Experiências com resultados", pillar: "brand", hint: "Cada experiência com 2–4 resultados concretos (processos, unidades, prazos)." },
  { key: "competencias", label: "Competências priorizadas", pillar: "brand", hint: "Top 5 alinhadas aos cargos-alvo; remova as irrelevantes." },
  { key: "recomendacoes", label: "Recomendações recebidas", pillar: "brand", hint: "Ao menos 2 recentes, de gestores ou stakeholders." },
  { key: "palavras_chave", label: "Palavras-chave dos cargos-alvo", pillar: "brand", hint: "Termos usados nas vagas (facilities, melhoria contínua, indicadores…)." },
  { key: "destaques", label: "Seção Destaques / portfólio", pillar: "brand", hint: "Estudo de caso, apresentação ou carrossel de autoria própria." },
  { key: "url", label: "URL personalizada", pillar: "brand", hint: "linkedin.com/in/seu-nome" },
  { key: "coerencia", label: "Coerência com cargos pretendidos", pillar: "brand", hint: "Título, Sobre e experiências contam a mesma história." },
];
