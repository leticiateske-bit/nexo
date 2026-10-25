import type { AppData } from "../types";
import type { DataRepository } from "./repository";

const KEY = "nexo:data:v1";

/** Persistência no navegador (localStorage). Os dados ficam apenas neste dispositivo. */
export class LocalRepository implements DataRepository {
  readonly kind = "local" as const;
  readonly label = "Armazenamento local do navegador";

  async load(): Promise<AppData | null> {
    try {
      const raw = window.localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as AppData) : null;
    } catch {
      return null;
    }
  }

  async save(data: AppData): Promise<void> {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  }

  async clear(): Promise<void> {
    window.localStorage.removeItem(KEY);
  }
}
