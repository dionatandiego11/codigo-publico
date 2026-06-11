/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BookOpen,
  CircleDot,
  GitBranch,
  GitPullRequest,
  History,
  Landmark,
  MessageSquare,
  Plus,
  Scale,
  ThumbsUp,
  Vote
} from 'lucide-react';
import { AuthModal, useAuth } from './auth';
import { entityPath, routeEntityId, useBrowserRouter } from './app/useBrowserRouter';
import { ISSUE_TYPES, VOTE_SELECTIONS } from './contracts/civic';
import {
  useIssues,
  usePRs,
  usePublicData,
  useVotings
} from './hooks';
import type { NewCivicPRData, NewIssueData, VoteSelection, WriteSource } from './hooks';
import { CIStatus, DiffViewer, PRCreationWizard, VoteBar } from './shared/civic';
import { Navbar, BottomNav } from './shared/layout';
import { useToast } from './shared/feedback/ToastContext';
import { motion, AnimatePresence } from 'motion/react';

import type {
  CivicPR,
  ExecutionTracker,
  Issue,
  IssueStatus,
  IssueType,
  LawArticle,
  PRStatus,
  Release,
  Territory,
  Voting
} from './types';

interface RepositorySummary {
  slug: string;
  name: string;
  description: string;
  version: string;
  docsCount: number;
  activeIssues: number;
  activePRs: number;
  releasesCount: number;
  status: string;
  category: string;
}

type RepoTab = 'texto' | 'issues' | 'prs' | 'votacoes' | 'branches' | 'releases' | 'fiscalizacao';

const repoTabs: { id: RepoTab; label: string; icon: typeof BookOpen }[] = [
  { id: 'texto', label: 'Texto', icon: BookOpen },
  { id: 'issues', label: 'Issues', icon: AlertCircle },
  { id: 'prs', label: 'PRs', icon: GitPullRequest },
  { id: 'votacoes', label: 'Votações', icon: Vote },
  { id: 'branches', label: 'Branches', icon: GitBranch },
  { id: 'releases', label: 'Releases', icon: History },
  { id: 'fiscalizacao', label: 'Fiscalização', icon: Activity }
];

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
});

function formatDate(value?: string) {
  if (!value) return 'sem data';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return dateFormatter.format(parsed);
}

function repoPath(slug: string, tab: RepoTab = 'texto') {
  return `/repositorios/${encodeURIComponent(slug)}/${tab}`;
}

function isRepoTab(value: string | undefined): value is RepoTab {
  return repoTabs.some(tab => tab.id === value);
}

function isOrganicLawRepository(repo: RepositorySummary) {
  return repo.slug === 'lei-organica' || repo.name.toLowerCase().includes('lei orgânica');
}

function textMatchesRepository(value: string | undefined, repo: RepositorySummary) {
  const normalized = (value ?? '').toLowerCase();
  if (isOrganicLawRepository(repo)) {
    return normalized === '' || normalized.includes('lei orgânica') || normalized.includes('lei organica');
  }

  return normalized.includes(repo.name.toLowerCase()) || normalized.includes(repo.slug.replaceAll('-', ' '));
}

function statusClass(status: string) {
  if (['Resolvida', 'Cumprida', 'Aprovado', 'Incorporado ao texto oficial'].includes(status)) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (['Em votação', 'Aberta', 'Aberto para debate', 'Em execução'].includes(status)) {
    return 'bg-blue-50 text-blue-700 border-blue-200';
  }
  if (['Em triagem', 'Em análise técnica', 'Atenção', 'Aguardando ajustes'].includes(status)) {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }
  if (['Rejeitado', 'Arquivada', 'Arquivado', 'Descumprida'].includes(status)) {
    return 'bg-rose-50 text-rose-700 border-rose-200';
  }
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

function PercentBar({ value, total }: { value: number; total: number }) {
  const percent = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="h-2 overflow-hidden rounded bg-[var(--color-git-bg2)] border border-[var(--color-git-border)]">
      <div className="h-full rounded bg-[var(--color-git-blue)]" style={{ width: `${percent}%`, boxShadow: '0 0 10px var(--color-git-blue-glow)' }} />
    </div>
  );
}

