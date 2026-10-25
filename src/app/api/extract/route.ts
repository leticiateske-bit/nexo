import { extractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 4 * 1024 * 1024;

/** Extrai texto de PDF, DOCX ou TXT. Não usa IA nem guarda o arquivo. */
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return Response.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    if (file.size > MAX_BYTES) return Response.json({ error: "Arquivo maior que 4 MB." }, { status: 413 });
    const buf = Buffer.from(await file.arrayBuffer());
    const name = file.name.toLowerCase();
    let text = "";
    let pages: number | null = null;
    if (name.endsWith(".pdf") || file.type === "application/pdf") {
      const pdf = await getDocumentProxy(new Uint8Array(buf));
      const r = await extractText(pdf, { mergePages: true });
      text = Array.isArray(r.text) ? r.text.join("\n") : r.text;
      pages = r.totalPages;
    } else if (name.endsWith(".docx")) {
      text = (await mammoth.extractRawText({ buffer: buf })).value;
    } else if (name.endsWith(".txt") || name.endsWith(".csv") || file.type.startsWith("text/")) {
      text = buf.toString("utf8");
    } else {
      return Response.json({ error: "Formato não suportado. Use PDF, DOCX, TXT ou CSV (arquivos .doc antigos: salve como .docx)." }, { status: 415 });
    }
    text = text.replace(/\u0000/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    return Response.json({ text, pages, scanned: !text && pages !== null });
  } catch (e) {
    return Response.json({ error: "Não foi possível ler o arquivo: " + (e instanceof Error ? e.message : String(e)) }, { status: 422 });
  }
}
