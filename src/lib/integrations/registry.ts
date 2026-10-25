/**
 * Registro das integrações externas. Nenhuma é simulada: o status vem de
 * /api/integrations/status, que só verifica no servidor se as variáveis existem.
 * Mesmo com chave presente, o conector só fica "ativo" quando implementado.
 */
export type IntegrationStatus = "nao_configurada" | "configurada_nao_implementada" | "ativa";

export interface IntegrationDef {
  id: string;
  name: string;
  purpose: string;
  envVars: string[];
  implemented: boolean;
  requires: string;
  alternative: string;
  docs: string;
}

export const INTEGRATIONS: IntegrationDef[] = [
  { id: "supabase", name: "Supabase (persistência e autenticação)", purpose: "Guardar dados na nuvem, multi-dispositivo, login.", envVars: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"], implemented: false,
    requires: "Projeto Supabase, execução de supabase/schema.sql e implementação de SupabaseRepository.", alternative: "Armazenamento local no navegador + exportação/importação JSON.", docs: "https://supabase.com/docs" },
  { id: "linkedin", name: "LinkedIn API oficial", purpose: "Identidade básica (OpenID). Métricas e posts exigem programas restritos aprovados pela LinkedIn.", envVars: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"], implemented: false,
    requires: "App em developer.linkedin.com; aprovação para produtos além do Sign In. O SSI não é exposto por API pública.", alternative: "Registro manual do SSI e de métricas semanais; importação CSV.", docs: "https://learn.microsoft.com/linkedin/" },
  { id: "jobs", name: "Fontes de vagas (ex.: Adzuna)", purpose: "Buscar vagas reais por cargo e cidade.", envVars: ["ADZUNA_APP_ID", "ADZUNA_APP_KEY"], implemented: false,
    requires: "Cadastro gratuito no provedor e respeito aos termos de uso. Sem scraping de portais.", alternative: "Cadastro manual da vaga com link original + importação CSV.", docs: "https://developer.adzuna.com" },
  { id: "news", name: "Notícias e tendências", purpose: "Alimentar dossiês e pautas com notícias datadas.", envVars: ["NEWS_API_KEY"], implemented: false,
    requires: "Chave de um provedor de notícias com termos compatíveis.", alternative: "Biblioteca de referências e campos de fonte/data nos dossiês.", docs: "" },
  { id: "reviews", name: "Avaliações públicas (consumidores/empregadores)", purpose: "Relatório de dores.", envVars: [], implemented: false,
    requires: "Fontes com API ou licença que permita uso. Plataformas sem API autorizada não serão raspadas.", alternative: "Registro manual de dores com fonte, período e tamanho da amostra.", docs: "" },
  { id: "ai", name: "IA com pesquisa na web (Claude)", purpose: "Gera dossiês de empresas automaticamente com fontes e organiza currículos importados.", envVars: ["ANTHROPIC_API_KEY", "NEXO_ACCESS_CODE"], implemented: true,
    requires: "Chave da API (console.anthropic.com, cobrança por uso) e um código de acesso que protege seus créditos, cadastrados nas variáveis de ambiente da Vercel.", alternative: "Dossiê preenchido manualmente; currículo lido por regras simples.", docs: "https://docs.claude.com" },
];
