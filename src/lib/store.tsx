"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AppData, CollectionKey, Profile, Settings } from "./types";
import { getRepository } from "./data";
import { buildInitialProfile, buildSeed, DATA_VERSION, DEFAULT_SETTINGS } from "./data/seed";
import { nowISO } from "./utils";
import { generateDossier } from "./ai-client";

type ItemOf<K extends CollectionKey> = AppData[K][number];

interface Toast { id: number; message: string; tone: "ok" | "info" | "warn" }

export interface ResearchJob { key: string; name: string; startedAt: number; companyId?: string; error?: string }

interface StoreValue {
  data: AppData;
  ready: boolean;
  error: string | null;
  savedAt: string | null;
  repoLabel: string;
  /** Coleção respeitando a preferência "mostrar dados demonstrativos". */
  view: <K extends CollectionKey>(k: K) => ItemOf<K>[];
  setProfile: (patch: Partial<Profile>) => void;
  setSettings: (patch: Partial<Settings>) => void;
  add: <K extends CollectionKey>(k: K, item: ItemOf<K>) => void;
  addMany: <K extends CollectionKey>(k: K, items: ItemOf<K>[]) => void;
  update: <K extends CollectionKey>(k: K, id: string, patch: Partial<ItemOf<K>>) => void;
  remove: <K extends CollectionKey>(k: K, id: string) => void;
  clearDemo: () => void;
  restoreDemo: () => void;
  resetAll: () => void;
  replaceAll: (d: AppData) => void;
  toast: (message: string, tone?: Toast["tone"]) => void;
  toasts: Toast[];
  /** Pesquisas de dossiê em andamento (continuam ao trocar de página). */
  research: ResearchJob[];
  runResearch: (name: string, website?: string, keepId?: string) => Promise<string | null>;
  dismissResearch: (key: string) => void;
}

const Ctx = createContext<StoreValue | null>(null);

function migrate(d: AppData): AppData {
  // Garante campos novos em dados antigos.
  const base = buildSeed();
  return {
    ...base,
    ...d,
    profile: { ...buildInitialProfile(), ...d.profile, goals: { ...base.profile.goals, ...d.profile?.goals } },
    settings: { ...DEFAULT_SETTINGS, ...d.settings },
    version: DATA_VERSION,
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const repo = useMemo(() => getRepository(), []);
  const [data, setData] = useState<AppData>(() => buildSeed());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [research, setResearch] = useState<ResearchJob[]>([]);
  const dataRef = useRef(data);
  dataRef.current = data;
  const first = useRef(true);

  useEffect(() => {
    repo.load().then((d) => {
      if (d) setData(migrate(d));
      setReady(true);
    }).catch((e) => { setError(String(e)); setReady(true); });
  }, [repo]);

  useEffect(() => {
    if (!ready) return;
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => {
      repo.save(data).then(() => setSavedAt(nowISO())).catch((e) => setError("Falha ao salvar: " + String(e)));
    }, 250);
    return () => clearTimeout(t);
  }, [data, ready, repo]);

  const toast = useCallback((message: string, tone: Toast["tone"] = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts, { id, message, tone }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 3200);
  }, []);

  const runResearch = useCallback(async (name: string, website = "", keepId?: string) => {
    const key = keepId ?? name.toLowerCase();
    setResearch((r) => [...r.filter((x) => x.key !== key), { key, name, startedAt: Date.now() }]);
    try {
      const { company, meta } = await generateDossier(name, website, dataRef.current.profile, keepId);
      setData((d) => ({ ...d, companies: keepId ? d.companies.map((c) => (c.id === keepId ? { ...company, createdAt: c.createdAt } : c)) : [company, ...d.companies] }));
      setResearch((r) => r.filter((x) => x.key !== key));
      toast(`Dossiê de ${company.name} pronto · ${meta.sourcesSeen} fontes consultadas`);
      return company.id;
    } catch (e) {
      setResearch((r) => r.map((x) => (x.key === key ? { ...x, error: e instanceof Error ? e.message : String(e) } : x)));
      toast("Não foi possível gerar o dossiê", "warn");
      return null;
    }
  }, [toast]);

  const value: StoreValue = {
    data, ready, error, savedAt, repoLabel: repo.label, toasts, toast,
    research, runResearch, dismissResearch: (key) => setResearch((r) => r.filter((x) => x.key !== key)),
    view: (k) => {
      const arr = data[k] as ItemOf<typeof k>[];
      return data.settings.showDemo ? arr : arr.filter((x) => x.origin !== "demo");
    },
    setProfile: (patch) => setData((d) => ({ ...d, profile: { ...d.profile, ...patch, updatedAt: nowISO() } })),
    setSettings: (patch) => setData((d) => ({ ...d, settings: { ...d.settings, ...patch } })),
    add: (k, item) => setData((d) => ({ ...d, [k]: [item, ...(d[k] as unknown[])] })),
    addMany: (k, items) => setData((d) => ({ ...d, [k]: [...items, ...(d[k] as unknown[])] })),
    update: (k, id, patch) =>
      setData((d) => ({
        ...d,
        [k]: (d[k] as { id: string }[]).map((x) => (x.id === id ? { ...x, ...patch, updatedAt: nowISO() } : x)),
      })),
    remove: (k, id) => setData((d) => ({ ...d, [k]: (d[k] as { id: string }[]).filter((x) => x.id !== id) })),
    clearDemo: () =>
      setData((d) => {
        const strip = <T extends { origin: string }>(xs: T[]) => xs.filter((x) => x.origin !== "demo");
        return { ...d, ssi: strip(d.ssi), metrics: strip(d.metrics), posts: strip(d.posts), references: strip(d.references), contacts: strip(d.contacts), jobs: strip(d.jobs), companies: strip(d.companies), plan: strip(d.plan), tasks: strip(d.tasks) };
      }),
    restoreDemo: () =>
      setData((d) => {
        const s = buildSeed();
        const merge = <T extends { id: string; origin: string }>(mine: T[], seed: T[]) => [...mine.filter((x) => x.origin !== "demo"), ...seed.filter((x) => x.origin === "demo")];
        return { ...d, ssi: merge(d.ssi, s.ssi), metrics: merge(d.metrics, s.metrics), posts: merge(d.posts, s.posts), references: merge(d.references, s.references), contacts: merge(d.contacts, s.contacts), jobs: merge(d.jobs, s.jobs), companies: merge(d.companies, s.companies), plan: merge(d.plan, s.plan), settings: { ...d.settings, showDemo: true } };
      }),
    resetAll: () => { repo.clear(); setData(buildSeed()); },
    replaceAll: (d) => setData(migrate(d)),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore fora do StoreProvider");
  return v;
}
