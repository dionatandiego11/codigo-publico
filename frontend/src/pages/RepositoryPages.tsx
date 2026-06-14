/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { BookOpen, Landmark, Scale } from 'lucide-react';
import { entityPath } from '../app/useBrowserRouter';
import type { NewCivicPRData, NewIssueData, VoteSelection } from '../hooks';
import { PRCreationWizard } from '../shared/civic';
import { Badge, MetricMini, PageTitle, formatDate } from '../shared/ui';
import { ExecutionCenter } from './ExecutionCenterPage';
import { IssueComposer, IssueList } from './IssuePages';
import { BranchBoard, PRList } from './PRPages';
import { ReleaseList } from './ReleaseListPage';
import {
  isOrganicLawRepository,
  repoPath,
  repoTabs,
  textMatchesRepository,
  type RepoTab,
  type RepositorySummary
} from './repository-model';
import { VotingCenter } from './VotingCenterPage';
import type {
  CivicPR,
  ExecutionTracker,
  Issue,
  LawArticle,
  Release,
  Territory,
  Voting
} from '../types';

export function RepositoryIndex({
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
              className="glass-panel hover-glow rounded-[20px] p-5 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(56,189,248,0.1)] text-[var(--color-git-blue)] border border-[rgba(56,189,248,0.2)] icon-glow-blue">
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

export function RepositoryWorkspace({
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    <div className="space-y-4">
      {/* ── Seletor de artigo (mobile: select nativo | lg: sidebar coluna) ── */}

      {/* Select nativo — visível só em mobile */}
      <div className="lg:hidden glass-panel rounded-[16px] p-3">
        <label className="block font-mono text-[10px] font-bold uppercase text-[var(--color-git-muted)] mb-2 px-1">
          Artigo
        </label>
        <select
          value={selectedArticleId}
          onChange={e => setSelectedArticleId(e.target.value)}
          className="w-full rounded-xl border border-[var(--color-git-border2)] bg-[var(--color-git-bg2)] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--color-git-blue)] transition"
        >
          {articles.map(article => (
            <option key={article.id} value={article.id} className="bg-[#0d1117]">
              Art. {article.number} — {article.title}
            </option>
          ))}
        </select>
      </div>

      {/* Layout em grid: sidebar só visível em lg+ */}
      <div className="grid gap-4 lg:grid-cols-[220px_1fr_340px]">

        {/* Sidebar de artigos — apenas lg+ */}
        <aside className="hidden lg:block glass-panel p-3 rounded-[20px] self-start sticky top-4">
          <p className="px-2 pb-2 font-mono text-[10px] font-bold uppercase text-[var(--color-git-muted)]">Artigos</p>
          <div className="space-y-1">
            {articles.map(article => (
              <button
                key={article.id}
                onClick={() => setSelectedArticleId(article.id)}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-all ${
                  selectedArticle.id === article.id
                    ? 'bg-[var(--color-git-blue)] text-[#04060d] font-bold'
                    : 'text-[var(--color-git-text)] hover:bg-white/5'
                }`}
              >
                <span className="block font-mono text-[10px] opacity-70">Art. {article.number}</span>
                <span className="block truncate text-xs leading-snug mt-0.5">{article.title}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* ── Artigo principal ── */}
        <article className="glass-panel rounded-[20px] overflow-hidden min-w-0">
          {/* Cabeçalho do artigo */}
          <div className="border-b border-[var(--color-git-border)] bg-[rgba(255,255,255,0.02)] px-5 py-4">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge className="chip-purple">main</Badge>
              <Badge className="chip-blue">{selectedArticle.version}</Badge>
              <Badge className="chip-green">{formatDate(selectedArticle.lastUpdated)}</Badge>
              {selectedArticle.amendmentNumber && (
                <Badge className="chip-amber">{selectedArticle.amendmentNumber}</Badge>
              )}
            </div>
            <h2 className="font-display text-lg font-bold text-white leading-snug">{selectedArticle.title}</h2>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-git-muted)]">{selectedArticle.chapter}</p>
            {selectedArticle.section && (
              <p className="mt-0.5 text-xs text-[var(--color-git-muted)]">{selectedArticle.section}</p>
            )}
          </div>

          {/* Corpo */}
          <div className="px-5 py-5 space-y-4">
            {/* Texto normativo */}
            <div className="rounded-xl bg-[var(--color-git-bg2)] border border-[var(--color-git-border)] p-4">
              <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--color-git-muted)] mb-3">Texto vigente</p>
              <p className="text-sm leading-8 text-[var(--color-git-text)] break-words whitespace-pre-wrap">
                {selectedArticle.content}
              </p>
            </div>

            {/* Modo cidadão */}
            <div className="rounded-xl bg-[rgba(52,211,153,0.05)] border border-[rgba(52,211,153,0.2)] p-4 shadow-[0_0_15px_rgba(52,211,153,0.04)]">
              <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--color-git-green)] mb-2">Modo cidadão</p>
              <p className="text-sm leading-7 text-[var(--color-git-text2)] break-words">{selectedArticle.citizenExplanation}</p>
            </div>

            {/* Issues e PRs relacionados */}
            <div className="grid gap-3 sm:grid-cols-2">
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

            {/* Comentários do artigo */}
            {selectedArticle.comments.length > 0 && (
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--color-git-muted)] mb-3">
                  Comentários ({selectedArticle.comments.length})
                </p>
                <div className="space-y-3">
                  {selectedArticle.comments.map(c => (
                    <div key={c.id} className="rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.02)] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div>
                          <span className="text-sm font-bold text-white">{c.authorName}</span>
                          <span className="ml-2 rounded border border-[var(--color-git-border2)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--color-git-muted)]">{c.authorRole}</span>
                        </div>
                        <span className="font-mono text-[10px] text-[var(--color-git-muted)]">♥ {c.likes}</span>
                      </div>
                      <p className="text-sm leading-6 text-[var(--color-git-text2)]">{c.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>

        {/* ── Sidebar de ação (Issue + PR) ── */}
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
    </div>
  );
}


function RelatedBox({ title, count, items }: { title: string; count: number; items: string[] }) {
  return (
    <div className="rounded-xl border border-[var(--color-git-border2)] bg-white/[0.02] p-3">
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
