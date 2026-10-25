import { checkAccess, complete, errorResponse, extractJSON } from "@/lib/server/claude";

export const runtime = "nodejs";
export const maxDuration = 120;

const SYSTEM = `Você organiza currículos em dados estruturados, em português do Brasil.
Use apenas o que está escrito no currículo. Não invente cargos, datas, resultados, números ou competências.
Níveis de competência (0–5) são estimativas: 2 = citada sem evidência, 3 = usada em experiência descrita, 4 = resultado ou responsabilidade clara, 5 = referência comprovada. Na evidência, cite o trecho que justifica o nível.`;

const FORMAT = `Responda APENAS com um bloco \`\`\`json neste formato:
{
  "name": "", "headline": "título profissional curto baseado no currículo", "about": "resumo de 80–200 palavras em primeira pessoa, só com fatos do currículo",
  "location": "", "yearsExperience": 0,
  "experiences": [{"role": "", "org": "", "start": "AAAA-MM ou vazio", "end": "AAAA-MM, atual ou vazio", "description": "", "achievements": [""]}],
  "education": [{"course": "", "institution": "", "level": "", "year": ""}],
  "skills": [{"name": "", "level": 0, "evidence": ""}],
  "certifications": [{"name": "", "issuer": "", "year": ""}]
}`;

export async function POST(req: Request) {
  try {
    checkAccess(req);
    const body = (await req.json()) as { text?: string; pdfBase64?: string };
    const text = (body.text ?? "").slice(0, 60000);
    if (!text && !body.pdfBase64) return Response.json({ error: "Currículo vazio." }, { status: 400 });
    const content = body.pdfBase64
      ? [{ type: "document" as const, source: { type: "base64" as const, media_type: "application/pdf" as const, data: body.pdfBase64 } }, { type: "text" as const, text: FORMAT }]
      : `Currículo:\n"""\n${text}\n"""\n\n${FORMAT}`;
    const out = await complete(SYSTEM, content);
    return Response.json({ profile: extractJSON(out) });
  } catch (e) {
    return errorResponse(e);
  }
}
