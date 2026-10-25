import type { Contact, Job, Profile, RoleProfile } from "../types";
import { skillLevel } from "./common";
import { norm, termMatch } from "../utils";

export interface MatrixRow {
  skill: string;
  current: number;
  required: number;
  gap: number;
  priority: "alta" | "media" | "baixa" | "ok";
  evidence: string;
  /** Em quantas vagas acompanhadas a competência aparece. */
  demand: number;
}

export function roleMatrix(role: RoleProfile, profile: Profile, jobs: Job[]): MatrixRow[] {
  return role.requirements.map((r) => {
    const current = skillLevel(profile, r.skill);
    const gap = Math.max(0, r.required - current);
    const demand = jobs.filter((j) => j.skills.some((s) => termMatch(s, r.skill))).length;
    const desire = profile.skillsToDevelop.some((s) => termMatch(s, r.skill));
    const priority: MatrixRow["priority"] = gap === 0 ? "ok" : gap >= 2 || (gap === 1 && (demand >= 3 || desire)) ? "alta" : gap === 1 && demand >= 1 ? "media" : "baixa";
    const ev = profile.skills.find((s) => termMatch(s.name, r.skill))?.evidence ?? "";
    return { skill: r.skill, current, required: r.required, gap, priority, evidence: ev, demand };
  });
}

export function roleReadiness(rows: MatrixRow[]) {
  const req = rows.reduce((a, r) => a + r.required, 0) || 1;
  const met = rows.reduce((a, r) => a + Math.min(r.current, r.required), 0);
  return Math.round((met / req) * 100);
}

/** Lacunas agregadas a partir das vagas acompanhadas (demanda real do mercado registrado). */
export function marketGaps(profile: Profile, jobs: Job[]) {
  const map = new Map<string, { skill: string; count: number; level: number }>();
  for (const j of jobs.filter((x) => x.status !== "descartada")) {
    for (const s of j.skills) {
      const k = norm(s);
      const cur = map.get(k) ?? { skill: s, count: 0, level: skillLevel(profile, s) };
      cur.count++;
      map.set(k, cur);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count || a.level - b.level);
}

/**
 * Relevância para minha estratégia (0–100) de um contato, com justificativa.
 * Usa apenas cargo, empresa, área e categoria — nunca características pessoais.
 */
export function contactRelevance(c: Contact, profile: Profile, targetCompanies: string[]) {
  const reasons: string[] = [];
  let score = 0;
  const catW: Record<Contact["category"], number> = { gestor: 30, recrutador: 28, funcao_alvo: 26, lideranca: 22, especialista: 20, criador: 14, complementar: 10 };
  score += catW[c.category];
  reasons.push(`Categoria: ${c.category.replace("_", " ")} (+${catW[c.category]})`);
  if (targetCompanies.some((t) => t && norm(c.company).includes(norm(t)))) { score += 25; reasons.push("Trabalha em empresa-alvo (+25)"); }
  const role = profile.targetRoles.find((r) => termMatch(r, c.role));
  if (role) { score += 20; reasons.push(`Cargo relacionado a "${role}" (+20)`); }
  const idx = profile.interests.findIndex((i) => [i.area, ...i.keywords].some((k) => termMatch(k, c.area) || termMatch(k, c.role)));
  if (idx >= 0) { const pts = Math.max(5, 20 - idx * 3); score += pts; reasons.push(`Área ligada à prioridade nº ${idx + 1} (+${pts})`); }
  return { score: Math.min(100, score), reasons };
}
