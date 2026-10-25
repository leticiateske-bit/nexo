import type { DataRepository } from "./repository";
import { LocalRepository } from "./local-repository";

/**
 * Fábrica do repositório ativo. Hoje: sempre local.
 * Quando o Supabase estiver configurado e implementado, troque aqui.
 */
export function getRepository(): DataRepository {
  return new LocalRepository();
}
