/**
 * Índice de compatibilidade da vaga (0–100).
 * Mede aderência entre a vaga e o perfil; NÃO é probabilidade de contratação.
 * Critérios sem informação na vaga são excluídos e os pesos redistribuídos.
 */
import type { Job, JobWeights, Profile, Seniority } from "../types";
import { combine, interestRank, skillLevel, type Dimension, type WeightedResult } from "./common";
import { termMatch } from "../utils";

const SENIORITY_YEARS: Record<Seniority, number> = { Júnior: 0, Pleno: 3, Sênior: 6, Especialista: 7, Coordenação: 7 };

export interface JobFit extends WeightedResult {
  matched: string[];
  partialSkills: string[];
  missing: string[];
}

export function jobFit(job: Job, profile: Profile, w: JobWeights): JobFit {
  const matched: string[] = [], partialSkills: string[] = [], missing: string[] = [];

  // 1. Competências
  const skills: Dimension = { key: "skills", label: "Competências", weight: w.skills, score: null, reasons: [], gaps: [] };
  if (job.skills.length) {
    let acc = 0;
    for (const s of job.skills) {
      const lv = skillLevel(profile, s);
      acc += Math.min(lv / 3, 1);
      if (lv >= 3) matched.push(s);
      else if (lv >= 1) partialSkills.push(s);
      else missing.push(s);
    }
    skills.score = Math.round((acc / job.skills.length) * 100);
    if (matched.length) skills.reasons.push(`${matched.length} de ${job.skills.length} competências em nível intermediário ou superior: ${matched.join(", ")}.`);
    if (partialSkills.length) skills.gaps.push(`Nível inicial/básico: ${partialSkills.join(", ")}.`);
    if (missing.length) skills.gaps.push(`Não registradas no perfil: ${missing.join(", ")}.`);
  }

  // 2. Experiência e senioridade
  const exp: Dimension = { key: "experience", label: "Experiência e senioridade", weight: w.experience, score: null, reasons: [], gaps: [] };
  if (job.seniority) {
    const need = SENIORITY_YEARS[job.seniority];
    const have = profile.yearsExperience;
    const gap = Math.max(0, need - have);
    exp.score = Math.max(0, 100 - gap * 25);
    if (gap === 0) exp.reasons.push(`${have} anos de experiência atendem à senioridade ${job.seniority} (referência NEXO: ${need}+ anos).`);
    else exp.gaps.push(`Senioridade ${job.seniority} costuma pedir ${need}+ anos; perfil registra ${have}.`);
    if (profile.targetSeniority.includes(job.seniority)) exp.reasons.push("Senioridade está entre as desejadas.");
  }

  // 3. Formação e requisitos técnicos
  const edu: Dimension = { key: "education", label: "Formação e requisitos técnicos", weight: w.education, score: null, reasons: [], gaps: [] };
  const parts: number[] = [];
  if (job.education) {
    const ok = profile.education.some((e) => termMatch(e.course, job.education));
    parts.push(ok ? 100 : 40);
    (ok ? edu.reasons : edu.gaps).push(ok ? `Formação em ${job.education} atendida.` : `Formação pedida (${job.education}) não consta no perfil.`);
  }
  if (job.requirements.length) {
    const met = job.requirements.filter((r) => profile.skills.some((s) => s.level >= 3 && termMatch(s.name, r)) || profile.education.some((e) => termMatch(e.course, r)));
    parts.push((met.length / job.requirements.length) * 100);
    if (met.length) edu.reasons.push(`Requisitos atendidos: ${met.join("; ")}.`);
    const unmet = job.requirements.filter((r) => !met.includes(r));
    if (unmet.length) edu.gaps.push(`Requisitos não comprovados no perfil: ${unmet.join("; ")}.`);
  }
  if (parts.length) edu.score = Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);

  // 4. Alinhamento com objetivos
  const goals: Dimension = { key: "goals", label: "Alinhamento com objetivos", weight: w.goals, score: null, reasons: [], gaps: [] };
  const roleHit = profile.targetRoles.find((r) => termMatch(r, job.title));
  const rank = interestRank(profile, [job.area, job.title]);
  if (roleHit) { goals.score = 100; goals.reasons.push(`Corresponde ao cargo-alvo "${roleHit}".`); }
  else if (rank) { goals.score = Math.max(30, 100 - (rank - 1) * 14); goals.reasons.push(`Área ligada à sua prioridade nº ${rank} (${profile.interests[rank - 1].area}).`); }
  else { goals.score = 20; goals.gaps.push("Cargo e área fora dos objetivos configurados."); }

  // 5. Localização, remuneração e modalidade
  const log: Dimension = { key: "logistics", label: "Localização, remuneração e modalidade", weight: w.logistics, score: null, reasons: [], gaps: [] };
  const lp: number[] = [];
  const modeOk = profile.workModes.includes(job.mode);
  lp.push(modeOk ? 100 : 0);
  (modeOk ? log.reasons : log.gaps).push(modeOk ? `Modalidade ${job.mode} aceita.` : `Modalidade ${job.mode} não está nas preferências.`);
  if (job.mode !== "remoto") {
    const cityOk = profile.cities.some((c) => termMatch(c, job.city));
    lp.push(cityOk ? 100 : 10);
    (cityOk ? log.reasons : log.gaps).push(cityOk ? `${job.city} é cidade preferida.` : `${job.city} fora das cidades preferidas.`);
  }
  if (job.salaryMax && profile.salaryMin) {
    const ok = job.salaryMax >= profile.salaryMin;
    lp.push(ok ? 100 : 20);
    (ok ? log.reasons : log.gaps).push(ok ? "Faixa divulgada alcança sua pretensão." : "Faixa divulgada abaixo da pretensão mínima.");
  } else log.gaps.push(job.salaryMax ? "Defina sua pretensão salarial no perfil para comparar." : "Salário não divulgado — não considerado.");
  log.score = Math.round(lp.reduce((a, b) => a + b, 0) / lp.length);

  const result = combine([skills, exp, edu, goals, log]);
  // Anúncios com poucos requisitos inflam a pontuação: sinaliza e reduz a confiança.
  const reqCount = job.skills.length + job.requirements.length;
  if (reqCount < 4) {
    skills.gaps.push(`Anúncio com poucos requisitos registrados (${reqCount}) — compatibilidade pouco confiável.`);
    if (result.confidence === "alta") result.confidence = "media";
  }
  return { ...result, matched, partialSkills, missing };
}