function Badge({ children, className = '' }: { children: string; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${className}`}>
      {children}
    </span>
  );
}

export default function App() {
  const { currentPath, setPath } = useBrowserRouter();
  const { citizen, isAuthenticated, requireAuth, openAuthModal } = useAuth();
  const { pushToast } = useToast();

  const {
    artigos,
    releases,
    trackers,
    territories,
    repositories,
    stats,
    userProfile,
    addVoteReceipt,
    applyMergedPR,
    refreshNormativeState
  } = usePublicData({ isAuthenticated });

  const { issues, addIssue, commentOnIssue, upvoteIssue, triageIssue } = useIssues();
  const { prs, addPR, commentOnPR, upvotePR, triagePR } = usePRs({
    onPRMerged: applyMergedPR,
    onPRMergedRemotely: () => {
      void refreshNormativeState();
    }
  });
  const { votacoes, castVote } = useVotings();

  const selectedPRRouteId = routeEntityId(currentPath, '/prs');
  const selectedIssueRouteId = routeEntityId(currentPath, '/issues');

  const previousCitizenIdRef = useRef<string | null>(null);
  useEffect(() => {
    const previousId = previousCitizenIdRef.current;
    if (citizen && citizen.id !== previousId) {
      pushToast('success', `Sessão iniciada como ${citizen.fullName}.`);
    } else if (!citizen && previousId) {
      pushToast('info', 'Sessão encerrada.');
    }
    previousCitizenIdRef.current = citizen?.id ?? null;
  }, [citizen, pushToast]);

  const repositorySummaries = repositories as RepositorySummary[];
  const fallbackRepository: RepositorySummary = {
    slug: 'lei-organica',
    name: 'Lei Orgânica Municipal',
    description: 'Kernel jurídico do município.',
    version: 'v2026.0',
    docsCount: artigos.length,
    activeIssues: issues.length,
    activePRs: prs.length,
    releasesCount: releases.length,
    status: 'Consolidado',
    category: 'Kernel'
  };

  const notifyWriteSource = (source: WriteSource, apiMessage: string) => {
    if (source === 'api') {
      pushToast('success', apiMessage);
    } else {
      pushToast('warning', 'API indisponível ou sem permissão: ação aplicada apenas localmente.');
    }
  };

  const handleAddNewIssue = (formData: NewIssueData) => {
    requireAuth(authenticated => {
      void addIssue({ ...formData, authorName: authenticated.fullName }).then(({ issue, source }) => {
        notifyWriteSource(source, `Issue ${issue.id} registrada.`);
        setPath(entityPath('/issues', issue.id));
      });
    });
  };

  const handleAddNewPR = (formData: NewCivicPRData) => {
    requireAuth(authenticated => {
      void addPR({ ...formData, authorName: authenticated.fullName }).then(({ pr, source }) => {
        notifyWriteSource(source, `PR cívico ${pr.id} protocolado.`);
        setPath(entityPath('/prs', pr.id));
      });
    });
  };

  const handleCastVote = (votingId: string, selection: VoteSelection) => {
    requireAuth(() => {
      void castVote(votingId, selection).then(receipt => {
        addVoteReceipt(receipt);
        notifyWriteSource(receipt.source, `Voto computado. Recibo: ${receipt.receipt}`);
      });
    });
  };

  const handleUpvoteIssue = (issueId: string) => {
    requireAuth(() => {
      void upvoteIssue(issueId).then(source => {
        notifyWriteSource(source, 'Apoio registrado na issue.');
      });
    });
  };

  const handleCommentIssue = (issueId: string, content: string) => {
    requireAuth(authenticated => {
      void commentOnIssue(issueId, content, authenticated.fullName).then(source => {
        notifyWriteSource(source, 'Comentário publicado.');
      });
    });
  };

  const handleUpvotePR = (prId: string) => {
    requireAuth(() => {
      void upvotePR(prId).then(source => {
        notifyWriteSource(source, 'Apoio registrado no PR.');
      });
    });
  };

  const handleCommentPR = (prId: string, content: string) => {
    requireAuth(authenticated => {
      void commentOnPR(prId, content, authenticated.fullName).then(source => {
        notifyWriteSource(source, 'Comentário publicado no PR.');
      });
    });
  };

  const handleTriageIssue = (issueId: string, newStatus: IssueStatus) => {
    requireAuth(() => {
      void triageIssue(issueId, newStatus).then(source => {
        notifyWriteSource(source, `Issue ${issueId}: ${newStatus}.`);
      });
    });
  };

  const handleTriagePR = (prId: string, newStatus: PRStatus) => {
    requireAuth(() => {
      void triagePR(prId, newStatus).then(source => {
        const message = newStatus === 'Incorporado ao texto oficial'
          ? `Merge institucional do PR ${prId} concluído.`
          : `PR ${prId}: ${newStatus}.`;
        notifyWriteSource(source, message);
      });
    });
  };

  const repoRoute = currentPath.match(/^\/repositorios\/([^/]+)(?:\/([^/]+))?/);
  const repoSlug = repoRoute?.[1] ? decodeURIComponent(repoRoute[1]) : '';
  const repoTab = isRepoTab(repoRoute?.[2]) ? repoRoute[2] : 'texto';
  const selectedRepository =
    repositorySummaries.find(repo => repo.slug === repoSlug) ??
    repositorySummaries.find(repo => repo.slug === 'lei-organica') ??
    repositorySummaries[0] ??
    fallbackRepository;

  const page = (() => {
    if (selectedIssueRouteId) {
      return (
        <IssueDetailPage
          issue={issues.find(issue => issue.id === selectedIssueRouteId)}
          prs={prs}
          onBack={() => setPath('/repositorios/lei-organica/issues')}
          onSelectPR={prId => setPath(entityPath('/prs', prId))}
          onUpvote={handleUpvoteIssue}
          onComment={handleCommentIssue}
        />
      );
    }

    if (selectedPRRouteId) {
      return (
        <PRDetailPage
          pr={prs.find(pr => pr.id === selectedPRRouteId)}
          issues={issues}
          voting={votacoes.find(voting => voting.id === prs.find(pr => pr.id === selectedPRRouteId)?.votingId)}
          onBack={() => setPath('/repositorios/lei-organica/prs')}
          onSelectIssue={issueId => setPath(entityPath('/issues', issueId))}
          onVote={handleCastVote}
          onUpvote={handleUpvotePR}
          onComment={handleCommentPR}
        />
      );
    }

    if (currentPath === '/' || currentPath === '') {
      return (
        <FlowHome
          stats={stats}
          issues={issues}
          prs={prs}
          votings={votacoes}
          setPath={setPath}
        />
      );
    }

    if (currentPath === '/repositorios') {
      return (
        <RepositoryIndex
          repositories={repositorySummaries}
          issues={issues}
          prs={prs}
          releases={releases}
          setPath={setPath}
        />
      );
    }

    if (currentPath === '/issues') {
      return (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] fade-in">
          <IssueList issues={issues} onSelect={issueId => setPath(entityPath('/issues', issueId))} />
          <IssueComposer
            repository={selectedRepository}
            articles={artigos}
            territories={territories}
            onSubmit={handleAddNewIssue}
          />
        </div>
      );
    }

    if (currentPath === '/prs') {
      return (
        <div className="grid gap-6 lg:grid-cols-[1fr_380px] fade-in">
          <PRList prs={prs} onSelect={prId => setPath(entityPath('/prs', prId))} />
          <PRCreationWizard
            repository={selectedRepository}
            articles={artigos}
            issues={issues}
            onSubmit={handleAddNewPR}
          />
        </div>
      );
    }

    if (repoRoute && selectedRepository) {
      return (
        <RepositoryWorkspace
          repository={selectedRepository}
          activeTab={repoTab}
          articles={artigos}
          issues={issues}
          prs={prs}
          votings={votacoes}
          releases={releases}
          trackers={trackers}
          territories={territories}
          setPath={setPath}
          onSubmitIssue={handleAddNewIssue}
          onSubmitPR={handleAddNewPR}
          onVote={handleCastVote}
        />
      );
    }

    if (currentPath === '/votacoes') {
      return (
        <VotingCenter
          votings={votacoes}
          prs={prs}
          onVote={handleCastVote}
          onSelectPR={prId => setPath(entityPath('/prs', prId))}
        />
      );
    }

    if (currentPath === '/fiscalizacao') {
      return <ExecutionCenter trackers={trackers} prs={prs} onSelectPR={prId => setPath(entityPath('/prs', prId))} />;
    }

    if (currentPath === '/minha-area') {
      return (
        <CitizenArea
          isAuthenticated={isAuthenticated}
          onLogin={openAuthModal}
          profile={userProfile}
          territories={territories}
          onSelectIssue={issueId => setPath(entityPath('/issues', issueId))}
          onSelectPR={prId => setPath(entityPath('/prs', prId))}
          onSelectVoting={votingId => setPath('/votacoes')}
        />
      );
    }

    if (currentPath === '/admin') {
      return (
        <InstitutionalPanel
          issues={issues}
          prs={prs}
          onTriageIssue={handleTriageIssue}
          onTriagePR={handleTriagePR}
        />
      );
    }

    if (currentPath === '/lei-organica' && selectedRepository) {
      return (
        <RepositoryWorkspace
          repository={selectedRepository}
          activeTab="texto"
          articles={artigos}
          issues={issues}
          prs={prs}
          votings={votacoes}
          releases={releases}
          trackers={trackers}
          territories={territories}
          setPath={setPath}
          onSubmitIssue={handleAddNewIssue}
          onSubmitPR={handleAddNewPR}
          onVote={handleCastVote}
        />
      );
    }

    return (
      <FlowHome
        stats={stats}
        issues={issues}
        prs={prs}
        votings={votacoes}
        setPath={setPath}
      />
    );
  })();

  return (
    <div className="flex min-h-screen justify-center bg-[#020408]">
      {/* outer ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-0 -translate-x-1/2 w-[120%] h-[60%]"
          style={{
            background:
              'radial-gradient(ellipse at 50% -20%, rgba(56,189,248,0.07) 0%, transparent 60%)',
          }}
        />
      </div>

      <div className="relative flex min-h-screen w-full max-w-md flex-col overflow-hidden border-x border-[var(--color-git-border)] bg-[var(--color-git-bg)] shadow-[0_0_120px_rgba(0,0,0,0.9)]">
        {/* ── Animated Background Blobs ── */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div
            className="absolute top-[-15%] left-[-25%] w-[80%] h-[50%] opacity-30 blur-[90px]"
            style={{
              background: 'radial-gradient(ellipse, rgba(56,189,248,0.55), transparent 65%)',
              animation: 'blob 9s ease-in-out infinite',
            }}
          />
          <div
            className="absolute top-[35%] right-[-25%] w-[70%] h-[55%] opacity-20 blur-[80px]"
            style={{
              background: 'radial-gradient(ellipse, rgba(192,132,252,0.6), transparent 65%)',
              animation: 'blob 11s ease-in-out infinite reverse',
            }}
          />
          <div
            className="absolute bottom-[-10%] left-[10%] w-[90%] h-[45%] opacity-15 blur-[100px]"
            style={{
              background: 'radial-gradient(ellipse, rgba(52,211,153,0.5), transparent 65%)',
              animation: 'blob 13s ease-in-out infinite 2s',
            }}
          />
          <div className="absolute inset-0 bg-grid opacity-40" />
        </div>

        <Navbar currentPath={currentPath} setPath={setPath} />

        <main className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide pb-24 px-4 pt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPath}
              initial={{ opacity: 0, y: 18, scale: 0.975 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.985 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="h-full w-full"
            >
              {page}
            </motion.div>
          </AnimatePresence>
        </main>
        
        <BottomNav currentPath={currentPath} setPath={setPath} />
        <AuthModal territories={territories} />
      </div>
    </div>
  );
}

function FlowHome({
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
  const openIssuesCount = stats.openIssuesCount || issues.length;
  const activePRsCount = stats.prsInReviewCount || prs.length;
  const activeVotingsCount = stats.activeVotingsCount || votings.length;

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
              className="group flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-[var(--color-git-border2)] px-4 py-3.5 text-sm font-bold text-white transition-all hover:bg-white/10 hover:border-[var(--color-git-blue)] hover:shadow-[0_0_20px_rgba(56,189,248,0.2)]"
            >
              <BookOpen className="h-4 w-4 text-[var(--color-git-blue)]" />
              Abrir Lei Orgânica
            </button>
            <button
              onClick={() => setPath('/votacoes')}
              className="group flex items-center justify-center gap-2 rounded-xl glass-panel px-4 py-3.5 text-sm font-semibold text-[var(--color-git-text2)] transition-all hover:border-[var(--color-git-border-glow)]"
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
              <button
                onClick={() => setPath('/votacoes')}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-git-blue)] px-4 py-3 text-sm font-bold text-[#04060d] hover:bg-white transition-all"
              >
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
            className="flex items-center justify-center gap-2 rounded-xl bg-white/[0.04] border border-[var(--color-git-border2)] px-4 py-3 text-sm font-bold text-white hover:bg-white/10"
          >
            Analisar PR
            <ArrowRight className="h-4 w-4" />
          </button>
        </section>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="font-mono text-[10px] font-bold uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
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
      className="group glass-panel hover-glow rounded-2xl p-4 text-left flex flex-col justify-between"
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

function RepositoryIndex({
  repositories,
  issues,
  prs,
  releases,
  setPath
}: {
  repositories: RepositorySummary[];
  issues: Issue[];
  prs: CivicPR[];
  releases: Release[];
  setPath: (path: string) => void;
}) {
  return (
    <div className="space-y-6 fade-in">
      <PageTitle
        eyebrow="Repositórios"
        title="Normas Municipais"
        subtitle="A Lei Orgânica e outras normas disponíveis para contribuição."
      />

      <div className="flex flex-col gap-4">
        {repositories.map(repo => {
          const repoIssues = issues.filter(issue => textMatchesRepository(issue.relatedRepository, repo));
          const repoPRs = prs.filter(pr => textMatchesRepository(pr.repository, repo));
          const repoReleases = releases.filter(release => textMatchesRepository(release.repositoryName, repo));
          return (
            <button
              key={repo.slug}
              onClick={() => setPath(repoPath(repo.slug, 'texto'))}
              className="glass-panel hover-glow rounded-2xl p-5 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[rgba(56,189,248,0.1)] text-[var(--color-git-blue)] border border-[rgba(56,189,248,0.2)] icon-glow-blue">
                  {isOrganicLawRepository(repo) ? <Scale className="h-6 w-6" /> : <Landmark className="h-6 w-6" />}
                </span>
                <Badge className="chip-purple">{repo.category}</Badge>
              </div>
              <h2 className="mt-4 text-lg font-bold text-white">{repo.name}</h2>
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[var(--color-git-muted)]">{repo.description}</p>
              <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                <MetricMini label="issues" value={repoIssues.length || repo.activeIssues} />
                <MetricMini label="prs" value={repoPRs.length || repo.activePRs} />
                <MetricMini label="releases" value={repoReleases.length || repo.releasesCount} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MetricMini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-[var(--color-git-border)] p-2 text-center flex flex-col items-center justify-center">
      <p className="text-sm font-bold text-white">{value}</p>
      <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--color-git-muted)]">{label}</p>
    </div>
  );
}

function PageTitle({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="pb-5">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-git-muted)] font-bold">{eyebrow}</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">{title}</h1>
      {subtitle && <p className="mt-2 text-sm text-[var(--color-git-muted)]">{subtitle}</p>}
    </div>
  );
}

function RepositoryWorkspace({
  repository,
  activeTab,
  articles,
  issues,
  prs,
  votings,
  releases,
  trackers,
  territories,
  setPath,
  onSubmitIssue,
  onSubmitPR,
  onVote
}: {
  repository: RepositorySummary;
  activeTab: RepoTab;
  articles: LawArticle[];
  issues: Issue[];
  prs: CivicPR[];
  votings: Voting[];
  releases: Release[];
  trackers: ExecutionTracker[];
  territories: Territory[];
  setPath: (path: string) => void;
  onSubmitIssue: (data: NewIssueData) => void;
  onSubmitPR: (data: NewCivicPRData) => void;
  onVote: (votingId: string, selection: VoteSelection) => void;
}) {
  const isOrganic = isOrganicLawRepository(repository);
  const repoArticles = isOrganic ? articles : [];
  const repoIssues = issues.filter(issue => textMatchesRepository(issue.relatedRepository, repository));
  const repoPRs = prs.filter(pr => textMatchesRepository(pr.repository, repository));
  const repoVotingIds = new Set(repoPRs.map(pr => pr.votingId).filter(Boolean));
  const repoVotings = votings.filter(voting => repoVotingIds.has(voting.id));
  const repoReleases = releases.filter(release => textMatchesRepository(release.repositoryName, repository));
  const repoPRIds = new Set(repoPRs.map(pr => pr.id));
  const repoTrackers = trackers.filter(tracker => tracker.originalPRId ? repoPRIds.has(tracker.originalPRId) : isOrganic);

  return (
    <div className="space-y-6 fade-in">
      <section className="glass-panel p-5 rounded-[20px]">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="chip-purple">repo</Badge>
              <Badge className="chip-green">branch main</Badge>
              <Badge className="chip-blue">{repository.version}</Badge>
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {repository.name}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-git-muted)]">{repository.description}</p>
          </div>
          <div className="grid min-w-64 grid-cols-3 gap-2">
            <MetricMini label="issues" value={repoIssues.length} />
            <MetricMini label="prs" value={repoPRs.length} />
            <MetricMini label="votos" value={repoVotings.length} />
          </div>
        </div>

        <div className="mt-5 flex gap-1 overflow-x-auto border-t border-[var(--color-git-border)] pt-4 scrollbar-hide">
          {repoTabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setPath(repoPath(repository.slug, tab.id))}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                  active ? 'bg-[var(--color-git-blue)] text-[#04060d]' : 'text-[var(--color-git-muted)] hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>

            );
          })}
        </div>
      </section>

      {activeTab === 'texto' && (
        <ArticleWorkspace
          articles={repoArticles}
          repository={repository}
          issues={repoIssues}
          prs={repoPRs}
          territories={territories}
          onSubmitIssue={onSubmitIssue}
          onSubmitPR={onSubmitPR}
        />
      )}

      {activeTab === 'issues' && (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <IssueList issues={repoIssues} onSelect={issueId => setPath(entityPath('/issues', issueId))} />
          <IssueComposer
            repository={repository}
            articles={repoArticles}
            territories={territories}
            onSubmit={onSubmitIssue}
          />
        </div>
      )}

      {activeTab === 'prs' && (
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <PRList prs={repoPRs} onSelect={prId => setPath(entityPath('/prs', prId))} />
          <PRCreationWizard
            repository={repository}
            articles={repoArticles}
            issues={repoIssues}
            onSubmit={onSubmitPR}
          />
        </div>
      )}

      {activeTab === 'votacoes' && (
        <VotingCenter
          votings={repoVotings}
          prs={repoPRs}
          onVote={onVote}
          onSelectPR={prId => setPath(entityPath('/prs', prId))}
        />
      )}

      {activeTab === 'branches' && <BranchBoard prs={repoPRs} articles={repoArticles} onSelectPR={prId => setPath(entityPath('/prs', prId))} />}

      {activeTab === 'releases' && <ReleaseList releases={repoReleases} onSelectPR={prId => setPath(entityPath('/prs', prId))} />}

      {activeTab === 'fiscalizacao' && <ExecutionCenter trackers={repoTrackers} prs={repoPRs} onSelectPR={prId => setPath(entityPath('/prs', prId))} />}
    </div>
  );
}

function ArticleWorkspace({
  articles,
  repository,
  issues,
  prs,
  territories,
  onSubmitIssue,
  onSubmitPR
}: {
  articles: LawArticle[];
  repository: RepositorySummary;
  issues: Issue[];
  prs: CivicPR[];
  territories: Territory[];
  onSubmitIssue: (data: NewIssueData) => void;
  onSubmitPR: (data: NewCivicPRData) => void;
}) {
  const [selectedArticleId, setSelectedArticleId] = useState(articles[0]?.id ?? '');
  const selectedArticle = articles.find(article => article.id === selectedArticleId) ?? articles[0];

  useEffect(() => {
    if (!selectedArticleId && articles[0]) {
      setSelectedArticleId(articles[0].id);
    }
  }, [articles, selectedArticleId]);

  if (!selectedArticle) {
    return (
      <div className="glass-panel p-8 text-center rounded-[20px]">
        <BookOpen className="mx-auto h-8 w-8 text-[var(--color-git-muted2)]" />
        <h2 className="mt-3 font-display text-lg font-bold text-white">Texto ainda não versionado</h2>
        <p className="mt-2 text-sm text-[var(--color-git-muted)]">Este repositório já existe no mapa do município, mas o texto normativo ainda não foi carregado pela API.</p>
      </div>
    );
  }

  const articleIssues = issues.filter(issue => issue.relatedArticleId === selectedArticle.id);
  const articlePRs = prs.filter(pr => pr.affectedArticles.includes(String(selectedArticle.number)));

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr_360px]">
      <aside className="glass-panel p-3 rounded-[20px]">
        <p className="px-2 pb-2 font-mono text-[10px] font-bold uppercase text-[var(--color-git-muted)]">Artigos</p>
        <div className="space-y-1">
          {articles.map(article => (
            <button
              key={article.id}
              onClick={() => setSelectedArticleId(article.id)}
              className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-all ${
                selectedArticle.id === article.id ? 'bg-[var(--color-git-blue)] text-[#04060d] font-bold' : 'text-[var(--color-git-text)] hover:bg-white/5'
              }`}
            >
              <span className="block font-mono text-[10px] opacity-80">Art. {article.number}</span>
              <span className="block truncate">{article.title}</span>
            </button>
          ))}
        </div>
      </aside>

      <article className="glass-panel p-6 rounded-[20px]">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="chip-purple">main</Badge>
          <Badge className="chip-blue">{selectedArticle.version}</Badge>
          <Badge className="chip-green">{formatDate(selectedArticle.lastUpdated)}</Badge>
        </div>
        <h2 className="mt-4 font-display text-2xl font-bold text-white">{selectedArticle.title}</h2>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-git-muted)]">{selectedArticle.chapter}</p>
        <div className="mt-5 rounded-[12px] bg-[var(--color-git-bg2)] border border-[var(--color-git-border)] p-4 text-sm leading-7 text-[var(--color-git-text)]">
          {selectedArticle.content}
        </div>
        <div className="mt-4 rounded-[12px] bg-[rgba(52,211,153,0.05)] border border-[rgba(52,211,153,0.2)] p-4 shadow-[0_0_15px_rgba(52,211,153,0.05)]">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--color-git-green)] icon-glow-green">Modo cidadão</p>
          <p className="mt-2 text-sm leading-6 text-[var(--color-git-text2)]">{selectedArticle.citizenExplanation}</p>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <RelatedBox
            title="Issues vinculadas"
            count={articleIssues.length}
            items={articleIssues.map(issue => `${issue.id} ${issue.title}`)}
          />
          <RelatedBox
            title="PRs que alteram"
            count={articlePRs.length}
            items={articlePRs.map(pr => `${pr.id} ${pr.title}`)}
          />
        </div>
      </article>

      <aside className="space-y-4">
        <IssueComposer
          repository={repository}
          articles={articles}
          territories={territories}
          defaultArticleId={selectedArticle.id}
          compact
          onSubmit={onSubmitIssue}
        />
        <PRCreationWizard
          repository={repository}
          articles={articles}
          issues={articleIssues}
          defaultArticleId={selectedArticle.id}
          compact
          onSubmit={onSubmitPR}
        />
      </aside>
    </div>
  );
}

