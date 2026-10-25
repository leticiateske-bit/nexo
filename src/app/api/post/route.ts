import { checkAccess, complete, errorResponse, extractJSON } from "@/lib/server/claude";

export const runtime = "nodejs";
export const maxDuration = 120;

interface PostInput {
  idea: { title: string; objective: string; approach: string; theme: string; format: string; trend?: { what: string; why: string; source: string; url: string; kind: string } };
  profile: {
    name: string; headline: string; about: string; targetRoles: string[]; interests: string[];
    experiences: { role: string; org: string; description: string; achievements: string[] }[];
    skills: { name: string; level: number; evidence: string }[];
    education: string[]; resumeText: string;
  };
  previous?: string[];
}

const SYSTEM = `Você escreve publicações de LinkedIn em português do Brasil para uma profissional, na voz dela (primeira pessoa).

Estilo:
- Concreto, específico, humano. Nada de frases motivacionais vazias, clichês corporativos, exageros, emojis em excesso ou "Eu fiquei sem palavras".
- Parágrafos curtos. O gancho (primeiras 1–2 linhas) deve despertar curiosidade com algo concreto.
- Mostre raciocínio e método: como ela pensa, decide e mede.

Fidelidade (inegociável):
- Use apenas fatos que estão no perfil e no currículo fornecidos. Não invente números, empresas, clientes, resultados, prêmios ou histórias.
- Se um número ou detalhe tornaria o texto melhor mas não está no perfil, escreva sem ele, de forma qualitativa. Não use [colchetes].
- Afirmações sobre o mercado só com a fonte fornecida em "tendência"; caso contrário, apresente como observação ou opinião dela.
- Liste em "factsUsed" cada fato do perfil que você usou, para ela conferir.`;

export async function POST(req: Request) {
  try {
    checkAccess(req);
    const { idea, profile, previous } = (await req.json()) as PostInput;
    if (!idea?.theme) return Response.json({ error: "Pauta inválida." }, { status: 400 });
    const exps = profile.experiences.map((e) => `- ${e.role} — ${e.org}: ${e.description} ${e.achievements.filter((a) => !a.startsWith("[")).join("; ")}`).join("\n");
    const skills = profile.skills.filter((s) => s.level >= 3).map((s) => `${s.name}${s.evidence ? ` (${s.evidence})` : ""}`).join("; ");
    const content = `Perfil:
Nome: ${profile.name || "(não informado)"}
Título: ${profile.headline}
Sobre: ${profile.about}
Cargos-alvo: ${profile.targetRoles.join(", ")}
Áreas de interesse (prioridade): ${profile.interests.join(" > ")}
Formação: ${profile.education.join("; ")}
Experiências:
${exps}
Competências com evidência: ${skills}
${profile.resumeText ? `Currículo completo:\n"""\n${profile.resumeText.slice(0, 15000)}\n"""` : ""}

Pauta:
Título: ${idea.title}
Tema: ${idea.theme}
Objetivo: ${idea.objective}
Abordagem: ${idea.approach}
Formato: ${idea.format}${idea.format === "carrossel" ? " (escreva o texto do post e, em visualGuide, o roteiro slide a slide)" : ""}
${idea.trend ? `Tendência (${idea.trend.kind}): ${idea.trend.what}. Por que importa: ${idea.trend.why}. Fonte: ${idea.trend.source} ${idea.trend.url}` : ""}
${previous?.length ? `Evite repetir estes ganchos já usados: ${previous.slice(0, 10).join(" | ")}` : ""}

Responda APENAS com um bloco \`\`\`json:
{"title": "", "hook": "", "body": "", "conclusion": "", "cta": "", "hashtags": ["#..."], "keywords": [""], "audience": "", "rationale": "", "visualGuide": "", "factsUsed": [""]}`;
    const out = await complete(SYSTEM, content, "medium");
    const post = extractJSON<Record<string, unknown>>(out);
    const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
    const a = (v: unknown) => (Array.isArray(v) ? v.map(s).filter(Boolean) : []);
    return Response.json({
      post: {
        title: s(post.title) || idea.title, hook: s(post.hook), body: s(post.body), conclusion: s(post.conclusion), cta: s(post.cta),
        hashtags: a(post.hashtags).slice(0, 5), keywords: a(post.keywords), audience: s(post.audience), rationale: s(post.rationale),
        visualGuide: s(post.visualGuide), factsUsed: a(post.factsUsed),
        sources: idea.trend?.url ? [{ label: idea.trend.source, url: idea.trend.url }] : [],
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
