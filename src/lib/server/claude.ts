import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Integração com a API do Claude — usada APENAS no servidor (rotas /api).
 * A chave fica em ANTHROPIC_API_KEY e nunca chega ao navegador.
 *
 * Proteção de custo: como o site é público, toda rota que chama a API exige
 * o código de acesso definido em NEXO_ACCESS_CODE (enviado no cabeçalho x-nexo-access).
 */

export const MODEL = "claude-opus-5-5";

export function aiConfigured() {
  return !!process.env.ANTHROPIC_API_KEY && !!process.env.NEXO_ACCESS_CODE;
}

export class AccessError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export function checkAccess(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) throw new AccessError("ANTHROPIC_API_KEY não configurada no servidor.", 501);
  const code = process.env.NEXO_ACCESS_CODE;
  if (!code) throw new AccessError("NEXO_ACCESS_CODE não configurado no servidor — necessário para proteger seus créditos de API.", 501);
  if (req.headers.get("x-nexo-access") !== code) throw new AccessError("Código de acesso inválido. Configure em Perfil → Integrações.", 401);
}

let client: Anthropic | null = null;
function getClient() {
  if (!client) client = new Anthropic();
  return client;
}

export interface ResearchResult {
  text: string;
  /** URLs que a pesquisa realmente retornou ou abriu — usados para validar as fontes citadas. */
  seenUrls: Set<string>;
  searches: number;
}

/**
 * Executa uma tarefa com pesquisa e leitura de páginas na web (ferramentas de servidor),
 * retomando turnos pausados. Retorna o texto final e as URLs consultadas.
 */
export async function researchWithWeb(system: string, prompt: string, opts: { maxSearches?: number; maxFetches?: number } = {}): Promise<ResearchResult> {
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: prompt }];
  const seenUrls = new Set<string>();
  let searches = 0;
  let text = "";

  for (let turn = 0; turn < 5; turn++) {
    const response = await getClient().beta.messages
      .stream({
        model: MODEL,
        max_tokens: 32000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "medium" },
        system,
        tools: [
          { type: "web_search_20260209", name: "web_search", max_uses: opts.maxSearches ?? 8, user_location: { type: "approximate", country: "BR" } },
          { type: "web_fetch_20260209", name: "web_fetch", max_uses: opts.maxFetches ?? 6 },
        ],
        messages,
      })
      .finalMessage();

    if (response.stop_reason === "refusal") throw new Error("A pesquisa foi recusada pelo modelo para este pedido.");

    for (const block of response.content) {
      if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
        searches++;
        for (const r of block.content) seenUrls.add(normUrl(r.url));
      } else if (block.type === "web_fetch_tool_result" && block.content.type === "web_fetch_result") {
        seenUrls.add(normUrl(block.content.url));
      } else if (block.type === "text") {
        text += block.text;
      }
    }

    if (response.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: response.content });
      text = "";
      continue;
    }
    if (response.stop_reason === "max_tokens") throw new Error("A resposta ficou longa demais e foi cortada. Tente novamente.");
    break;
  }
  return { text, seenUrls, searches };
}

/** Chamada simples (sem web) que devolve texto — ex.: estruturar um currículo. */
export async function complete(system: string, content: Anthropic.Beta.BetaContentBlockParam[] | string): Promise<string> {
  const response = await getClient().beta.messages
    .stream({
      model: MODEL,
      max_tokens: 32000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium" },
      system,
      messages: [{ role: "user", content }],
    })
    .finalMessage();
  if (response.stop_reason === "refusal") throw new Error("O pedido foi recusado pelo modelo.");
  return response.content.map((b) => (b.type === "text" ? b.text : "")).join("");
}

export function hostOf(u: string) {
  try { return new URL(u).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; }
}

export function normUrl(u: string) {
  try {
    const x = new URL(u);
    return (x.hostname.replace(/^www\./, "") + x.pathname.replace(/\/$/, "")).toLowerCase();
  } catch {
    return u.toLowerCase();
  }
}

/** Extrai o primeiro objeto JSON de um texto (o modelo responde com um bloco ```json). */
export function extractJSON<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  return JSON.parse(raw) as T;
}

export function errorResponse(e: unknown) {
  if (e instanceof AccessError) return Response.json({ error: e.message }, { status: e.status });
  if (e instanceof Anthropic.AuthenticationError) return Response.json({ error: "Chave da API do Claude inválida." }, { status: 502 });
  if (e instanceof Anthropic.RateLimitError) return Response.json({ error: "Limite de uso da API atingido. Tente em alguns minutos." }, { status: 429 });
  if (e instanceof Anthropic.APIError) return Response.json({ error: `Erro da API do Claude (${e.status}): ${e.message}` }, { status: 502 });
  if (e instanceof SyntaxError) return Response.json({ error: "Não foi possível interpretar a resposta da IA. Tente novamente." }, { status: 502 });
  return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
}
