/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, GitBranch, ThumbsUp } from 'lucide-react';
import { VOTE_SELECTIONS } from '../contracts/civic';
import type { VoteSelection } from '../hooks';
import { CIStatus, DiffViewer } from '../shared/civic';
import { Badge, NotFound, statusClass } from '../shared/ui';
import type { CivicPR, Issue, LawArticle, Voting } from '../types';

export function PRList({ prs, onSelect }: { prs: CivicPR[]; onSelect: (prId: string) => void }) {
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

export function BranchBoard({ prs, articles, onSelectPR }: { prs: CivicPR[]; articles: LawArticle[]; onSelectPR: (prId: string) => void }) {
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

export function PRDetailPage({
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
          <button onClick={() => onUpvote(pr.id)} className="btn-primary">
            <ThumbsUp className="h-4 w-4" />
            Apoiar PR
          </button>
          {voting && VOTE_SELECTIONS.map(selection => (
            <button
              key={selection}
              onClick={() => onVote(voting.id, selection)}
              disabled={voting.hasVoted}
              className="btn-secondary"
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
                className="field min-w-0 flex-1"
              />
              <button className="btn-primary btn-sm shrink-0">Enviar</button>
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
