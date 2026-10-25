/**
 * Mensagens de conexão. Usa apenas dados registrados do contato (cargo, empresa, tema).
 * Nunca afirma contato anterior, elogio específico ou interesse que não esteja registrado.
 * Convites do LinkedIn com nota têm limite de caracteres (verifique o limite atual da sua conta).
 */
import type { Contact, Profile } from "../types";

export type MessageSituation =
  | "recrutador" | "gestor" | "empresa_sonho" | "orientacao" | "agradecer" | "apos_publicacao" | "retomar" | "conversa_breve";

export const SITUATIONS: Record<MessageSituation, string> = {
  recrutador: "Conectar-me com um recrutador",
  gestor: "Aproximar-me de um gestor",
  empresa_sonho: "Alguém da empresa dos meus sonhos",
  orientacao: "Pedir orientação sobre uma área",
  agradecer: "Agradecer uma interação",
  apos_publicacao: "Após ler uma publicação",
  retomar: "Retomar contato",
  conversa_breve: "Solicitar conversa breve",
};

export function suggestSituation(c: Contact): MessageSituation {
  if (c.status === "sem_resposta") return "retomar";
  if (c.status === "em_conversa") return "conversa_breve";
  if (c.category === "recrutador") return "recrutador";
  if (c.category === "gestor") return "gestor";
  if (c.category === "lideranca") return "empresa_sonho";
  if (c.category === "criador") return "apos_publicacao";
  return "orientacao";
}

export function generateMessage(s: MessageSituation, c: Contact, p: Profile): string {
  const first = c.name.split(" ")[0] || "[nome]";
  const me = p.name ? p.name.split(" ")[0] : "[seu nome]";
  const area = p.interests[0]?.area.toLowerCase() ?? "operações";
  const bg = "arquiteta (UFPR) com experiência em qualidade, infraestrutura e operações";
  const topic = c.topic || `[assunto específico ligado a ${c.area || area}]`;
  const company = c.company.replace(/\s*\(demo\)/i, "") || "[empresa]";
  const target = p.targetRoles[0]?.toLowerCase() ?? "minha área-alvo";

  switch (s) {
    case "recrutador":
      return `Olá, ${first}! Sou ${me}, ${bg}. Vi que você recruta para ${c.area.toLowerCase() || area} e estou direcionando minha carreira para ${target}. Gostaria de me conectar para acompanhar as oportunidades da ${company}.`;
    case "gestor":
      return `Olá, ${first}! Sou ${bg} e estou me aprofundando em ${area}. Como você lidera ${c.area.toLowerCase() || "essa área"} na ${company}, sua visão sobre ${topic} me ajudaria muito. Posso me conectar?`;
    case "empresa_sonho":
      return `Olá, ${first}! Acompanho a ${company} pelo trabalho em ${c.area.toLowerCase() || "[área]"} e tenho interesse em entender melhor os desafios do time. Sou ${bg}. Seria ótimo me conectar.`;
    case "orientacao":
      return `Olá, ${first}! Sou ${bg} e estou explorando ${c.area.toLowerCase() || area}. Sua trajetória como ${c.role.toLowerCase()} é próxima do caminho que estou construindo. Posso me conectar e, se fizer sentido, te fazer uma pergunta sobre ${topic}?`;
    case "agradecer":
      return `Oi, ${first}! Obrigada pela [interação: resposta/comentário/indicação]. Foi útil para [efeito concreto]. Fico à disposição se eu puder retribuir de alguma forma.`;
    case "apos_publicacao":
      return `Olá, ${first}! Li sua publicação sobre [tema do post] e o ponto sobre [ideia específica] conversa com o que vejo em ${area}. Gostaria de me conectar para acompanhar seus próximos conteúdos.`;
    case "retomar":
      return `Oi, ${first}! Tudo bem? Estou retomando alguns contatos da área de ${c.area.toLowerCase() || area}. Recentemente [novidade real: curso, projeto, publicação]. Se fizer sentido, adoraria trocar uma ideia sobre ${topic}.`;
    case "conversa_breve":
      return `Oi, ${first}! Estou direcionando minha carreira para ${target} e sua experiência na ${company} seria muito valiosa. Você teria 15 minutos nas próximas semanas para uma conversa rápida sobre ${topic}? Me adapto à sua agenda.`;
  }
}
