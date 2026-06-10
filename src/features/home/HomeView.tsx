/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Scale,
  AlertCircle,
  GitPullRequest,
  Vote,
  History,
  Activity,
  Users,
  Search,
  ArrowRight,
  ShieldCheck,
  Code2,
  Database
} from 'lucide-react';

interface HomeViewProps {
  setPath: (path: string) => void;
  stats: {
    totalCitizens: number;
    organicLawArticles: number;
    openIssuesCount: number;
    prsInReviewCount: number;
    activeVotingsCount: number;
    releasesCount: number;
    civicParticipationRate: string;
  };
}

export default function HomeView({ setPath, stats }: HomeViewProps) {
  const cards = [
    {
      title: 'Lei Orgânica Aberta (Kernel)',
      description: 'Consulte o kernel jurídico do município, artigo por artigo. Entenda seus direitos de forma simples e faça anotações.',
      icon: Scale,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:border-emerald-300',
      path: '/lei-organica',
      metaphor: 'kernel jurídico',
    },
    {
      title: 'Issues Públicas',
      description: 'Registre e acompanhe problemas urbanos, sugestões de melhorias normativas, demandas de bairros ou falhas de execução.',
      icon: AlertCircle,
      color: 'bg-amber-50 text-amber-700 border-amber-100 hover:border-amber-300',
      path: '/issues',
      metaphor: 'demandas e lacunas',
    },
    {
      title: 'PRs Cívicos (Pull Requests)',
      description: 'Acompanhe propostas formais de emenda à Lei Orgânica, alterações em leis municipais e revisões formuladas pela comunidade.',
      icon: GitPullRequest,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:border-indigo-300',
      path: '/prs',
      metaphor: 'propostas de emenda',
    },
    {
      title: 'Votações Ativas',
      description: 'Participe diretamente das consultas populares sobre alterações de leis aprovadas e envie o seu voto de forma certificada.',
      icon: Vote,
      color: 'bg-purple-50 text-purple-700 border-purple-100 hover:border-purple-300',
      path: '/votacoes',
      metaphor: 'consultas populares',
    },
    {
      title: 'Releases Legislativas',
      description: 'Veja as versões estruturadas das leis municipais consolidadas passo a passo após os trâmites e aprovações formais.',
      icon: History,
      color: 'bg-blue-50 text-blue-700 border-blue-100 hover:border-blue-300',
      path: '/releases',
      metaphor: 'versões de leis consolidadas',
    },
    {
      title: 'Fiscalização de Execução',
      description: 'Acompanhe se as emendas aprovadas e leis vigentes estão sendo devidamente regulamentadas e executadas pela prefeitura.',
      icon: Activity,
      color: 'bg-rose-50 text-rose-700 border-rose-100 hover:border-rose-300',
      path: '/fiscalizacao',
      metaphor: 'conselho fiscalizador ativo',
    },
  ];

  const coreMetaphors = [
    { source: 'Município', target: 'Sistema Operacional Cívico', desc: 'As engrenagens administrativas tratadas de forma modular e integrada.' },
    { source: 'Lei Orgânica', target: 'Kernel do Sistema', desc: 'O núcleo constitucional infradescartável que rege tudo na cidade.' },
    { source: 'PPA, LDO e LOA', target: 'Runtime Orçamentário', desc: 'O software financeiro que distribui recursos na máquina viva.' },
    { source: 'Proposta de Emenda', target: 'PR (Pull Request) Cívico', desc: 'Sugestão controlada de alteração de código legal debatida publicamente.' },
    { source: 'Texto Consolidado', target: 'Branch Principal (main)', desc: 'As regras da lei vigentes em produção.' },
  ];

  return (
    <div className="space-y-12 pb-12 fade-in" id="home-view-container">
      {/* Hero section with distinct design and generous spacing */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white px-6 py-12 md:py-20 text-center shadow-sm">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-indigo-200 to-emerald-200 opacity-40 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>

        <div className="mx-auto max-w-3xl space-y-6">
          <div className="inline-flex items-center space-x-1.5 rounded-full bg-indigo-50 px-3 py-1 font-mono text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-ping mr-1" />
            Democracia Aberta e Versionalizada
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Código Público <br />
            <span className="bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
              O código-fonte aberto do município
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Consulte a Lei Orgânica municipal estruturada como um repositório, proponha emendas diretas (PRs), registre issues normativas, registre seu voto com segurança e fiscalize o cumprimento das obrigações aprovadas.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={() => setPath('/lei-organica')}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white hover:bg-slate-800 transition-all shadow-md hover:shadow-lg"
              id="cta-browse-law"
            >
              <span>Navegar pela Lei Orgânica</span>
              <ArrowRight className="h-4 w-4 text-emerald-400" />
            </button>
            <button
              onClick={() => setPath('/prs')}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
              id="cta-prs"
            >
              <GitPullRequest className="h-4 w-4 text-indigo-500" />
              <span>Ver PRs em Discussão</span>
            </button>
          </div>
        </div>
      </section>

      {/* Real-time stats indicators */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Artigos do Kernel', value: stats.organicLawArticles, unit: 'vigentes', icon: Scale },
          { label: 'Issues Ativas', value: stats.openIssuesCount, unit: 'demandas', icon: AlertCircle },
          { label: 'PRs em Revisão', value: stats.prsInReviewCount, unit: 'propostas', icon: GitPullRequest },
          { label: 'Votações Ativas', value: stats.activeVotingsCount, unit: 'consulta', icon: Vote },
          { label: 'Releases de Leis', value: stats.releasesCount, unit: 'versões', icon: History },
          { label: 'Engajamento Local', value: stats.civicParticipationRate, unit: 'quórum médio', icon: Users },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 text-center shadow-xs transition-shadow hover:shadow-md"
              id={`stat-card-${idx}`}
            >
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-2.5">
                <Icon className="h-4.5 w-4.5 text-slate-500" />
              </div>
              <p className="font-display text-2xl font-bold text-slate-900 leading-tight">{item.value}</p>
              <p className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 mt-1">{item.label}</p>
              <p className="text-[11px] text-slate-500">{item.unit}</p>
            </div>
          );
        })}
      </section>

      {/* Core conceptual translates - The SO civico metaphor schema */}
      <section className="rounded-2xl border border-slate-200 bg-slate-900 text-white p-6 md:p-8 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-[0.04] pointer-events-none">
          <Code2 className="h-96 w-96 text-white" />
        </div>

        <div className="max-w-xl space-y-4">
          <span className="inline-flex items-center space-x-1 rounded bg-indigo-500/20 px-2.5 py-1 font-mono text-[10px] font-bold text-indigo-300 uppercase tracking-widest">
            Metáfora Conceitual do Produto
          </span>
          <h2 className="font-display text-2xl font-bold tracking-tight">Câmaras e Cidades tratadas como Sistemas Operacionais</h2>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            Nós traduzimos as complexas terminologias legislativas e do direito administrativo para ferramentas que lembram o GitHub de forma inclusiva e amigável, permitindo com que qualquer pessoa acompanhe e colabore com a governança da cidade.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-3.5 mt-8 border-t border-slate-850 pt-6">
          {coreMetaphors.map((meta, idx) => (
            <div key={idx} className="rounded-xl bg-slate-950 p-4 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="font-mono text-[10px] text-indigo-400 font-bold uppercase block mb-1">Conceito Público</span>
                <span className="font-display font-semibold text-sm text-slate-200">{meta.source}</span>
              </div>
              <div className="border-t border-slate-900 my-2.5 pt-2">
                <span className="font-mono text-[10px] text-emerald-400 font-bold uppercase block mb-1">Equivalente Digital</span>
                <span className="font-display font-bold text-[13px] text-white flex items-center space-x-1 select-none">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1 shrink-0" />
                  {meta.target}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal mt-1">{meta.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Main product navigation cards */}
      <section className="space-y-6">
        <div className="text-center md:text-left">
          <h3 className="font-display text-xl font-bold text-slate-900 tracking-tight">O que você gostaria de explorar hoje?</h3>
          <p className="text-slate-500 text-xs sm:text-sm">Clique em qualquer um dos módulos abaixo para participar diretamente.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                onClick={() => setPath(card.path)}
                className={`group cursor-pointer rounded-2xl border bg-white p-6 shadow-xs select-none transition-all hover:scale-[1.01] hover:shadow-lg ${card.color}`}
                id={`feature-card-${card.path.replace('/', '')}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-xs">
                    <Icon className="h-5.5 w-5.5" />
                  </div>
                  <span className="font-mono text-[9px] font-bold uppercase tracking-widest bg-white/80 px-2 py-0.5 rounded border border-slate-200/40">
                    {card.metaphor}
                  </span>
                </div>
                <h4 className="font-display font-bold text-base text-slate-900 mt-4 flex items-center space-x-1 group-hover:text-indigo-700 transition-colors">
                  <span>{card.title}</span>
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </h4>
                <p className="text-slate-600 text-xs leading-relaxed mt-2">{card.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Security notice / Brazilian LGPD & Civic principles footer */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <ShieldCheck className="h-5.5 w-5.5" />
          </div>
          <div>
            <h4 className="font-display font-bold text-sm text-slate-900">Democracia Correta, Segura e Auditável</h4>
            <p className="text-slate-500 text-xs leading-normal mt-0.5 max-w-xl">
              Nossa plataforma garante o absoluto sigilo do seu voto individual. Todas as deliberações são criptografadas em dados públicos de hash simulados. CPFs nunca são expostos em conformidade com a LGPD.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <span className="font-mono text-[10px] text-slate-400 font-bold uppercase">Tecnologias:</span>
          <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 font-mono text-[10px] font-bold">GOV.BR API</span>
          <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 font-mono text-[10px] font-bold">SHA-256 HASH</span>
        </div>
      </section>
    </div>
  );
}
