# NEXO — Career Intelligence

Centro de inteligência pessoal para LinkedIn, networking, carreira e pesquisa de empresas.
MVP navegável (Etapa 1 + parte da Etapa 2), construído com Next.js 15 (App Router), TypeScript, Tailwind CSS, componentes no padrão shadcn/ui, Lucide e Recharts.

## Executar

```bash
npm install
npm run dev        # http://localhost:3000
# ou produção
npm run build && npm start
```

Nenhuma chave de API é necessária. Os dados ficam no `localStorage` do navegador. Faça backup em **Perfil → Dados e privacidade → Exportar tudo (JSON)**.

## Estrutura

```
src/
  app/                    páginas (um diretório por módulo) + /api/integrations/status
  components/
    ui/                   Button, Card, Badge, Input, Tabs, Dialog… (padrão shadcn/ui)
    nexo.tsx              Logo, PageHeader, SwatchScore, ScoreRing, OriginBadge, ConfidenceBadge, MethodNote…
    charts.tsx            gráficos Recharts com paleta validada (verde, rosa, azul, âmbar)
  lib/
    types.ts              modelo de domínio (todo registro tem `origin`)
    data/                 DataRepository (interface) · LocalRepository · SupabaseRepository (preparado) · seed
    scoring/              NEXO Score, compatibilidade de vagas, Brand Fit, matriz de competências, relevância de contatos
    engine/               recomendações, gerador de conteúdo, mensagens, importadores
    integrations/         registro de integrações (status real, nunca simulado)
    store.tsx             estado global + persistência
supabase/schema.sql       esquema com RLS para a Etapa 2
.env.example              variáveis das integrações futuras
```

Para trocar a persistência: implemente `SupabaseRepository` e altere `getRepository()` em `src/lib/data/index.ts`. Os componentes não mudam.

## Origem dos dados

| Selo | Significado |
|---|---|
| **DEMO** | Fictício: pessoas, empresas, vagas e métricas que não existem. Pode ser ocultado (barra lateral) ou excluído (Perfil → Dados). |
| **Referência NEXO** | Cargos-hipótese e capacitações de instituições reais. Custo, carga horária e requisitos **não verificados**. |
| **Seu dado / Importado** | Informado ou importado (e revisado) por você. |

Metodologias completas: página `/metodologia` no app.

## Integrações

A integração com o Claude está implementada: dossiês automáticos com pesquisa na web (`/api/dossier`) e organização de currículos (`/api/resume`). As demais não estão conectadas.
A leitura de PDF/DOCX (`/api/extract`) funciona sem chave.

### Ativar a IA
1. Crie uma chave em console.anthropic.com e adicione créditos (cobrança por uso).
2. Vercel → projeto → Settings → Environment Variables: `ANTHROPIC_API_KEY` e `NEXO_ACCESS_CODE` (uma senha sua).
3. Redeploy. No app, em Perfil → Integrações, digite a mesma senha (uma vez por aparelho).

A senha impede que outras pessoas com o link do site usem seus créditos. O status vem de `/api/integrations/status` (só confere se as variáveis existem; os valores nunca vão para o navegador).

| Integração | Depende de | Alternativa no app |
|---|---|---|
| Supabase | projeto + `schema.sql` + implementar o repositório | localStorage + backup JSON |
| LinkedIn API | app aprovado; métricas/posts exigem programas restritos; SSI sem API pública | registro manual de SSI e métricas, CSV de conexões |
| Vagas (ex.: Adzuna) | chave do provedor | cadastro manual com link + CSV |
| Notícias | chave do provedor | campos de fonte/data nos dossiês |
| Avaliações | fonte com licença ou API | registro manual de dores com amostra |
| **IA (Claude) — implementada** | `ANTHROPIC_API_KEY` + `NEXO_ACCESS_CODE` na Vercel | dossiê manual; leitura simples de currículo |

Sem scraping, sem automação de convites ou mensagens, sem publicação automática.
