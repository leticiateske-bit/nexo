"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  BarChart3, Building2, BookOpenCheck, Briefcase, Check, CircleUserRound, FlaskConical, GraduationCap,
  LayoutDashboard, Linkedin, Menu, PenLine, Users, X,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Logo } from "./nexo";
import { Button } from "./ui";

export const NAV = [
  { href: "/", label: "Visão geral", icon: LayoutDashboard, n: "01" },
  { href: "/linkedin", label: "Meu LinkedIn e SSI", icon: Linkedin, n: "02" },
  { href: "/conteudo", label: "Estúdio de conteúdo", icon: PenLine, n: "03" },
  { href: "/networking", label: "Networking", icon: Users, n: "04" },
  { href: "/carreira", label: "Carreira e competências", icon: GraduationCap, n: "05" },
  { href: "/vagas", label: "Vagas e oportunidades", icon: Briefcase, n: "06" },
  { href: "/marcas", label: "Inteligência de marcas", icon: Building2, n: "07" },
  { href: "/relatorios", label: "Relatórios e KPIs", icon: BarChart3, n: "08" },
  { href: "/perfil", label: "Perfil e configurações", icon: CircleUserRound, n: "09" },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map((it) => {
        const active = it.href === "/" ? path === "/" : path.startsWith(it.href);
        const Icon = it.icon;
        return (
          <Link key={it.href} href={it.href} onClick={onNavigate}
            className={cn("group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition",
              active ? "bg-white/[.07] text-paper" : "text-paper/60 hover:bg-white/[.04] hover:text-paper")}>
            {active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-pink" />}
            <Icon className={cn("h-[17px] w-[17px] shrink-0", active ? "text-pink" : "text-paper/50 group-hover:text-paper/80")} strokeWidth={1.75} />
            <span className="truncate">{it.label}</span>
            <span className="ml-auto text-[10px] tracking-wider text-paper/30">{it.n}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter() {
  const { data, savedAt, repoLabel, setSettings } = useStore();
  return (
    <div className="space-y-3 border-t border-white/10 pt-4 text-[11px] text-paper/50">
      <label className="flex cursor-pointer items-center justify-between gap-2 rounded-xl bg-white/[.04] px-3 py-2">
        <span className="flex items-center gap-2 text-paper/80"><FlaskConical className="h-3.5 w-3.5 text-pink" />Mostrar dados demo</span>
        <input type="checkbox" className="h-4 w-4" checked={data.settings.showDemo} onChange={(e) => setSettings({ showDemo: e.target.checked })} />
      </label>
      <Link href="/metodologia" className="flex items-center gap-2 px-1 hover:text-paper"><BookOpenCheck className="h-3.5 w-3.5" />Metodologia e transparência</Link>
      <div className="flex items-center gap-1.5 px-1" title={repoLabel}>
        <Check className="h-3 w-3 text-green-300" />
        {savedAt ? `Salvo localmente ${new Date(savedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : "Armazenamento local"}
      </div>
    </div>
  );
}

function DemoBanner() {
  const { data, setSettings } = useStore();
  const [hidden, setHidden] = useState(false);
  if (!data.settings.showDemo || hidden) return null;
  return (
    <div className="no-print mb-5 flex flex-col gap-2 rounded-2xl border border-pink-300/60 bg-pink-50 px-4 py-3 text-xs text-pink-700 sm:flex-row sm:items-center">
      <FlaskConical className="hidden h-4 w-4 shrink-0 sm:block" />
      <p className="flex-1 leading-relaxed">
        <strong className="font-semibold">Modo demonstração ativo.</strong> Itens marcados como <span className="rounded bg-pink px-1 font-semibold text-white">DEMO</span> são fictícios — pessoas, empresas, vagas e métricas que não existem.
        Seu perfil e o que você cadastrar são reais. Integrações externas não estão conectadas.
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setSettings({ showDemo: false })}>Ocultar demos</Button>
        <Button size="sm" variant="ghost" onClick={() => setHidden(true)} aria-label="Fechar aviso"><X className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}

function Toaster() {
  const { toasts } = useStore();
  return (
    <div className="no-print pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className={cn("animate-rise pointer-events-auto rounded-xl px-4 py-2.5 text-sm shadow-lg",
          t.tone === "warn" ? "bg-pink text-white" : t.tone === "info" ? "bg-white text-ink border border-paper-line" : "bg-green text-paper")}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const { ready, error } = useStore();
  useEffect(() => setOpen(false), [path]);

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col bg-green px-4 py-6 text-paper lg:flex">
        <Link href="/" className="mb-8 px-2"><Logo /></Link>
        <div className="flex-1 overflow-y-auto no-scrollbar"><NavList /></div>
        <SidebarFooter />
      </aside>

      {/* Mobile top bar */}
      <div className="no-print sticky top-0 z-30 flex items-center justify-between bg-green px-4 py-3 text-paper lg:hidden">
        <Link href="/"><Logo /></Link>
        <button onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-white/10" aria-label="Abrir menu"><Menu className="h-5 w-5" /></button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-green-900/50" />
          <aside className="animate-rise absolute inset-y-0 left-0 flex w-[280px] flex-col bg-green px-4 py-6 text-paper" onClick={(e) => e.stopPropagation()}>
            <div className="mb-8 flex items-center justify-between px-2">
              <Logo />
              <button onClick={() => setOpen(false)} aria-label="Fechar menu" className="rounded-lg p-1.5 hover:bg-white/10"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto"><NavList onNavigate={() => setOpen(false)} /></div>
            <SidebarFooter />
          </aside>
        </div>
      )}

      <main className="lg:pl-[248px]">
        <div className="mx-auto max-w-[1320px] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
          <DemoBanner />
          {error && <div className="mb-4 rounded-xl bg-pink-50 px-4 py-3 text-sm text-pink-700">{error}</div>}
          {ready ? children : (
            <div className="space-y-4">
              <div className="h-8 w-64 animate-pulse rounded-xl bg-paper-deep" />
              <div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-44 animate-pulse rounded-2xl bg-paper-deep" />)}</div>
            </div>
          )}
        </div>
      </main>
      <Toaster />
    </div>
  );
}
