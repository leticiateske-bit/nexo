/**
 * Importadores de arquivos. Tudo vira uma importação PENDENTE que precisa
 * de revisão antes de entrar nos dados definitivos.
 */
import type { Contact, Job, MetricSnapshot, PendingImport, WorkMode } from "../types";
import { norm, nowISO, parseCSV, termMatch, uid } from "../utils";

const CANONICAL_SKILLS = [
  "Gestão de facilities", "Manutenção predial", "Infraestrutura física", "Gestão de projetos", "Melhoria contínua", "Lean", "Six Sigma",
  "Mapeamento de processos (BPMN)", "Padronização de processos", "Indicadores e KPIs", "Análise de dados", "Excel avançado", "Power BI",
  "SQL", "Python", "AutoCAD", "Revit / BIM", "SketchUp", "Visual merchandising", "Arquitetura comercial", "Comunicação visual", "Canva",
  "Gestão de stakeholders", "Auditoria e qualidade", "ISO 9001", "Gestão de fornecedores e contratos", "Orçamento e custos",
  "Normas técnicas (NBR/NR)", "Workplace experience", "Inglês", "Espanhol", "MS Project", "Gestão de obras",
];

const pending = (kind: PendingImport["kind"], fileName: string, summary: string, payload: unknown): PendingImport => {
  const t = nowISO();
  return { id: uid("imp"), origin: "import", createdAt: t, updatedAt: t, kind, fileName, summary, payload };
};

export interface ResumePayload {
  text: string; skills: string[]; years: number | null; emails: number;
  /** Preenchido quando a IA organizou o currículo. */
  structured?: import("../ai-client").StructuredResume;
}

export function parseResume(text: string, fileName: string): PendingImport {
  const nt = norm(text);
  const skills = CANONICAL_SKILLS.filter((s) => { const ws = norm(s).split(/[\s/()]+/).filter((w) => w.length > 2 && w !== "de"); return ws.length > 0 && ws.every((w) => nt.includes(w)); });
  const yearsMatches = Array.from(text.matchAll(/(19|20)\d{2}/g)).map((m) => Number(m[0])).filter((y) => y <= new Date().getFullYear());
  const years = yearsMatches.length ? Math.max(0, new Date().getFullYear() - Math.min(...yearsMatches)) : null;
  const payload: ResumePayload = { text: text.slice(0, 20000), skills, years, emails: (text.match(/@/g) ?? []).length };
  return pending("curriculo", fileName, `${skills.length} competências detectadas${years !== null ? ` · primeiro ano citado há ${years} anos` : ""}`, payload);
}

const pick = (r: Record<string, string>, ...keys: string[]) => {
  for (const k of Object.keys(r)) if (keys.some((x) => termMatch(k, x) && k.toLowerCase().includes(x.toLowerCase().slice(0, 4)))) return r[k];
  return "";
};
const n = (v: string) => (v === "" || v === undefined ? null : Number(v.replace(/\./g, "").replace(",", ".")));

export function parseMetricsCSV(text: string, fileName: string): PendingImport {
  const rows = parseCSV(text);
  const items: MetricSnapshot[] = rows.map((r): MetricSnapshot => {
    const t = nowISO();
    return {
      id: uid("met"), origin: "import", createdAt: t, updatedAt: t,
      date: pick(r, "date", "data", "semana"),
      connections: n(pick(r, "connections", "conexoes", "conexões")), followers: n(pick(r, "followers", "seguidores")),
      profileViews: n(pick(r, "profileViews", "visualizacoes", "visualizações")), searchAppearances: n(pick(r, "searchAppearances", "aparicoes", "pesquisas")),
      impressions: n(pick(r, "impressions", "impressoes", "impressões")), reactions: n(pick(r, "reactions", "reacoes", "reações")),
      comments: n(pick(r, "comments", "comentarios recebidos", "comentários")), shares: n(pick(r, "shares", "compartilhamentos")),
      commentsMade: n(pick(r, "commentsMade", "comentarios feitos")), invitesSent: n(pick(r, "invitesSent", "convites enviados")), invitesAccepted: n(pick(r, "invitesAccepted", "convites aceitos")),
    };
  }).filter((m) => /^\d{4}-\d{2}-\d{2}$/.test(m.date));
  return pending("metricas", fileName, `${items.length} registro(s) válido(s) de ${rows.length} linha(s) · datas no formato AAAA-MM-DD`, items);
}

