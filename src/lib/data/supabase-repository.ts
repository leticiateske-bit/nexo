import type { AppData } from "../types";
import type { DataRepository } from "./repository";

/**
 * Implementação preparada para Supabase (Etapa 2) — NÃO CONECTADA.
 *
 * Para ativar:
 *  1. `npm i @supabase/supabase-js`
 *  2. Preencher NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local
 *  3. Executar supabase/schema.sql (tabelas por coleção + RLS por usuário)
 *  4. Implementar load/save abaixo e trocar a fábrica em ./index.ts
 */
export class SupabaseRepository implements DataRepository {
  readonly kind = "supabase" as const;
  readonly label = "Supabase (PostgreSQL)";

  async load(): Promise<AppData | null> {
    throw new Error("SupabaseRepository ainda não implementado. Veja supabase/schema.sql e .env.example.");
  }
  async save(_data: AppData): Promise<void> {
    throw new Error("SupabaseRepository ainda não implementado.");
  }
  async clear(): Promise<void> {
    throw new Error("SupabaseRepository ainda não implementado.");
  }
}
