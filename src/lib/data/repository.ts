import type { AppData } from "../types";

/**
 * Contrato da camada de persistência.
 * A interface é propositalmente simples (snapshot completo) para o MVP;
 * a implementação Supabase poderá gravar por coleção sem mudar os componentes,
 * porque eles só conversam com o store (src/lib/store.tsx).
 */
export interface DataRepository {
  readonly kind: "local" | "supabase";
  readonly label: string;
  load(): Promise<AppData | null>;
  save(data: AppData): Promise<void>;
  clear(): Promise<void>;
}
