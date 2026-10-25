import type { Profile } from "../types";
import { norm, termMatch } from "../utils";

export type Confidence = "alta" | "media" | "baixa" | "insuficiente";

export interface Dimension {
  key: string;
  label: string;
  weight: number;
  /** null = critério indisponível (não entra no cálculo). */
  score: number | null;
  reasons: string[];
  gaps: string[];
}

export interface WeightedResult {
  total: number | null;
  dimensions: Dimension[];
  coverage: number;
  confidence: Confidence;
  partial: boolean;
}

/** Combina dimensões e redistribui pesos entre os critérios disponíveis. */
export function combine(dimensions: Dimension[]): WeightedResult {
  const totalWeight = dimensions.reduce((a, d) => a + d.weight, 0) || 1;
  const avail = dimensions.filter((d) => d.score !== null);
  const availWeight = avail.reduce((a, d) => a + d.weight, 0);
  const coverage = availWeight / totalWeight;
  const total = availWeight > 0 ? avail.reduce((a, d) => a + (d.score as number) * d.weight, 0) / availWeight : null;
  return {
    total: total === null ? null : Math.round(total),
    dimensions,
    coverage,
    confidence: confidenceFrom(coverage),
    partial: coverage < 0.999,
  };
}

export function confidenceFrom(coverage: number): Confidence {
  if (coverage >= 0.85) return "alta";
  if (coverage >= 0.6) return "media";
  if (coverage >= 0.3) return "baixa";
  return "insuficiente";
}

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  alta: "Confiança alta", media: "Confiança média", baixa: "Confiança baixa", insuficiente: "Evidência insuficiente",
};

/** Nível (0–5) da competência no perfil, por correspondência aproximada. */
export function skillLevel(profile: Profile, name: string): number {
  let best = 0;
  for (const s of profile.skills) {
    if (norm(s.name) === norm(name)) return s.level;
    if (termMatch(s.name, name)) best = Math.max(best, s.level);
  }
  return best;
}

export function findSkill(profile: Profile, name: string) {
  return profile.skills.find((s) => norm(s.name) === norm(name)) ?? profile.skills.find((s) => termMatch(s.name, name));
}

/** Prioridade (1 = maior) da área de interesse que corresponde ao termo, ou null. */
export function interestRank(profile: Profile, terms: string[]): number | null {
  for (let i = 0; i < profile.interests.length; i++) {
    const it = profile.interests[i];
    const words = [it.area, ...it.keywords];
    if (terms.some((t) => words.some((w) => termMatch(w, t)))) return i + 1;
  }
  return null;
}

export function experienceText(profile: Profile) {
  return [
    profile.headline,
    profile.about,
    ...profile.experiences.flatMap((e) => [e.role, e.description, ...e.achievements]),
    ...profile.skills.filter((s) => s.evidence && s.level >= 3).map((s) => `${s.name} ${s.evidence}`),
  ].join(" \n ");
}
