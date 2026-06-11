/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Activity, ArrowRight, BookOpen, MessageSquare, Scale, Vote } from 'lucide-react';
import { entityPath } from '../app/useBrowserRouter';
import { Badge, formatDate } from '../shared/ui';
import { repoPath } from './repository-model';
import type { CivicPR, Issue, Voting } from '../types';

export function FlowHome({
  stats,
  issues,
  prs,
  votings,
  setPath
}: {
  stats: {
    totalCitizens: number;
    organicLawArticles: number;
    openIssuesCount: number;
    prsInReviewCount: number;
    activeVotingsCount: number;
    releasesCount: number;
    civicParticipationRate: string;
  };
  issues: Issue[];
  prs: CivicPR[];
  votings: Voting[];
  setPath: (path: string) => void;
}) {
  const featuredVoting = votings.find(voting => voting.status === 'Aberta') ?? votings[0];
  const featuredPR = prs.find(pr => pr.status === 'Em votação') ?? prs[0];

  return (
    <div className="space-y-6 fade-in">
      <section className="flex flex-col gap-4">
        <div className="glass-panel p-6 rounded-[20px]">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-git-blue)] font-bold mb-2 icon-glow-blue">Código Público</p>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-git-text)] leading-tight">
            Acompanhe leis, propostas e votações.
          </h1>
          <p className="mt-3 text-sm text-[var(--color-git-muted)]">
            Comece pela Lei Orgânica, acompanhe propostas em tramitação ou vá direto para as consultas abertas.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => setPath(repoPath('lei-organica', 'texto'))}
              className="btn-secondary w-full py-3.5 font-bold text-white"
            >
              <BookOpen className="h-4 w-4 text-[var(--color-git-blue)]" />
              Abrir Lei Orgânica
            </button>
            <button
              onClick={() => setPath('/votacoes')}
              className="btn-secondary w-full py-3.5"
            >
              <Vote className="h-4 w-4" />
              Ver votações abertas
            </button>
          </div>
        </div>

        <div className="glass-panel card-hero-blue p-5 rounded-[20px] relative overflow-hidden">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-git-muted2)] font-bold">Próxima decisão</p>
          {featuredVoting ? (
            <>
              <h2 className="mt-3 text-lg font-bold leading-tight text-white">{featuredVoting.title}</h2>
              <p className="mt-2 text-[12px] text-[var(--color-git-muted)]">Prazo: <span className="text-[var(--color-git-text2)]">{formatDate(featuredVoting.deadline)}</span></p>
              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] border border-[var(--color-git-border)] p-3">
                <span>
                  <span className="block text-[10px] uppercase font-bold text-[var(--color-git-muted)]">Status</span>
                  <span className="mt-1 block text-sm font-bold text-[var(--color-git-blue)] icon-glow-blue">{featuredVoting.status}</span>
                </span>
                <Badge className="chip-blue">consulta pública</Badge>
              </div>
              <button onClick={() => setPath('/votacoes')} className="btn-primary mt-4 w-full">
                Votar agora
                <ArrowRight className="h-4 w-4" />
              </button>
            </>
          ) : (
            <p className="mt-3 text-sm text-[var(--color-git-muted)]">Nenhuma votação aberta no momento.</p>
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <HomeShortcut
          icon={Scale}
          title="Leis"
          description="Acesse as normas"
          onClick={() => setPath('/repositorios')}
        />
        <HomeShortcut
          icon={Vote}
          title="Votações"
          description="Participe"
          onClick={() => setPath('/votacoes')}
        />
        <HomeShortcut
          icon={MessageSquare}
          title="Debate"
          description="Issues e PRs"
          onClick={() => setPath(repoPath('lei-organica', 'prs'))}
        />
        <HomeShortcut
          icon={Activity}
          title="Execução"
          description="Fiscalize"
          onClick={() => setPath('/fiscalizacao')}
        />
      </section>

      {featuredPR && (
        <section className="glass-panel p-5 rounded-[20px] flex flex-col gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-git-muted2)] font-bold">PR em destaque</p>
            <h2 className="mt-2 text-md font-bold text-white leading-snug">{featuredPR.id} — {featuredPR.title}</h2>
            <p className="mt-2 text-[12px] text-[var(--color-git-muted)] leading-relaxed">Acompanhe o diff, os pareceres e o estado da tramitação.</p>
          </div>
          <button
            onClick={() => setPath(entityPath('/prs', featuredPR.id))}
            className="btn-secondary w-full font-bold text-white"
          >
            Analisar PR
            <ArrowRight className="h-4 w-4" />
          </button>
        </section>
      )}
    </div>
  );
}

function HomeShortcut({
  icon: Icon,
  title,
  description,
  onClick
}: {
  icon: typeof BookOpen;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group glass-panel hover-glow rounded-[20px] p-4 text-left flex flex-col justify-between"
    >
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white/[0.04] text-[var(--color-git-text)] border border-[var(--color-git-border)] group-hover:border-[var(--color-git-blue-glow)] group-hover:text-[var(--color-git-blue)] transition-all">
          <Icon className="h-4 w-4" />
        </span>
        <ArrowRight className="h-4 w-4 text-[var(--color-git-muted)] group-hover:text-[var(--color-git-text)]" />
      </div>
      <div className="mt-4">
        <span className="block text-sm font-bold text-white">{title}</span>
        <span className="block mt-1 text-[11px] leading-snug text-[var(--color-git-muted)]">{description}</span>
      </div>
    </button>
  );
}
