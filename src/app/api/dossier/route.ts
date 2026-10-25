import { checkAccess, errorResponse, extractJSON, hostOf, normUrl, researchWithWeb } from "@/lib/server/claude";

export const runtime = "nodejs";
export const maxDuration = 300;

interface ProfileSummary {
  headline: string;
  targetRoles: string[];
  interests: string[];
  skills: string[];
  values: string[];
  cities: string[];
}

const SYSTEM = `Você é analista de inteligência de mercado e carreira. Pesquisa empresas na web e produz dossiês factuais em português do Brasil.

Regras inegociáveis:
- Use somente informações encontradas nas pesquisas e páginas que você abriu. Nunca invente fatos, números, datas, citações ou URLs.
- Toda afirmação factual precisa de fonte com a URL exata de onde veio.
- Separe o discurso institucional (site, relatórios da própria empresa) do que fontes independentes (imprensa, órgãos públicos, avaliações) observam.
- Classifique tendências como "confirmada" (notícia com fonte), "tendencia" (movimento do setor observado) ou "hipotese" (sua inferência).
- Para dores e reclamações: só registre padrões que você realmente viu em fontes públicas; informe o período. Preencha recurrence/sampleSize apenas se você contou de fato numa amostra; caso contrário use 0 e diga no resumo que a amostra não foi quantificada. Não inclua nomes de pessoas físicas nem dados pessoais.
- Publicações no LinkedIn costumam exigir login: não afirme métricas de alcance ou engajamento. Em peopleContent, inclua apenas conteúdos públicos de profissionais da empresa que você viu (artigos, entrevistas, palestras), como análise qualitativa — ou deixe a lista vazia.
- Se não encontrar algo, deixe o campo vazio ("" ou []) e liste em missingInfo. Campo vazio é melhor que palpite.`;

function prompt(name: string, website: string, p: ProfileSummary) {
  return `Pesquise a empresa "${name}"${website ? ` (site: ${website})` : ""} e monte o dossiê.

Perfil da profissional que vai usar o dossiê (para as seções de áreas, cargos e geração de valor):
- Posicionamento: ${p.headline}
- Cargos-alvo: ${p.targetRoles.join(", ")}
- Áreas de interesse em ordem de prioridade: ${p.interests.join(" > ")}
- Competências: ${p.skills.join(", ")}
- Valores: ${p.values.join(", ")}
- Cidades preferidas: ${p.cities.join(", ")} e remoto

Procure: site institucional (sobre, missão/valores, carreiras), notícias dos últimos 24 meses (expansão, lançamentos, reestruturações), relatórios públicos e avaliações públicas de consumidores e de funcionários.

Em "areas", liste de 4 a 8 áreas de atuação da empresa relevantes para esta profissional, usando de preferência os mesmos nomes das competências dela quando houver correspondência real.
Em "likelyRoles", cargos que a empresa provavelmente contrata e que se aproximam dos cargos-alvo (baseie-se em páginas de carreira ou vagas vistas, quando houver).
Em "valueCreation", recomendações pessoais e realistas ligando os problemas encontrados às competências dela.

Responda APENAS com um bloco \`\`\`json contendo exatamente este formato:
{
  "name": "", "sector": "", "website": "", "hq": "",
  "history": "", "businessModel": "", "products": "", "mission": "", "vision": "",
  "declaredValues": [""], "culture": "", "priorities": "", "positioning": "", "geography": "",
  "areas": [""], "likelyRoles": [""],
  "evidence": [{"text": "", "kind": "oficial|independente|inferencia|hipotese", "source": "", "url": "", "date": "AAAA-MM-DD"}],
  "trends": [{"what": "", "since": "AAAA-MM-DD ou vazio", "source": "", "url": "", "why": "", "opportunities": "", "skills": "", "action": "", "kind": "confirmada|tendencia|hipotese"}],
  "peopleContent": [{"personType": "lideranca|recrutador|especialista|area_interesse|cultura", "theme": "", "format": "", "opening": "", "approach": "", "observable": "", "dataQuality": "qualitativa", "source": ""}],
  "pains": [{"audience": "consumidores|funcionarios|candidatos", "theme": "", "category": "", "recurrence": 0, "sampleSize": 0, "severity": "baixa|media|alta", "summary": "", "source": "", "url": "", "period": "", "companyResponse": "", "evolution": "persistente|em_melhora|isolado|indefinido", "causeHypothesis": "", "opportunity": ""}],
  "valueCreation": {"problems": "", "skills": "", "areas": "", "content": "", "people": "", "develop": "", "profile": "", "nextStep": ""},
  "missingInfo": [""]
}`;
}

type Row = Record<string, unknown>;
const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const arr = (v: unknown) => (Array.isArray(v) ? v.map(str).filter(Boolean) : []);
const num = (v: unknown) => (typeof v === "number" && isFinite(v) && v >= 0 ? Math.round(v) : 0);
const isoDate = (v: unknown) => (/^\d{4}-\d{2}-\d{2}$/.test(str(v)) ? str(v) : "");

