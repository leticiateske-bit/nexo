"use client";

import { useMemo } from "react";
import { useStore } from "./store";
import { jobFit } from "./scoring/job-fit";
import { brandFit } from "./scoring/brand-fit";
import { careerScore, nexoScore } from "./scoring/nexo-score";
import { recommendations } from "./engine/recommendations";
import { addDays, todayISO } from "./utils";

/** Cálculos derivados compartilhados entre módulos (memoizados). */
export function useDerived() {
  const { data } = useStore();
  return useMemo(() => {
    const showDemo = data.settings.showDemo;
    const keep = <T extends { origin: string }>(xs: T[]) => (showDemo ? xs : xs.filter((x) => x.origin !== "demo"));
    const jobs = keep(data.jobs);
    const companies = keep(data.companies);
    const jobFits = new Map(jobs.map((j) => [j.id, jobFit(j, data.profile, data.settings.jobWeights)]));
    const brandFits = new Map(companies.map((c) => [c.id, brandFit(c, data.profile, data.settings.brandWeights, jobs, data.settings.jobWeights)]));
    const score = nexoScore(data, todayISO(), { includeDemo: showDemo });
    const scoreHistory = Array.from({ length: 8 }, (_, i) => {
      const asOf = addDays(todayISO(), -(7 - i) * 14);
      return { date: asOf, score: nexoScore(data, asOf, { includeDemo: showDemo }).total };
    });
    const career = careerScore(data, { includeDemo: showDemo });
    const recs = recommendations(data);
    const ssi = keep(data.ssi).slice().sort((a, b) => a.date.localeCompare(b.date));
    const metrics = keep(data.metrics).slice().sort((a, b) => a.date.localeCompare(b.date));
    return { jobs, companies, jobFits, brandFits, score, scoreHistory, career, recs, ssi, metrics, keep };
  }, [data]);
}
