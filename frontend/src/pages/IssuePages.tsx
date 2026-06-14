/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, Plus, ThumbsUp } from 'lucide-react';
import { ISSUE_TYPES } from '../contracts/civic';
import type { NewIssueData } from '../hooks';
import { Badge, MetricMini, NotFound, formatDate, statusClass } from '../shared/ui';
import type { RepositorySummary } from './repository-model';
import type { CivicPR, Issue, IssueType, LawArticle, Territory } from '../types';

export function IssueList({ issues, onSelect }: { issues: Issue[]; onSelect: (issueId: string) => void }) {
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

export function IssueComposer({
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
          className="field"
        />
        {!compact && (
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={type}
              onChange={event => setType(event.target.value as IssueType)}
              className="field"
            >
              {ISSUE_TYPES.map(option => <option key={option}>{option}</option>)}
            </select>
            <select
              value={territory}
              onChange={event => setTerritory(event.target.value)}
              className="field"
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
            className="field"
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
          className="field"
        />
        <textarea
          value={description}
          onChange={event => setDescription(event.target.value)}
          placeholder="Descreva o problema, lacuna ou pedido"
          rows={compact ? 3 : 5}
          className="field resize-none"
        />
        <button className="btn-primary w-full">
          Registrar issue
        </button>
      </div>
    </form>
  );
}

export function IssueDetailPage({
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
        <button onClick={() => onUpvote(issue.id)} className="btn-primary mt-5">
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
              className="field min-w-0 flex-1"
            />
            <button className="btn-primary btn-sm shrink-0">Enviar</button>
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
