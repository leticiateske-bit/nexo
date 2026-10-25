/**
 * NEXO Brand Fit (0–100): estimativa analítica de compatibilidade entre o perfil e a empresa.
 * Não é avaliação oficial da empresa nem previsão de contratação.
 * Dimensões sem dados ficam fora do cálculo; a análise é marcada como parcial.
 */
import type { BrandWeights, Company, Job, JobWeights, Profile } from "../types";
import { combine, experienceText, interestRank, skillLevel, type Dimension, type WeightedResult } from "./common";
import { jobFit } from "./job-fit";
import { norm, termMatch } from "../utils";

export function brandFit(company: Company, profile: Profile, w: BrandWeights, jobs: Job[], jw: JobWeights): WeightedResult {
  const skills: Dimension = { key: "skills", label: "Competências × áreas de atuação", weight: w.skills, score: null, reasons: [], gaps: [] };
  if (company.areas.length) {
    let acc = 0;
    const strong: string[] = [], weak: string[] = [];
    for (const a of company.areas) {
      const lv = skillLevel(profile, a);
      acc += Math.min(lv / 3, 1);
      (lv >= 3 ? strong : weak).push(a);
    }
    skills.score = Math.round((acc / company.areas.length) * 100);
    if (strong.length) skills.reasons.push(`Competências fortes nas áreas da empresa: ${strong.join(", ")}.`);
    if (weak.length) skills.gaps.push(`Abaixo do intermediário: ${weak.join(", ")}.`);
  } else skills.gaps.push("Cadastre as áreas de atuação da empresa.");

  const exp: Dimension = { key: "experience", label: "Experiência × trajetórias", weight: w.experience, score: null, reasons: [], gaps: [] };
  const terms = [...company.areas, ...company.likelyRoles];
  if (terms.length) {
    const text = norm(experienceText(profile));
    const hits = company.areas.filter((a) => text.includes(norm(a)) || norm(a).split(/\s+/).filter((t) => t.length > 4).some((t) => text.includes(t)));
    const base = company.areas.length || 1;
    exp.score = Math.round((hits.length / base) * 100);
    if (hits.length) exp.reasons.push(`Experiência descrita no perfil cita: ${hits.join(", ")}.`);
    const miss = company.areas.filter((a) => !hits.includes(a));
    if (miss.length) exp.gaps.push(`Sem evidência de experiência descrita em: ${miss.join(", ")}.`);
  }

  const values: Dimension = { key: "values", label: "Valores e cultura declarados", weight: w.values, score: null, reasons: [], gaps: [] };
  if (company.declaredValues.length && profile.values.length) {
    const hits = profile.values.filter((v) => company.declaredValues.some((d) => termMatch(d, v)));
    values.score = Math.round(Math.min(1, hits.length / Math.min(3, profile.values.length)) * 100);
    if (hits.length) values.reasons.push(`Valores em comum (discurso institucional): ${hits.join(", ")}.`);
    values.gaps.push("Baseado em valores declarados; confirme com fontes independentes e conversas.");
  } else values.gaps.push(company.declaredValues.length ? "Defina seus valores no perfil." : "Valores da empresa não cadastrados.");

  const interests: Dimension = { key: "interests", label: "Interesses e objetivos", weight: w.interests, score: null, reasons: [], gaps: [] };
  if (company.sector || company.areas.length) {
    const rank = interestRank(profile, [company.sector, ...company.areas]);
    interests.score = rank ? Math.max(30, 100 - (rank - 1) * 14) : 15;
    if (rank) interests.reasons.push(`Conecta-se à sua prioridade nº ${rank}: ${profile.interests[rank - 1].area}.`);
    else interests.gaps.push("Setor e áreas não correspondem às suas áreas de interesse.");
  }

  const roles: Dimension = { key: "roles", label: "Cargos disponíveis", weight: w.roles, score: null, reasons: [], gaps: [] };
  const companyJobs = jobs.filter((j) => norm(j.company) === norm(company.name));
  if (companyJobs.length) {
    const fits = companyJobs.map((j) => ({ j, f: jobFit(j, profile, jw).total ?? 0 })).sort((a, b) => b.f - a.f);
    roles.score = fits[0].f;
    roles.reasons.push(`Melhor vaga acompanhada: ${fits[0].j.title} (${fits[0].f}/100).`);
  } else if (company.likelyRoles.length) {
    const hit = company.likelyRoles.filter((r) => profile.targetRoles.some((t) => termMatch(t, r)));
    roles.score = hit.length ? 75 : 35;
    (hit.length ? roles.reasons : roles.gaps).push(hit.length ? `Cargos prováveis alinhados aos seus alvos: ${hit.join(", ")} (sem vaga ativa registrada).` : "Cargos prováveis não coincidem com seus cargos-alvo.");
  } else roles.gaps.push("Nenhuma vaga ou cargo provável registrado.");

  const result = combine([skills, exp, values, interests, roles]);
  // Poucas áreas cadastradas tornam as dimensões de competência e experiência frágeis.
  if (company.areas.length > 0 && company.areas.length < 3) {
    skills.gaps.push("Apenas " + company.areas.length + " área(s) cadastrada(s) — resultado frágil; cadastre ao menos 3.");
    if (result.confidence === "alta" || result.confidence === "media") result.confidence = "baixa";
  }
  return result;
}
