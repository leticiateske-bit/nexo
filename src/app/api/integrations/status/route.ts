import { NextResponse } from "next/server";
import { INTEGRATIONS, type IntegrationStatus } from "@/lib/integrations/registry";

export const dynamic = "force-dynamic";

/** Retorna apenas se as variáveis existem — nunca seus valores. */
export function GET() {
  const status: Record<string, IntegrationStatus> = {};
  for (const i of INTEGRATIONS) {
    const configured = i.envVars.length > 0 && i.envVars.every((v) => !!process.env[v]);
    status[i.id] = !configured ? "nao_configurada" : i.implemented ? "ativa" : "configurada_nao_implementada";
  }
  return NextResponse.json({ status, checkedAt: new Date().toISOString() });
}
