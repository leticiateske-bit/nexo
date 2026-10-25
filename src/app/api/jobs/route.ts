import { checkAccess, errorResponse, extractJSON, normUrl, researchWithWeb } from "@/lib/server/claude";

export const runtime = "nodejs";
export const maxDuration = 300;

interface JobSearchInput {
  roles: string[];
  cities: string[];
  remote: boolean;
  seniority: string[];
  skills: string[];
  companies: string[];
  exclude: string[];
}

const SYSTEM = `Você é especialista em recrutamento no Brasil e encontra vagas de emprego REAIS e ABERTAS na web.

Regras inegociáveis:
- Só inclua vagas que você viu em uma página específica da vaga (site de carreiras da empresa, Gupy, LinkedIn Jobs, Vagas.com, InfoJobs, Indeed, Catho, Solides, Kenoby etc.). A URL deve ser a da vaga, exatamente como apareceu na pesquisa.
- Nunca invente vagas, empresas, salários, requisitos ou datas. Salário só se estiver escrito na vaga.
- Prefira vagas publicadas nos últimos 30 dias. Se a página indicar que a vaga foi encerrada, não inclua.
- Abra (web_fetch) as páginas das vagas mais promissoras para confirmar requisitos e se ainda estão abertas.
- Se não encontrar vagas suficientes, devolva menos. Lista curta e real é melhor que lista longa e duvidosa.`;

function prompt(q: JobSearchInput) {
  return `Encontre até 12 vagas abertas para estes cargos: ${q.roles.join("; ")}.
Localização: ${q.cities.join(", ")}${q.remote ? " ou remoto (Brasil)" : ""}.
Senioridade desejada: ${q.seniority.join(", ") || "qualquer"}.
${q.companies.length ? `Dê atenção especial a estas empresas: ${q.companies.join(", ")}.` : ""}
${q.exclude.length ? `Ignore estas vagas, que já estão salvas: ${q.exclude.slice(0, 40).join("; ")}.` : ""}

Para "skills", use de preferência os mesmos nomes desta lista quando a vaga pedir a competência: ${q.skills.join(", ")}. Inclua também competências pedidas que não estão na lista.

Responda APENAS com um bloco \`\`\`json:
{"jobs": [{
  "title": "", "company": "", "area": "", "city": "", "mode": "remoto|hibrido|presencial",
  "contract": "CLT|PJ|Temporário|Estágio|Freelance|", "seniority": "Júnior|Pleno|Sênior|Especialista|Coordenação|",
  "salaryMin": null, "salaryMax": null, "publishedAt": "AAAA-MM-DD ou vazio",
  "requirements": [""], "skills": [""], "education": "", "url": "", "source": "nome do site", "stillOpen": true
}]}`;
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const arr = (v: unknown) => (Array.isArray(v) ? v.map(str).filter(Boolean) : []);
const money = (v: unknown) => (typeof v === "number" && v > 500 && v < 200000 ? Math.round(v) : null);
const oneOf = <T extends string>(v: unknown, xs: readonly T[]) => (xs.includes(v as T) ? (v as T) : null);

export async function POST(req: Request) {
  try {
    checkAccess(req);
    const q = (await req.json()) as JobSearchInput;
    if (!q.roles?.length) return Response.json({ error: "Informe ao menos um cargo." }, { status: 400 });

    const { text, seenUrls, fetchedUrls, searches } = await researchWithWeb(SYSTEM, prompt(q), { maxSearches: 10, maxFetches: 8 });
    const raw = extractJSON<{ jobs?: Record<string, unknown>[] }>(text);
    let discarded = 0;
    const today = new Date().toISOString().slice(0, 10);

    const jobs = (raw.jobs ?? []).flatMap((j) => {
      const url = str(j.url);
      // Sem link visto na pesquisa, a vaga não é aceita: não há como confirmar que existe.
      if (!url || !seenUrls.has(normUrl(url)) || j.stillOpen === false) { discarded++; return []; }
      const title = str(j.title), company = str(j.company);
      if (!title || !company) { discarded++; return []; }
      const published = /^\d{4}-\d{2}-\d{2}$/.test(str(j.publishedAt)) ? str(j.publishedAt) : null;
      const salaryMin = money(j.salaryMin), salaryMax = money(j.salaryMax);
      return [{
        title, company, area: str(j.area), city: str(j.city) || "Não informado",
        mode: oneOf(j.mode, ["remoto", "hibrido", "presencial"] as const) ?? "presencial",
        contract: oneOf(j.contract, ["CLT", "PJ", "Temporário", "Estágio", "Freelance"] as const),
        seniority: oneOf(j.seniority, ["Júnior", "Pleno", "Sênior", "Especialista", "Coordenação"] as const),
        salaryMin, salaryMax, salarySource: salaryMin || salaryMax ? "Divulgado no anúncio" : "",
        publishedAt: published, requirements: arr(j.requirements), skills: arr(j.skills), education: str(j.education),
        url, source: str(j.source) || new URL(url).hostname, verifiedAt: today,
        // "Ativa" só quando a página da vaga foi aberta durante a pesquisa.
        activeConfirmed: fetchedUrls.has(normUrl(url)),
      }];
    });

    return Response.json({ jobs, meta: { searches, discarded, searchedAt: new Date().toISOString() } });
  } catch (e) {
    return errorResponse(e);
  }
}
