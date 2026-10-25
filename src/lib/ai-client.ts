"use client";

import { useEffect, useState } from "react";
import type { IntegrationStatus } from "./integrations/registry";
import type { Company, Profile } from "./types";
import { nowISO, uid } from "./utils";

const KEY = "nexo:access-code";

export function getAccessCode() {
  try { return window.localStorage.getItem(KEY) ?? ""; } catch { return ""; }
}
export function setAccessCode(code: string) {
  try { window.localStorage.setItem(KEY, code.trim()); } catch { /* armazenamento indisponível */ }
}

export async function aiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json", "x-nexo-access": getAccessCode() }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({ error: `Erro ${res.status}` }));
  if (!res.ok) throw new Error(json.error ?? `Erro ${res.status}`);
  return json as T;
}

let cache: Promise<Record<string, IntegrationStatus>> | null = null;
export function integrationStatus() {
  if (!cache) cache = fetch("/api/integrations/status").then((r) => r.json()).then((j) => j.status).catch(() => ({}));
  return cache;
}

/** "ready" = servidor configurado e código salvo neste aparelho. */
export function useAI() {
  const [state, setState] = useState<"loading" | "off" | "needs_code" | "ready">("loading");
  useEffect(() => {
    integrationStatus().then((s) => setState(s.ai !== "ativa" ? "off" : getAccessCode() ? "ready" : "needs_code"));
  }, []);
  return state;
}

export function profileSummary(p: Profile) {
  return {
    headline: p.headline,
    targetRoles: p.targetRoles,
    interests: p.interests.map((i) => i.area),
    skills: p.skills.filter((s) => s.level >= 2).map((s) => s.name),
    values: p.values,
    cities: p.cities,
  };
}

export interface DossierMeta { searches: number; sourcesSeen: number; unverifiedLinksRemoved: number; researchedAt: string }

/** Pesquisa a empresa na web e devolve um Company pronto para salvar (origin "api"). */
export async function generateDossier(name: string, website: string, profile: Profile, keepId?: string): Promise<{ company: Company; meta: DossierMeta }> {
  const { dossier, meta } = await aiPost<{ dossier: Omit<Company, "id" | "origin" | "createdAt" | "updatedAt" | "lastResearchAt">; meta: DossierMeta }>("/api/dossier", { name, website, profile: profileSummary(profile) });
  const t = nowISO();
  return { company: { ...dossier, id: keepId ?? uid("co"), origin: "api", createdAt: t, updatedAt: t, lastResearchAt: meta.researchedAt.slice(0, 10) }, meta };
}

export interface StructuredResume {
  name: string; headline: string; about: string; location: string; yearsExperience: number;
  experiences: { role: string; org: string; start: string; end: string; description: string; achievements: string[] }[];
  education: { course: string; institution: string; level: string; year: string }[];
  skills: { name: string; level: number; evidence: string }[];
  certifications: { name: string; issuer: string; year: string }[];
}

export async function extractFile(file: File): Promise<{ text: string; scanned: boolean }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/extract", { method: "POST", body: fd });
  const json = await res.json().catch(() => ({ error: `Erro ${res.status}` }));
  if (!res.ok) throw new Error(json.error);
  return json;
}

export async function fileToBase64(file: File) {
  const buf = new Uint8Array(await file.arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(bin);
}
