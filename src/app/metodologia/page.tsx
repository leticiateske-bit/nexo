"use client";

import { useStore } from "@/lib/store";
import { Card, CardBody, CardHeader } from "@/components/ui";
import { Fact, OriginBadge, PageHeader } from "@/components/nexo";

export default function Methodology() {
  const { data } = useStore();
  const jw = data.settings.jobWeights, bw = data.settings.brandWeights;
  return (
    <>
      <PageHeader index="—" title="Metodologia e transparência" description="Como o NEXO calcula, de onde vêm os dados e o que ele não faz." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="lg:col-span-2" tone="green">
          <CardHeader title="Princípios" />
          <CardBody className="grid gap-x-8 gap-y-2 text-sm text-paper/85 md:grid-cols-2">
            {["Nunca inventar métricas, vagas, cursos, empresas, depoimentos ou fontes.", "Indicar a origem de cada dado (demo, referência NEXO, seu dado, importado, API).", "Mostrar links e datas de publicação ou verificação quando existem.", "Separar fatos, inferências, estimativas, hipóteses e recomendações.", "Documentar a metodologia de todos os scores.", "Sinalizar evidência insuficiente e exibir confiança e cobertura.", "Registrar a data da última atualização.", "Permitir editar, corrigir e excluir dados pessoais.", "Respeitar privacidade, propriedade intelectual e termos dos serviços.", "Não simular integrações, não fazer scraping, não automatizar convites, mensagens ou publicações."].map((p, i) => (
              <p key={i}><span className="mr-2 font-display text-pink">{String(i + 1).padStart(2, "0")}</span>{p}</p>
            ))}
          </CardBody>
        </Card>

        <Card><CardHeader title="Origem dos dados" /><CardBody className="space-y-2 text-sm">
          <p><OriginBadge origin="demo" /> Fictício, para demonstração. Pessoas, empresas, vagas e métricas que não existem.</p>
          <p><OriginBadge origin="nexo" /> Referência curada (cargos-hipótese e capacitações de instituições reais). Custos e cargas não verificados.</p>
          <p><OriginBadge origin="user" /> Informado por você.</p>
          <p><OriginBadge origin="import" /> Importado de arquivo e revisado por você.</p>
          <p><OriginBadge origin="api" /> Obtido por integração autorizada (nenhuma ativa nesta versão).</p>
        </CardBody></Card>

        <Card><CardHeader title="Tipos de afirmação" /><CardBody className="space-y-2.5">
          <Fact kind="fato">Dado registrado com fonte.</Fact>
          <Fact kind="inferencia">Conclusão derivada de dados, com raciocínio explícito.</Fact>
          <Fact kind="estimativa">Pontuação calculada pelo NEXO (ex.: Brand Fit).</Fact>
          <Fact kind="hipotese">Possibilidade a ser testada ou confirmada.</Fact>
          <Fact kind="recomendacao">Ação sugerida, com regra e dados de base.</Fact>
        </CardBody></Card>

        <Card><CardHeader eyebrow="Estimativa interna" title="NEXO Score (0–100)" /><CardBody className="space-y-2 text-xs leading-relaxed text-ink-soft">
          <p>Quatro pilares de 0–25, inspirados nos pilares conceituais do Social Selling Index. <strong>Não reproduz o algoritmo proprietário do LinkedIn</strong> e não deve ser lido como SSI.</p>
          <p><strong>Marca:</strong> checklist do perfil (60%: OK=1, melhorar=0,5, ausente=0) + publicações nos últimos 30 dias vs meta (40%).</p>
          <p><strong>Pessoas:</strong> novos contatos em 30 dias vs meta (50%) + cobertura de recrutadores, gestores, função-alvo e lideranças (25%) + contatos em empresas-alvo, referência 5 (25%).</p>
          <p><strong>Insights:</strong> comentários feitos em 4 semanas vs meta (50%) + frequência de publicação (25%) + mensagens/comentários registrados em 30 dias (25%).</p>
          <p><strong>Relacionamentos:</strong> taxa de aceitação, com 5+ convites (30%) + contatos com 2+ interações, referência 5 (30%) + próximos passos no prazo (20%) + crescimento de conexões em 4 semanas vs meta (20%).</p>
          <p>Componentes sem dados ficam fora do cálculo; a cobertura define a confiança (alta ≥ 85%, média ≥ 60%, baixa ≥ 30%, abaixo disso evidência insuficiente). Se algum pilar não tiver dados, o total é extrapolado da média dos pilares disponíveis, e a cobertura mostra isso.</p>
        </CardBody></Card>

        <Card><CardHeader eyebrow="Estimativa interna" title="Desempenho de carreira (0–100)" /><CardBody className="space-y-2 text-xs leading-relaxed text-ink-soft">
          <p>Mede a execução do seu plano, não a empregabilidade: candidaturas enviadas em 30 dias vs meta (35%) + ações do plano 30/60/90 concluídas (35%) + capacitações em andamento/concluídas vs meta trimestral (30%).</p>
        </CardBody></Card>

        <Card><CardHeader eyebrow="Configurável" title="Índice de compatibilidade da vaga" /><CardBody className="space-y-2 text-xs leading-relaxed text-ink-soft">
          <p>Pesos atuais: competências {jw.skills}% · experiência e senioridade {jw.experience}% · formação e requisitos {jw.education}% · objetivos {jw.goals}% · localização, remuneração e modalidade {jw.logistics}%.</p>
          <p>Competências: média de min(nível/3; 1). Senioridade: referência NEXO de anos (Júnior 0, Pleno 3, Sênior 6, Especialista/Coordenação 7), −25 por ano faltante. Formação: 100 se atendida, 40 se não; requisitos: % comprovados no perfil. Objetivos: 100 para cargo-alvo, senão pela prioridade da área. Logística: modalidade, cidade (se não remoto) e salário (só se divulgado e com pretensão definida).</p>
          <p><strong>Compatibilidade não é probabilidade de contratação.</strong></p>
        </CardBody></Card>

        <Card><CardHeader eyebrow="Configurável" title="NEXO Brand Fit" /><CardBody className="space-y-2 text-xs leading-relaxed text-ink-soft">
          <p>Pesos atuais: competências × áreas {bw.skills}% · experiência × trajetórias {bw.experience}% · valores e cultura declarados {bw.values}% · interesses {bw.interests}% · cargos disponíveis {bw.roles}%.</p>
          <p>Competências: média de min(nível/3; 1) nas áreas cadastradas da empresa. Experiência: % das áreas citadas nas experiências e evidências do seu perfil. Valores: valores em comum ÷ min(3; seus valores). Interesses: prioridade da área. Cargos: melhor compatibilidade entre vagas da empresa, ou 75/35 por cargos prováveis.</p>
          <p>Estimativa analítica do NEXO — não é avaliação oficial da empresa nem previsão de contratação.</p>
        </CardBody></Card>

        <Card><CardHeader title="Relevância estratégica de contatos" /><CardBody className="text-xs leading-relaxed text-ink-soft">
          <p>Soma de pontos pela categoria, empresa-alvo, cargo relacionado a um cargo-alvo e área ligada às suas prioridades. Nunca usa características pessoais sensíveis.</p>
        </CardBody></Card>

        <Card><CardHeader title="Recomendações e tarefas" /><CardBody className="text-xs leading-relaxed text-ink-soft">
          <p>Regras explícitas (ex.: prioridade nº 1 sem conteúdo recente, acompanhamentos atrasados, frequência abaixo da meta, vaga aderente sem análise, lacuna frequente nas vagas, empresa com Brand Fit alto sem contatos, SSI ou métricas desatualizados). Cada recomendação mostra os dados de base e o impacto esperado. Quando faltam dados, a recomendação é registrá-los.</p>
        </CardBody></Card>
      </div>
    </>
  );
}