export function parseContactsCSV(text: string, fileName: string): PendingImport {
  const rows = parseCSV(text);
  const items: Contact[] = rows.map((r): Contact => {
    const t = nowISO();
    const first = pick(r, "first name", "nome"), last = pick(r, "last name", "sobrenome");
    return {
      id: uid("ct"), origin: "import", createdAt: t, updatedAt: t,
      name: [first, last].filter(Boolean).join(" ") || pick(r, "name"), role: pick(r, "position", "cargo"), company: pick(r, "company", "empresa"),
      area: pick(r, "area", "área"), category: "complementar", reason: "", learn: "", topic: "", profileUrl: pick(r, "url", "link", "perfil"),
      source: `Importado de ${fileName}`, verifiedAt: null, status: "conectado", interactions: [], nextStep: "", nextStepDate: null, tags: [],
    };
  }).filter((c) => c.name);
  return pending("contatos", fileName, `${items.length} contato(s). Compatível com o export de conexões do LinkedIn (First Name, Last Name, URL, Company, Position) — remova a nota inicial do arquivo se houver.`, items);
}

export function parseJobsCSV(text: string, fileName: string): PendingImport {
  const rows = parseCSV(text);
  const items: Job[] = rows.map((r): Job => {
    const t = nowISO();
    const modeRaw = pick(r, "modalidade", "mode").toLowerCase();
    const mode: WorkMode = modeRaw.includes("remot") ? "remoto" : modeRaw.includes("presen") ? "presencial" : "hibrido";
    return {
      id: uid("job"), origin: "import", createdAt: t, updatedAt: t, title: pick(r, "cargo", "title"), company: pick(r, "empresa", "company"), area: pick(r, "area", "área"),
      city: pick(r, "cidade", "city"), mode, contract: null, seniority: null, salaryMin: null, salaryMax: null, salarySource: "", publishedAt: pick(r, "publicacao", "publicação", "data") || null,
      requirements: pick(r, "requisitos").split(";").map((s) => s.trim()).filter(Boolean), skills: pick(r, "competencias", "competências", "skills").split(";").map((s) => s.trim()).filter(Boolean),
      education: "", url: pick(r, "link", "url"), source: `Importado de ${fileName}`, verifiedAt: null, activeConfirmed: false, status: "interessada", notes: "", nextStep: "",
      history: [{ date: t.slice(0, 10), status: "interessada", note: "Importada" }],
    };
  }).filter((j) => j.title && j.company);
  return pending("vagas", fileName, `${items.length} vaga(s) · competências separadas por “;”`, items);
}

export const CSV_TEMPLATES = {
  metricas: "data,conexoes,seguidores,visualizacoes,aparicoes,impressoes,reacoes,comentarios,compartilhamentos,comentarios feitos,convites enviados,convites aceitos\n2026-10-19,700,720,45,60,1500,40,8,2,6,10,5\n",
  contatos: "First Name,Last Name,URL,Company,Position\nNome,Sobrenome,https://www.linkedin.com/in/exemplo,Empresa,Cargo\n",
  vagas: "cargo,empresa,area,cidade,modalidade,publicacao,competencias,requisitos,link\nAnalista de Facilities,Empresa X,Facilities,Curitiba,híbrido,2026-10-20,Gestão de facilities;Excel avançado,Superior completo;Excel,https://\n",
};