export async function POST(req: Request) {
  try {
    checkAccess(req);
    const body = (await req.json()) as { name?: string; website?: string; profile?: ProfileSummary };
    const name = str(body.name);
    if (!name || name.length > 120) return Response.json({ error: "Informe o nome da empresa." }, { status: 400 });
    const profile = body.profile ?? { headline: "", targetRoles: [], interests: [], skills: [], values: [], cities: [] };

    const { text, seenUrls, searches } = await researchWithWeb(SYSTEM, prompt(name, str(body.website), profile), { maxSearches: 10, maxFetches: 8 });
    const raw = extractJSON<Row>(text);
    let unverified = 0;

    // Só mantém links que a pesquisa realmente retornou ou abriu.
    const checkUrl = (u: unknown) => {
      const url = str(u);
      if (!url) return "";
      if (seenUrls.has(normUrl(url))) return url;
      unverified++;
      return "";
    };
    const seenHosts = new Set(Array.from(seenUrls).map((u) => u.split("/")[0]));
    const site = str(raw.website) || str(body.website);
    const website = site && seenHosts.has(hostOf(site)) ? site : str(body.website);
    const today = new Date().toISOString().slice(0, 10);
    const id = () => Math.random().toString(36).slice(2, 10);

    const evidence = (Array.isArray(raw.evidence) ? (raw.evidence as Row[]) : []).map((e) => {
      const url = checkUrl(e.url);
      return { id: id(), text: str(e.text), kind: pick(e.kind, ["oficial", "independente", "inferencia", "hipotese"] as const, "inferencia"), source: str(e.source) + (str(e.url) && !url ? " (link não confirmado)" : ""), url, date: isoDate(e.date) || today };
    }).filter((e) => e.text);

    const trends = (Array.isArray(raw.trends) ? (raw.trends as Row[]) : []).map((t) => {
      const url = checkUrl(t.url);
      return { id: id(), what: str(t.what), since: isoDate(t.since), source: str(t.source) + (str(t.url) && !url ? " (link não confirmado)" : ""), url, why: str(t.why), opportunities: str(t.opportunities), skills: str(t.skills), action: str(t.action), kind: pick(t.kind, ["confirmada", "tendencia", "hipotese"] as const, "hipotese") };
    }).map((t) => (t.kind === "confirmada" && !t.url ? { ...t, kind: "tendencia" as const } : t)).filter((t) => t.what);

    const pains = (Array.isArray(raw.pains) ? (raw.pains as Row[]) : []).map((p) => {
      const url = checkUrl(p.url);
      return {
        id: id(), audience: pick(p.audience, ["consumidores", "funcionarios", "candidatos"] as const, "consumidores"), theme: str(p.theme), category: str(p.category),
        recurrence: num(p.recurrence), sampleSize: num(p.sampleSize), severity: pick(p.severity, ["baixa", "media", "alta"] as const, "media"), summary: str(p.summary),
        source: str(p.source) + (str(p.url) && !url ? " (link não confirmado)" : ""), url, period: str(p.period), companyResponse: str(p.companyResponse),
        evolution: pick(p.evolution, ["persistente", "em_melhora", "isolado", "indefinido"] as const, "indefinido"), causeHypothesis: str(p.causeHypothesis), opportunity: str(p.opportunity),
      };
    }).filter((p) => p.theme);

    const peopleContent = (Array.isArray(raw.peopleContent) ? (raw.peopleContent as Row[]) : []).map((p) => ({
      id: id(), personType: pick(p.personType, ["lideranca", "recrutador", "especialista", "area_interesse", "cultura"] as const, "cultura"), theme: str(p.theme), format: str(p.format),
      opening: str(p.opening), approach: str(p.approach), observable: str(p.observable), dataQuality: "qualitativa" as const, source: str(p.source),
    })).filter((p) => p.theme);

    const vc = (raw.valueCreation ?? {}) as Row;
    const dossier = {
      name: str(raw.name) || name, sector: str(raw.sector), website, hq: str(raw.hq),
      history: str(raw.history), businessModel: str(raw.businessModel), products: str(raw.products), mission: str(raw.mission), vision: str(raw.vision),
      declaredValues: arr(raw.declaredValues), culture: str(raw.culture), priorities: str(raw.priorities), positioning: str(raw.positioning), geography: str(raw.geography),
      areas: arr(raw.areas), likelyRoles: arr(raw.likelyRoles), evidence, trends, peopleContent, pains,
      valueCreation: { problems: str(vc.problems), skills: str(vc.skills), areas: str(vc.areas), content: str(vc.content), people: str(vc.people), develop: str(vc.develop), profile: str(vc.profile), nextStep: str(vc.nextStep) },
      missingInfo: arr(raw.missingInfo),
    };
    if (!evidence.some((e) => e.url) && !trends.some((t) => t.url)) dossier.missingInfo.unshift("Nenhuma fonte confirmada foi encontrada — revise com cuidado");

    return Response.json({ dossier, meta: { searches, sourcesSeen: seenUrls.size, unverifiedLinksRemoved: unverified, researchedAt: new Date().toISOString() } });
  } catch (e) {
    return errorResponse(e);
  }
}
