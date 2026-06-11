/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, FileText, GitPullRequest, Link2, ShieldCheck } from 'lucide-react';
import type { NewCivicPRData } from '../../hooks';
import type { Issue, LawArticle, NormativeDiff } from '../../types';
import { DiffViewer } from './DiffViewer';

interface PRCreationWizardRepository {
  name: string;
  category: string;
  version?: string;
}

interface PRCreationWizardProps {
  repository: PRCreationWizardRepository;
  articles: LawArticle[];
  issues: Issue[];
  defaultArticleId?: string;
  compact?: boolean;
  onSubmit: (data: NewCivicPRData) => void;
}

const steps = [
  { id: 1, label: 'Alvo' },
  { id: 2, label: 'Texto' },
  { id: 3, label: 'Revisão' }
] as const;

function buildDiffLines(beforeText: string, afterText: string): NormativeDiff['lines'] {
  const before = beforeText.trim();
  const after = afterText.trim();

  if (!before) {
    return [{ type: 'added', content: after }];
  }

  if (before === after) {
    return [{ type: 'neutral', content: before }];
  }

  return [
    { type: 'removed', content: before },
    { type: 'added', content: after }
  ];
}

function fieldClass(extra = '') {
  return `field ${extra}`;
}

export function PRCreationWizard({
  repository,
  articles,
  issues,
  defaultArticleId = '',
  compact = false,
  onSubmit
}: PRCreationWizardProps) {
  const initialArticleId = defaultArticleId || articles[0]?.id || '';
  const [step, setStep] = useState(1);
  const [articleId, setArticleId] = useState(initialArticleId);
  const [linkedIssueId, setLinkedIssueId] = useState('');
  const [afterText, setAfterText] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [justification, setJustification] = useState('');

  const selectedArticle = articles.find(article => article.id === articleId) ?? articles[0];
  const beforeText = selectedArticle?.content ?? '';
  const articleLabel = selectedArticle
    ? `Art. ${selectedArticle.number} — ${selectedArticle.title}`
    : 'Documento geral';
  const hasTextChange = afterText.trim().length > 0 && afterText.trim() !== beforeText.trim();
  const canMoveFromTarget = articles.length === 0 || Boolean(selectedArticle);
  const canMoveFromText = hasTextChange;
  const canSubmit = canMoveFromText && title.trim().length > 0 && summary.trim().length > 0 && justification.trim().length > 0;

  const diffPreview = useMemo(
    () => buildDiffLines(beforeText || 'Texto vigente não carregado.', afterText),
    [afterText, beforeText]
  );

  useEffect(() => {
    const nextArticleId = defaultArticleId || articles[0]?.id || '';
    const nextArticle = articles.find(article => article.id === nextArticleId) ?? articles[0];

    setArticleId(nextArticleId);
    setAfterText(nextArticle?.content ?? '');
  }, [articles, defaultArticleId]);

  const selectArticle = (nextArticleId: string) => {
    setArticleId(nextArticleId);
    const nextArticle = articles.find(article => article.id === nextArticleId);
    setAfterText(nextArticle?.content ?? '');
  };

  const resetForm = () => {
    const nextArticleId = defaultArticleId || articles[0]?.id || '';
    const nextArticle = articles.find(article => article.id === nextArticleId) ?? articles[0];

    setStep(1);
    setArticleId(nextArticleId);
    setLinkedIssueId('');
    setAfterText(nextArticle?.content ?? '');
    setTitle('');
    setSummary('');
    setJustification('');
  };

  const submit = () => {
    if (!canSubmit) return;

    const normativeDiff: NormativeDiff = {
      articleNumber: selectedArticle?.number ?? 1,
      titleRef: articleLabel,
      beforeText: beforeText || 'Texto vigente não carregado.',
      afterText: afterText.trim(),
      rationale: justification.trim(),
      lines: diffPreview
    };

    onSubmit({
      title: title.trim(),
      repository: repository.name,
      targetTitle: selectedArticle?.chapter ?? repository.name,
      affectedArticles: selectedArticle ? `Artigo ${selectedArticle.number}` : 'Documento geral',
      authorName: '',
      authorType: 'Iniciativa Popular',
      citizenSummary: summary.trim(),
      justification: justification.trim(),
      diffs: [normativeDiff],
      linkedIssueIds: linkedIssueId ? [linkedIssueId] : []
    });

    resetForm();
  };

  const nextStep = () => {
    if (step === 1 && !canMoveFromTarget) return;
    if (step === 2 && !canMoveFromText) return;
    setStep(current => Math.min(3, current + 1));
  };

  const previousStep = () => setStep(current => Math.max(1, current - 1));

  return (
    <section className="glass-panel p-4 rounded-[20px]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <GitPullRequest className="h-4 w-4 text-[var(--color-git-blue)] icon-glow-blue" />
            <h3 className="font-display text-base font-bold text-white">Novo PR cívico</h3>
          </div>
          <p className="mt-1 text-xs leading-5 text-[var(--color-git-muted)]">
            {compact ? 'Transforme este artigo em uma proposta de alteração.' : 'Crie uma alteração normativa com alvo, diff e justificativa.'}
          </p>
        </div>
        <span className="shrink-0 rounded border border-[var(--color-git-border)] bg-[rgba(255,255,255,0.03)] px-2 py-1 font-mono text-[10px] font-bold uppercase text-[var(--color-git-text2)]">
          {repository.category}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {steps.map(item => {
          const active = step === item.id;
          const completed = step > item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setStep(item.id)}
              className={`flex items-center justify-center gap-1 rounded-xl border px-2 py-2 text-xs font-semibold transition ${
                active
                  ? 'border-[var(--color-git-blue)] bg-[rgba(56,189,248,0.1)] text-[var(--color-git-blue)] shadow-[0_0_10px_rgba(56,189,248,0.2)]'
                  : completed
                    ? 'border-[var(--color-git-green)] bg-[rgba(52,211,153,0.1)] text-[var(--color-git-green)] shadow-[0_0_10px_rgba(52,211,153,0.1)]'
                    : 'border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.02)] text-[var(--color-git-muted)] hover:border-[var(--color-git-border)]'
              }`}
            >
              {completed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="font-mono">{item.id}</span>}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {step === 1 && (
          <div className="space-y-3">
            <div className="rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.02)] p-3">
              <p className="font-mono text-[10px] font-bold uppercase text-[var(--color-git-blue)]">Repositório</p>
              <p className="mt-1 text-sm font-bold text-white">{repository.name}</p>
              {repository.version && <p className="mt-1 text-xs text-[var(--color-git-muted)]">{repository.version}</p>}
            </div>

            {articles.length > 0 && (
              <label className="block space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-git-text2)]">Artigo alvo</span>
                <select
                  value={selectedArticle?.id ?? ''}
                  onChange={event => selectArticle(event.target.value)}
                  className={fieldClass()}
                >
                  {articles.map(article => (
                    <option key={article.id} value={article.id}>Art. {article.number} — {article.title}</option>
                  ))}
                </select>
              </label>
            )}

            {issues.length > 0 && (
              <label className="block space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-git-text2)]">Issue vinculada</span>
                <select
                  value={linkedIssueId}
                  onChange={event => setLinkedIssueId(event.target.value)}
                  className={fieldClass()}
                >
                  <option value="">Sem issue vinculada</option>
                  {issues.map(issue => <option key={issue.id} value={issue.id}>{issue.id} — {issue.title}</option>)}
                </select>
              </label>
            )}

            <div className="flex items-start gap-2 rounded-xl border border-[rgba(56,189,248,0.3)] bg-[rgba(56,189,248,0.05)] p-3 text-xs leading-5 text-[var(--color-git-blue)]">
              <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-git-blue)] icon-glow-blue" />
              <p>O PR nasce vinculado a um repositório normativo e, quando possível, a uma issue pública ou normativa.</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.02)] p-3">
              <span>
                <span className="block font-mono text-[10px] font-bold uppercase text-[var(--color-git-blue)]">Alterando</span>
                <span className="mt-1 block text-sm font-bold text-white">{articleLabel}</span>
              </span>
              <FileText className="h-5 w-5 text-[var(--color-git-muted)]" />
            </div>

            <DiffViewer
              title={articleLabel}
              subtitle="prévia"
              lines={diffPreview}
              maxHeightClassName="max-h-56"
            />

            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-git-text2)]">Texto proposto</span>
              <textarea
                value={afterText}
                onChange={event => setAfterText(event.target.value)}
                rows={compact ? 7 : 9}
                className={fieldClass('resize-none font-mono text-xs leading-5')}
              />
            </label>

            {!hasTextChange && (
              <p className="rounded-xl border border-[rgba(250,204,21,0.3)] bg-[rgba(250,204,21,0.05)] px-3 py-2 text-xs leading-5 text-[var(--color-git-amber)]">
                Altere o texto vigente para gerar um diff normativo antes de avançar.
              </p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-git-text2)]">Título do PR</span>
              <input
                value={title}
                onChange={event => setTitle(event.target.value)}
                placeholder="Ex.: Inserir mecanismo de democracia direta digital"
                className={fieldClass()}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-git-text2)]">Resumo cidadão</span>
              <textarea
                value={summary}
                onChange={event => setSummary(event.target.value)}
                placeholder="Explique em linguagem simples o que muda para a população."
                rows={compact ? 3 : 4}
                className={fieldClass('resize-none leading-6')}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-git-text2)]">Justificativa</span>
              <textarea
                value={justification}
                onChange={event => setJustification(event.target.value)}
                placeholder="Descreva o problema público, a lacuna normativa e o efeito esperado."
                rows={compact ? 3 : 4}
                className={fieldClass('resize-none leading-6')}
              />
            </label>

            <div className="rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.02)] p-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[var(--color-git-muted)]" />
                <p className="text-sm font-bold text-white">Pré-checagem institucional</p>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-[var(--color-git-text2)]">
                <CheckRow ok={canMoveFromText} label="Diff normativo gerado" />
                <CheckRow ok={summary.trim().length > 0} label="Resumo cidadão informado" />
                <CheckRow ok={justification.trim().length > 0} label="Justificativa registrada" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        {step > 1 && (
          <button type="button" onClick={previousStep} className="btn-secondary">
            Voltar
          </button>
        )}
        {step < 3 ? (
          <button
            type="button"
            onClick={nextStep}
            disabled={(step === 1 && !canMoveFromTarget) || (step === 2 && !canMoveFromText)}
            className="btn-primary flex-1"
          >
            Próximo
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button type="button" onClick={submit} disabled={!canSubmit} className="btn-primary flex-1">
            Protocolar PR
            <GitPullRequest className="h-4 w-4" />
          </button>
        )}
      </div>
    </section>
  );
}

function CheckRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.01)] px-3 py-2">
      <span>{label}</span>
      <span className={`font-mono text-[10px] font-bold uppercase ${ok ? 'text-[var(--color-git-green)]' : 'text-[var(--color-git-muted)]'}`}>
        {ok ? 'ok' : 'pendente'}
      </span>
    </div>
  );
}
