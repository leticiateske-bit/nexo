import type { Company } from "./types";
import { nowISO, uid } from "./utils";

export function blankCompany(name = ""): Company {
  const t = nowISO();
  return {
    id: uid("co"), origin: "user", createdAt: t, updatedAt: t, name, sector: "", website: "", hq: "", history: "", businessModel: "", products: "", mission: "", vision: "",
    declaredValues: [], culture: "", priorities: "", positioning: "", geography: "", areas: [], likelyRoles: [], evidence: [], trends: [], peopleContent: [], pains: [],
    valueCreation: { problems: "", skills: "", areas: "", content: "", people: "", develop: "", profile: "", nextStep: "" },
    missingInfo: ["Missão, visão e valores (fonte oficial)", "Tendências e movimentos recentes", "Dores públicas", "Conteúdos de profissionais"], lastResearchAt: null,
  };
}

