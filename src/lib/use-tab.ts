"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/** Aba sincronizada com ?tab= na URL (permite links diretos a partir das recomendações). */
export function useTab<T extends string>(fallback: T, allowed: readonly T[]): [T, (t: T) => void] {
  const sp = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const raw = sp.get("tab") as T | null;
  const tab = raw && allowed.includes(raw) ? raw : fallback;
  const set = useCallback((t: T) => {
    const q = new URLSearchParams(sp.toString());
    q.set("tab", t);
    router.replace(`${path}?${q.toString()}`, { scroll: false });
  }, [sp, router, path]);
  return [tab, set];
}