function RelatedBox({ title, count, items }: { title: string; count: number; items: string[] }) {
  return (
    <div className="rounded-[12px] border border-[var(--color-git-border2)] bg-white/[0.02] p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-white">{title}</p>
        <span className="font-mono text-xs font-bold text-[var(--color-git-muted)]">{count}</span>
      </div>
      <div className="mt-2 space-y-1">
        {items.length === 0 && <p className="text-[11px] text-[var(--color-git-muted)]">Nenhum vínculo.</p>}
        {items.slice(0, 3).map(item => (
          <p key={item} className="truncate text-[11px] text-[var(--color-git-text2)]">{item}</p>
        ))}
      </div>
    </div>
  );
}

function IssueList({ issues, onSelect }: { issues: Issue[]; onSelect: (issueId: string) => void }) {
  return (
    <div className="glass-panel rounded-[20px] overflow-hidden">
      <div className="border-b border-[var(--color-git-border)] bg-[rgba(255,255,255,0.02)] p-4">
        <h2 className="font-display text-lg font-bold text-white">Issues</h2>
      </div>
      <div className="divide-y divide-[var(--color-git-border)]">
        {issues.length === 0 && <p className="p-6 text-sm text-[var(--color-git-muted)]">Nenhuma issue nesse repositório.</p>}
        {issues.map(issue => (
          <button
            key={issue.id}
            onClick={() => onSelect(issue.id)}
            className="block w-full p-4 text-left transition hover:bg-white/5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] font-bold text-[var(--color-git-muted)]">{issue.id}</span>
              <Badge className={statusClass(issue.status)}>{issue.status}</Badge>
              <Badge className="chip-purple">{issue.type}</Badge>
            </div>
            <h3 className="mt-2 text-sm font-bold text-white">{issue.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--color-git-muted)]">{issue.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function PRList({ prs, onSelect }: { prs: CivicPR[]; onSelect: (prId: string) => void }) {
  return (
    <div className="glass-panel rounded-[20px] overflow-hidden">
      <div className="border-b border-[var(--color-git-border)] bg-[rgba(255,255,255,0.02)] p-4">
        <h2 className="font-display text-lg font-bold text-white">PRs cívicos</h2>
      </div>
      <div className="divide-y divide-[var(--color-git-border)]">
        {prs.length === 0 && <p className="p-6 text-sm text-[var(--color-git-muted)]">Nenhum PR nesse repositório.</p>}
        {prs.map(pr => (
          <button
            key={pr.id}
            onClick={() => onSelect(pr.id)}
            className="block w-full p-4 text-left transition hover:bg-white/5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] font-bold text-[var(--color-git-muted)]">{pr.id}</span>
              <Badge className={statusClass(pr.status)}>{pr.status}</Badge>
            </div>
            <h3 className="mt-2 text-sm font-bold text-white">{pr.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--color-git-muted)]">{pr.citizenSummary}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function IssueComposer({
  repository,
  articles,
  territories,
  defaultArticleId = '',
  compact = false,
  onSubmit
}: {
  repository: RepositorySummary;
  articles: LawArticle[];
  territories: Territory[];
  defaultArticleId?: string;
  compact?: boolean;
  onSubmit: (data: NewIssueData) => void;
}) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<IssueType>('Problema público');
  const [territory, setTerritory] = useState('Todo o Município');
  const [theme, setTheme] = useState(repository.category);
  const [description, setDescription] = useState('');
  const [relatedArticleId, setRelatedArticleId] = useState(defaultArticleId);

  useEffect(() => {
    setRelatedArticleId(defaultArticleId);
  }, [defaultArticleId]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !description.trim()) return;

    onSubmit({
      title: title.trim(),
      type,
      territory,
      theme: theme.trim() || repository.category,
      description: description.trim(),
      authorName: '',
      assignedDepartment: 'Triagem Institucional',
      relatedArticleId: relatedArticleId || undefined,
      relatedRepository: repository.name
    });

    setTitle('');
    setDescription('');
  };

  return (
    <form onSubmit={submit} className="glass-panel p-4 rounded-[20px]">
      <div className="flex items-center gap-2">
        <Plus className="h-4 w-4 text-[var(--color-git-blue)] icon-glow-blue" />
        <h3 className="font-display text-base font-bold text-white">Abrir issue</h3>
      </div>
      <div className="mt-4 space-y-3">
        <input
          value={title}
          onChange={event => setTitle(event.target.value)}
          placeholder="Título da issue"
          className="w-full rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.02)] px-3 py-2 text-sm text-[var(--color-git-text)] outline-none focus:border-[var(--color-git-blue)] focus:shadow-[0_0_10px_rgba(56,189,248,0.2)]"
        />
        {!compact && (
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={type}
              onChange={event => setType(event.target.value as IssueType)}
              className="rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.02)] px-3 py-2 text-sm text-[var(--color-git-text)] outline-none focus:border-[var(--color-git-blue)] focus:shadow-[0_0_10px_rgba(56,189,248,0.2)]"
            >
              {ISSUE_TYPES.map(option => <option key={option}>{option}</option>)}
            </select>
            <select
              value={territory}
              onChange={event => setTerritory(event.target.value)}
              className="rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.02)] px-3 py-2 text-sm text-[var(--color-git-text)] outline-none focus:border-[var(--color-git-blue)] focus:shadow-[0_0_10px_rgba(56,189,248,0.2)]"
            >
              <option>Todo o Município</option>
              {territories.map(option => <option key={option.id}>{option.name}</option>)}
            </select>
          </div>
        )}
        {articles.length > 0 && (
          <select
            value={relatedArticleId}
            onChange={event => setRelatedArticleId(event.target.value)}
            className="w-full rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.02)] px-3 py-2 text-sm text-[var(--color-git-text)] outline-none focus:border-[var(--color-git-blue)] focus:shadow-[0_0_10px_rgba(56,189,248,0.2)]"
          >
            <option value="">Sem artigo específico</option>
            {articles.map(article => (
              <option key={article.id} value={article.id}>Art. {article.number} — {article.title}</option>
            ))}
          </select>
        )}
        <input
          value={theme}
          onChange={event => setTheme(event.target.value)}
          placeholder="Tema"
          className="w-full rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.02)] px-3 py-2 text-sm text-[var(--color-git-text)] outline-none focus:border-[var(--color-git-blue)] focus:shadow-[0_0_10px_rgba(56,189,248,0.2)]"
        />
        <textarea
          value={description}
          onChange={event => setDescription(event.target.value)}
          placeholder="Descreva o problema, lacuna ou pedido"
          rows={compact ? 3 : 5}
          className="w-full resize-none rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.02)] px-3 py-2 text-sm text-[var(--color-git-text)] outline-none focus:border-[var(--color-git-blue)] focus:shadow-[0_0_10px_rgba(56,189,248,0.2)]"
        />
        <button className="w-full rounded-xl bg-[var(--color-git-blue)] px-3 py-3 text-sm font-semibold text-[#04060d] hover:bg-white hover:shadow-[0_0_15px_rgba(56,189,248,0.4)] transition-all">
          Registrar issue
        </button>
      </div>
    </form>
  );
}

function VotingCenter({
  votings,
  prs,
  onVote,
  onSelectPR
}: {
  votings: Voting[];
  prs: CivicPR[];
  onVote: (votingId: string, selection: VoteSelection) => void;
  onSelectPR: (prId: string) => void;
}) {
  return (
    <div className="space-y-6 fade-in">
      <PageTitle
        eyebrow="Consulta pública"
        title="Votações abertas"
        subtitle="A urna mostra a decisão em linguagem simples; o PR preserva o diff, reviews e verificações institucionais."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {votings.length === 0 && (
          <div className="glass-panel p-8 text-center text-sm text-[var(--color-git-muted)] rounded-[20px]">
            Nenhuma votação aberta para este recorte.
          </div>
        )}
        {votings.map(voting => {
          const linkedPR = prs.find(pr => pr.votingId === voting.id);
          return (
            <div key={voting.id} className="glass-panel hover-glow p-5 rounded-[20px]">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={statusClass(voting.status)}>{voting.status}</Badge>
                <Badge className="chip-purple">{voting.id}</Badge>
              </div>
              <h2 className="mt-3 font-display text-xl font-bold text-white">{voting.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-git-muted)]">{voting.citizenSummary}</p>
              <VoteBar
                className="mt-4"
                approve={voting.votesYes}
                reject={voting.votesNo}
                abstain={voting.votesAbstain}
                quorumReached={voting.quorumReached}
                quorumNeeded={voting.quorumNeeded}
              />
              <div className="mt-4 flex flex-wrap gap-2">
                {VOTE_SELECTIONS.map(selection => (
                  <button
                    key={selection}
                    onClick={() => onVote(voting.id, selection)}
                    disabled={voting.hasVoted}
                    className="rounded-xl border border-[var(--color-git-border)] bg-[rgba(255,255,255,0.03)] px-3 py-2 text-sm font-semibold text-[var(--color-git-text2)] transition-all hover:bg-[rgba(255,255,255,0.08)] hover:border-[var(--color-git-blue)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-[var(--color-git-border)]"
                  >
                    {selection}
                  </button>
                ))}
                {linkedPR && (
                  <button
                    onClick={() => onSelectPR(linkedPR.id)}
                    className="ml-auto inline-flex items-center gap-2 rounded-xl bg-[var(--color-git-blue)] px-3 py-2 text-sm font-semibold text-[#04060d] hover:bg-white transition-all shadow-[0_0_10px_rgba(56,189,248,0.2)]"
                  >
                    Ver PR
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BranchBoard({ prs, articles, onSelectPR }: { prs: CivicPR[]; articles: LawArticle[]; onSelectPR: (prId: string) => void }) {
  const branchGroups = [
    {
      name: 'main',
      label: 'Texto vigente',
      description: `${articles.length} artigos consolidados`,
      prs: prs.filter(pr => pr.status === 'Incorporado ao texto oficial')
    },
    {
      name: 'consulta-popular',
      label: 'Em votação',
      description: 'propostas na urna',
      prs: prs.filter(pr => pr.status === 'Em votação' || pr.status === 'Pronto para votação')
    },
    {
      name: 'revisao-institucional',
      label: 'Reviews',
      description: 'pareceres e checks',
      prs: prs.filter(pr => pr.status.includes('revisão') || pr.status === 'Aguardando ajustes')
    },
    {
      name: 'debate-publico',
      label: 'Debate',
      description: 'propostas abertas',
      prs: prs.filter(pr => pr.status === 'Aberto para debate' || pr.status === 'Em revisão pública')
    }
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {branchGroups.map(group => (
        <div key={group.name} className="glass-panel p-5 rounded-[20px]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase text-[var(--color-git-blue)]">{group.name}</p>
              <h2 className="mt-1 font-display text-lg font-bold text-white">{group.label}</h2>
              <p className="mt-1 text-sm text-[var(--color-git-muted)]">{group.description}</p>
            </div>
            <GitBranch className="h-5 w-5 text-[var(--color-git-muted)]" />
          </div>
          <div className="mt-4 space-y-2">
            {group.prs.length === 0 && <p className="rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.02)] p-3 text-sm text-[var(--color-git-muted)]">Sem PRs nesse branch.</p>}
            {group.prs.map(pr => (
              <button
                key={pr.id}
                onClick={() => onSelectPR(pr.id)}
                className="group flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.02)] p-3 text-left transition hover:border-[var(--color-git-blue)] hover:bg-[rgba(56,189,248,0.05)] hover:shadow-[0_0_10px_rgba(56,189,248,0.2)]"
              >
                <span>
                  <span className="block font-mono text-[10px] font-bold text-[var(--color-git-muted)] group-hover:text-[var(--color-git-blue)] transition">{pr.id}</span>
                  <span className="block text-sm font-semibold text-[var(--color-git-text2)] group-hover:text-white transition">{pr.title}</span>
                </span>
                <Badge className={statusClass(pr.status)}>{pr.status}</Badge>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ReleaseList({ releases, onSelectPR }: { releases: Release[]; onSelectPR: (prId: string) => void }) {
  return (
    <div className="glass-panel rounded-[20px] overflow-hidden">
      <div className="border-b border-[var(--color-git-border)] bg-[rgba(255,255,255,0.02)] p-4">
        <h2 className="font-display text-lg font-bold text-white">Releases legislativas</h2>
      </div>
      <div className="divide-y divide-[var(--color-git-border)]">
        {releases.length === 0 && <p className="p-6 text-sm text-[var(--color-git-muted)]">Nenhuma release publicada nesse repositório.</p>}
        {releases.map(release => (
          <div key={release.id} className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="chip-purple">{release.id}</Badge>
              <span className="text-[11px] text-[var(--color-git-muted)] font-bold">{formatDate(release.date)}</span>
            </div>
            <h3 className="mt-3 font-display text-lg font-bold text-white">{release.title}</h3>
            <ul className="mt-3 space-y-1 text-sm text-[var(--color-git-muted)]">
              {release.changelog.map(item => <li key={item}>• {item}</li>)}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              {release.incorporatedPRIds.map(prId => (
                <button
                  key={prId}
                  onClick={() => onSelectPR(prId)}
                  className="rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-xs font-semibold text-[var(--color-git-text2)] transition hover:bg-[rgba(56,189,248,0.1)] hover:border-[var(--color-git-blue)] hover:text-[var(--color-git-blue)]"
                >
                  {prId}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExecutionCenter({
  trackers,
  prs,
  onSelectPR
}: {
  trackers: ExecutionTracker[];
  prs: CivicPR[];
  onSelectPR: (prId: string) => void;
}) {
  return (
    <div className="space-y-6 fade-in">
      <PageTitle
        eyebrow="Pós-release"
        title="Fiscalização da execução"
        subtitle="Depois do merge institucional, a plataforma acompanha regulamentação, orçamento, evidências e andamento."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {trackers.length === 0 && <p className="glass-panel p-6 text-sm text-[var(--color-git-muted)] rounded-[20px]">Nenhuma execução vinculada.</p>}
        {trackers.map(tracker => {
          const linkedPR = prs.find(pr => pr.id === tracker.originalPRId);
          return (
            <div key={tracker.id} className="glass-panel p-5 rounded-[20px]">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={statusClass(tracker.status)}>{tracker.status}</Badge>
                {tracker.originalPRId && <Badge className="chip-purple">{tracker.originalPRId}</Badge>}
              </div>
              <h2 className="mt-3 font-display text-lg font-bold text-white">{tracker.title}</h2>
              <p className="mt-2 text-sm text-[var(--color-git-muted)]">{tracker.normReference}</p>
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs text-[var(--color-git-text2)]">
                  <span>{tracker.responsibleDepartment}</span>
                  <span>{tracker.progressPercentage}%</span>
                </div>
                <PercentBar value={tracker.progressPercentage} total={100} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-[12px] bg-[rgba(255,255,255,0.03)] border border-[var(--color-git-border2)] p-3">
                  <p className="font-mono text-[10px] font-bold uppercase text-[var(--color-git-muted)]">Dotação</p>
                  <p className="mt-1 text-sm font-semibold text-white">{tracker.budgetAllocated}</p>
                </div>
                <div className="rounded-[12px] bg-[rgba(255,255,255,0.03)] border border-[var(--color-git-border2)] p-3">
                  <p className="font-mono text-[10px] font-bold uppercase text-[var(--color-git-muted)]">Executado</p>
                  <p className="mt-1 text-sm font-semibold text-white">{tracker.budgetSpent}</p>
                </div>
              </div>
              {linkedPR && (
                <button
                  onClick={() => onSelectPR(linkedPR.id)}
                  className="mt-4 flex items-center justify-center gap-2 w-full rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.03)] px-3 py-2.5 text-sm font-semibold text-[var(--color-git-text2)] transition hover:bg-[rgba(56,189,248,0.1)] hover:border-[var(--color-git-blue)] hover:text-[var(--color-git-blue)]"
                >
                  Ver PR original
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function IssueDetailPage({
  issue,
  prs,
  onBack,
  onSelectPR,
  onUpvote,
  onComment
}: {
  issue?: Issue;
  prs: CivicPR[];
  onBack: () => void;
  onSelectPR: (prId: string) => void;
  onUpvote: (issueId: string) => void;
  onComment: (issueId: string, content: string) => void;
}) {
  const [comment, setComment] = useState('');

  if (!issue) {
    return <NotFound title="Issue não encontrada" onBack={onBack} />;
  }

  const linkedPRs = prs.filter(pr => pr.linkedIssueIds.includes(issue.id) || pr.id === issue.linkedPRId);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!comment.trim()) return;
    onComment(issue.id, comment.trim());
    setComment('');
  };

  return (
    <div className="space-y-6 fade-in">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-git-text2)] hover:text-white transition">
        <ArrowRight className="h-4 w-4 rotate-180" />
        Voltar
      </button>
      <section className="glass-panel p-6 rounded-[20px]">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="chip-purple">{issue.id}</Badge>
          <Badge className={statusClass(issue.status)}>{issue.status}</Badge>
          <Badge className="chip-blue">{issue.type}</Badge>
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold text-white">{issue.title}</h1>
        <p className="mt-3 text-sm leading-7 text-[var(--color-git-muted)]">{issue.description}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <MetricMini label="apoios" value={issue.upvotes} />
          <MetricMini label="comentários" value={issue.comments.length} />
          <MetricMini label="prs" value={linkedPRs.length} />
          <MetricMini label="território" value={0} />
        </div>
        <button
          onClick={() => onUpvote(issue.id)}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--color-git-blue)] px-4 py-3 text-sm font-bold text-[#04060d] hover:bg-white transition shadow-[0_0_15px_rgba(56,189,248,0.3)]"
        >
          <ThumbsUp className="h-4 w-4" />
          Apoiar issue
        </button>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="glass-panel p-5 rounded-[20px]">
          <h2 className="font-display text-lg font-bold text-white">Discussão</h2>
          <div className="mt-4 space-y-3">
            {issue.comments.length === 0 && <p className="text-sm text-[var(--color-git-muted)]">Nenhum comentário publicado.</p>}
            {issue.comments.map(item => (
              <div key={item.id} className="rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.02)] p-4">
                <p className="text-sm font-semibold text-white">{item.authorName}</p>
                <p className="mt-1 text-sm text-[var(--color-git-text2)]">{item.content}</p>
                <p className="mt-2 font-mono text-[10px] text-[var(--color-git-muted)]">{formatDate(item.createdAt)}</p>
              </div>
            ))}
          </div>
          <form onSubmit={submit} className="mt-4 flex gap-2">
            <input
              value={comment}
              onChange={event => setComment(event.target.value)}
              placeholder="Adicionar comentário"
              className="min-w-0 flex-1 rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.03)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--color-git-blue)] focus:shadow-[0_0_10px_rgba(56,189,248,0.2)]"
            />
            <button className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-git-blue)] hover:text-[#04060d] transition">Enviar</button>
          </form>
        </section>

        <section className="glass-panel p-5 rounded-[20px] self-start">
          <h2 className="font-display text-lg font-bold text-white">PRs vinculados</h2>
          <div className="mt-4 space-y-2">
            {linkedPRs.length === 0 && <p className="text-sm text-[var(--color-git-muted)]">Ainda sem PR vinculado.</p>}
            {linkedPRs.map(pr => (
              <button key={pr.id} onClick={() => onSelectPR(pr.id)} className="w-full rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.02)] p-3 text-left hover:border-[var(--color-git-blue)] transition">
                <Badge className={statusClass(pr.status)}>{pr.status}</Badge>
                <p className="mt-2 text-sm font-bold text-white">{pr.id} — {pr.title}</p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function PRDetailPage({
  pr,
  issues,
  voting,
  onBack,
  onSelectIssue,
  onVote,
  onUpvote,
  onComment
}: {
  pr?: CivicPR;
  issues: Issue[];
  voting?: Voting;
  onBack: () => void;
  onSelectIssue: (issueId: string) => void;
  onVote: (votingId: string, selection: VoteSelection) => void;
  onUpvote: (prId: string) => void;
  onComment: (prId: string, content: string) => void;
}) {
  const [comment, setComment] = useState('');

  if (!pr) {
    return <NotFound title="PR não encontrado" onBack={onBack} />;
  }

  const linkedIssues = issues.filter(issue => pr.linkedIssueIds.includes(issue.id));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!comment.trim()) return;
    onComment(pr.id, comment.trim());
    setComment('');
  };

  return (
    <div className="space-y-6 fade-in">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-git-text2)] hover:text-white transition">
        <ArrowRight className="h-4 w-4 rotate-180" />
        Voltar
      </button>

      <section className="glass-panel p-6 rounded-[20px]">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="chip-purple">{pr.id}</Badge>
          <Badge className={statusClass(pr.status)}>{pr.status}</Badge>
          <Badge className="chip-blue">{pr.repository}</Badge>
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold text-white">{pr.title}</h1>
        <p className="mt-3 text-sm leading-7 text-[var(--color-git-muted)]">{pr.citizenSummary}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={() => onUpvote(pr.id)}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-git-blue)] px-4 py-2.5 text-sm font-bold text-[#04060d] hover:bg-white transition shadow-[0_0_15px_rgba(56,189,248,0.3)]"
          >
            <ThumbsUp className="h-4 w-4" />
            Apoiar PR
          </button>
          {voting && VOTE_SELECTIONS.map(selection => (
            <button
              key={selection}
              onClick={() => onVote(voting.id, selection)}
              disabled={voting.hasVoted}
              className="rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.03)] px-4 py-2.5 text-sm font-semibold text-[var(--color-git-text2)] hover:bg-[rgba(56,189,248,0.1)] hover:border-[var(--color-git-blue)] transition disabled:opacity-30 disabled:hover:border-[var(--color-git-border2)] disabled:cursor-not-allowed"
            >
              {selection}
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="glass-panel p-5 rounded-[20px]">
            <h2 className="font-display text-lg font-bold text-white">Diff normativo</h2>
            <div className="mt-4 space-y-4">
              {pr.diffs.length === 0 && <p className="text-sm text-[var(--color-git-muted)]">PR sem diff carregado.</p>}
              {pr.diffs.map(diff => (
                <DiffViewer key={`${diff.articleNumber}-${diff.titleRef}`} diff={diff} />
              ))}
            </div>
          </section>

          <section className="glass-panel p-5 rounded-[20px]">
            <h2 className="font-display text-lg font-bold text-white">Debate</h2>
            <div className="mt-4 space-y-3">
              {pr.comments.length === 0 && <p className="text-sm text-[var(--color-git-muted)]">Nenhum comentário publicado.</p>}
              {pr.comments.map(item => (
                <div key={item.id} className="rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.02)] p-4">
                  <p className="text-sm font-semibold text-white">{item.authorName}</p>
                  <p className="mt-1 text-sm text-[var(--color-git-text2)]">{item.content}</p>
                </div>
              ))}
            </div>
            <form onSubmit={submit} className="mt-4 flex gap-2">
              <input
                value={comment}
                onChange={event => setComment(event.target.value)}
                placeholder="Adicionar comentário"
                className="min-w-0 flex-1 rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.03)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--color-git-blue)] focus:shadow-[0_0_10px_rgba(56,189,248,0.2)]"
              />
              <button className="rounded-xl bg-[var(--color-git-blue)] px-4 py-2 text-sm font-semibold text-[#04060d] hover:bg-white transition shadow-[0_0_10px_rgba(56,189,248,0.2)]">Enviar</button>
            </form>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="glass-panel p-5 rounded-[20px]">
            <h2 className="font-display text-lg font-bold text-white">Reviews e checks</h2>
            <div className="mt-4 space-y-2">
              {pr.reviews.map(review => (
                <CIStatus
                  key={review.id}
                  label={`${review.reviewerRole}: ${review.reviewerName}`}
                  status={review.status}
                  description={review.conclusion || review.feedback}
                />
              ))}
              {pr.checks.map(check => (
                <CIStatus
                  key={check.id}
                  label={check.name}
                  status={check.status}
                  description={check.feedback || check.description}
                />
              ))}
              {pr.reviews.length === 0 && pr.checks.length === 0 && (
                <p className="rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.02)] p-3 text-sm text-[var(--color-git-muted)]">
                  Nenhum review ou check publicado.
                </p>
              )}
            </div>
          </section>

          <section className="glass-panel p-5 rounded-[20px]">
            <h2 className="font-display text-lg font-bold text-white">Issues vinculadas</h2>
            <div className="mt-4 space-y-2">
              {linkedIssues.length === 0 && <p className="text-sm text-[var(--color-git-muted)]">Nenhuma issue vinculada.</p>}
              {linkedIssues.map(issue => (
                <button key={issue.id} onClick={() => onSelectIssue(issue.id)} className="w-full rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.02)] p-3 text-left hover:border-[var(--color-git-blue)] transition">
                  <Badge className={statusClass(issue.status)}>{issue.status}</Badge>
                  <p className="mt-2 text-sm font-bold text-white">{issue.id} — {issue.title}</p>
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function CitizenArea({
  isAuthenticated,
  onLogin,
  profile,
  territories,
  onSelectIssue,
  onSelectPR,
  onSelectVoting
}: {
  isAuthenticated: boolean;
  onLogin: () => void;
  profile: {
    name: string;
    email: string;
    territoryId: string;
    territoryName?: string;
    registeredAt: string;
    citizenId: string;
    createdIssues: { id: string; title: string; status: string }[];
    createdPRs?: { id: string; title: string; status: string }[];
    votedList: { id: string; selection: string; receipt: string; txHash: string }[];
    supportedPRs: string[];
  };
  territories: Territory[];
  onSelectIssue: (issueId: string) => void;
  onSelectPR: (prId: string) => void;
  onSelectVoting: (votingId: string) => void;
}) {
  const territory = territories.find(item => item.id === profile.territoryId);

  return (
    <div className="space-y-6 fade-in">
      <PageTitle
        eyebrow="Conta cidadã"
        title={isAuthenticated ? profile.name : 'Minha Área'}
        subtitle={isAuthenticated ? `${profile.citizenId} • ${profile.email || 'sem e-mail'}` : 'Entre para ver seus recibos, propostas, apoios e território.'}
      />
      {!isAuthenticated && (
        <button onClick={onLogin} className="rounded-xl bg-[var(--color-git-blue)] px-4 py-3 text-sm font-bold text-[#04060d] hover:bg-white transition shadow-[0_0_15px_rgba(56,189,248,0.3)]">
          Entrar ou cadastrar cidadão
        </button>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="território" value={profile.territoryName ?? territory?.name ?? 'não informado'} />
        <Metric label="issues" value={profile.createdIssues.length} />
        <Metric label="prs" value={profile.createdPRs?.length ?? 0} />
        <Metric label="votos" value={profile.votedList.length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <CitizenList title="Minhas issues" items={profile.createdIssues} onClick={onSelectIssue} />
        <CitizenList title="Meus PRs" items={profile.createdPRs ?? []} onClick={onSelectPR} />
        <div className="glass-panel p-5 rounded-[20px]">
          <h2 className="font-display text-base font-bold text-white">Recibos de voto</h2>
          <div className="mt-4 space-y-2">
            {profile.votedList.length === 0 && <p className="text-sm text-[var(--color-git-muted)]">Sem votos registrados.</p>}
            {profile.votedList.map(item => (
              <button key={`${item.id}-${item.receipt}`} onClick={() => onSelectVoting(item.id)} className="w-full rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.02)] p-3 text-left transition hover:border-[var(--color-git-blue)]">
                <Badge className="chip-green">{item.selection}</Badge>
                <p className="mt-2 font-mono text-xs font-bold text-white">{item.receipt}</p>
                <p className="mt-1 font-mono text-[10px] text-[var(--color-git-muted)]">{item.id}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CitizenList({
  title,
  items,
  onClick
}: {
  title: string;
  items: { id: string; title: string; status: string }[];
  onClick: (id: string) => void;
}) {
  return (
    <div className="glass-panel p-5 rounded-[20px]">
      <h2 className="font-display text-base font-bold text-white">{title}</h2>
      <div className="mt-4 space-y-2">
        {items.length === 0 && <p className="text-sm text-[var(--color-git-muted)]">Nenhum registro.</p>}
        {items.map(item => (
          <button key={item.id} onClick={() => onClick(item.id)} className="w-full rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.02)] p-3 text-left transition hover:border-[var(--color-git-blue)]">
            <Badge className={statusClass(item.status)}>{item.status}</Badge>
            <p className="mt-2 text-sm font-bold text-white">{item.id} — {item.title}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function InstitutionalPanel({
  issues,
  prs,
  onTriageIssue,
  onTriagePR
}: {
  issues: Issue[];
  prs: CivicPR[];
  onTriageIssue: (issueId: string, status: IssueStatus) => void;
  onTriagePR: (prId: string, status: PRStatus) => void;
}) {
  const pendingIssues = issues.filter(issue => !['Resolvida', 'Arquivada'].includes(issue.status));
  const activePRs = prs.filter(pr => !['Incorporado ao texto oficial', 'Rejeitado', 'Arquivado'].includes(pr.status));

  return (
    <div className="space-y-6 fade-in">
      <PageTitle
        eyebrow="Rito formal"
        title="Console institucional"
        subtitle="Triagem, status formal e merge ficam separados do clique popular."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass-panel p-5 rounded-[20px]">
          <h2 className="font-display text-lg font-bold text-white">Issues para triagem</h2>
          <div className="mt-4 space-y-3">
            {pendingIssues.map(issue => (
              <div key={issue.id} className="rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.02)] p-4">
                <Badge className={statusClass(issue.status)}>{issue.status}</Badge>
                <h3 className="mt-2 text-sm font-bold text-white">{issue.id} — {issue.title}</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => onTriageIssue(issue.id, 'Em análise técnica')} className="rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-xs font-semibold text-[var(--color-git-text2)] transition hover:border-[var(--color-git-blue)] hover:text-white">Análise técnica</button>
                  <button onClick={() => onTriageIssue(issue.id, 'Resolvida')} className="rounded-xl border border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.1)] px-3 py-1.5 text-xs font-semibold text-[var(--color-git-green)] transition hover:bg-[rgba(52,211,153,0.2)]">Resolver</button>
                  <button onClick={() => onTriageIssue(issue.id, 'Arquivada')} className="rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-xs font-semibold text-[var(--color-git-text2)] transition hover:border-[var(--color-git-muted)]">Arquivar</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel p-5 rounded-[20px]">
          <h2 className="font-display text-lg font-bold text-white">PRs em rito</h2>
          <div className="mt-4 space-y-3">
            {activePRs.map(pr => (
              <div key={pr.id} className="rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.02)] p-4">
                <Badge className={statusClass(pr.status)}>{pr.status}</Badge>
                <h3 className="mt-2 text-sm font-bold text-white">{pr.id} — {pr.title}</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => onTriagePR(pr.id, 'Em revisão técnica')} className="rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-xs font-semibold text-[var(--color-git-text2)] transition hover:border-[var(--color-git-blue)]">Revisão técnica</button>
                  <button onClick={() => onTriagePR(pr.id, 'Pronto para votação')} className="rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-xs font-semibold text-[var(--color-git-text2)] transition hover:border-[var(--color-git-blue)]">Pronto para voto</button>
                  <button onClick={() => onTriagePR(pr.id, 'Aprovado formalmente')} className="rounded-xl border border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.1)] px-3 py-1.5 text-xs font-semibold text-[var(--color-git-green)] transition hover:bg-[rgba(52,211,153,0.2)]">Aprovar formalmente</button>
                  <button onClick={() => onTriagePR(pr.id, 'Incorporado ao texto oficial')} className="rounded-xl bg-[var(--color-git-blue)] px-3 py-1.5 text-xs font-bold text-[#04060d] hover:bg-white transition shadow-[0_0_10px_rgba(56,189,248,0.3)]">Merge</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function NotFound({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="glass-panel p-8 text-center rounded-[20px]">
      <CircleDot className="mx-auto h-8 w-8 text-[var(--color-git-muted)]" />
      <h1 className="mt-3 font-display text-xl font-bold text-white">{title}</h1>
      <button onClick={onBack} className="mt-4 rounded-xl bg-[var(--color-git-blue)] px-4 py-2 text-sm font-bold text-[#04060d] hover:bg-white transition shadow-[0_0_10px_rgba(56,189,248,0.3)]">
        Voltar
      </button>
    </div>
  );
}
