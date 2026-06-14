/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, CheckCircle2, Circle, Clock, GitBranch, GitFork, ShieldCheck } from 'lucide-react';
import { VOTE_SELECTIONS } from '../contracts/civic';
import type { VoteSelection } from '../hooks';
import { CIStatus, DiffViewer, VoteBar } from '../shared/civic';
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
  prs,
  issues,
  voting,
  onBack,
  onSelectIssue,
  onSelectPR,
  onVote,
  onUpvote: _onUpvote,
  onComment
}: {
  pr?: CivicPR;
  prs: CivicPR[];
  issues: Issue[];
  voting?: Voting;
  onBack: () => void;
  onSelectIssue: (issueId: string) => void;
  onSelectPR: (prId: string) => void;
  onVote: (votingId: string, selection: VoteSelection) => void;
  onUpvote: (prId: string) => void;
  onComment: (prId: string, content: string) => void;
}) {
  const [comment, setComment] = useState('');
  const [forkDismissed, setForkDismissed] = useState(false);

  if (!pr) {
    return <NotFound title="PR não encontrado" onBack={onBack} />;
  }

  const linkedIssues = issues.filter(issue => pr.linkedIssueIds.includes(issue.id));
  const competingForks = prs.filter(p => p.forkedFromId === pr.id);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!comment.trim()) return;
    onComment(pr.id, comment.trim());
    setComment('');
  };

  const deadlineLabel = voting?.deadline
    ? new Date(voting.deadline).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="space-y-6 fade-in">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-git-text2)] hover:text-white transition">
        <ArrowRight className="h-4 w-4 rotate-180" />
        Voltar
      </button>

      {/* ── Cabeçalho do PR ── */}
      <section className="glass-panel p-6 rounded-[20px]">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="chip-purple">{pr.id}</Badge>
          <Badge className={statusClass(pr.status)}>{pr.status}</Badge>
          <Badge className="chip-blue">{pr.repository}</Badge>
          {pr.authorType && (
            <Badge className="chip-amber">{pr.authorType}</Badge>
          )}
          <button
            onClick={() => setForkDismissed(false)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-xs font-bold text-[var(--color-git-text2)] transition hover:border-[var(--color-git-blue)] hover:text-white"
          >
            <GitFork className="h-3.5 w-3.5" />
            Fork
          </button>
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold text-white">{pr.title}</h1>
        <p className="mt-3 text-sm leading-7 text-[var(--color-git-muted)]">{pr.citizenSummary}</p>

        {/* Justificativa */}
        {pr.justification && (
          <div className="mt-4 rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.02)] p-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--color-git-muted)] mb-2">Justificativa</p>
            <p className="text-sm leading-6 text-[var(--color-git-text2)]">{pr.justification}</p>
          </div>
        )}

        {/* Metadados: artigos afetados e autor */}
        <div className="mt-4 flex flex-wrap gap-4 border-t border-[var(--color-git-border2)] pt-4">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase text-[var(--color-git-muted)]">Artigos afetados</p>
            <p className="mt-0.5 text-xs text-white">{pr.affectedArticles}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] font-bold uppercase text-[var(--color-git-muted)]">Autor</p>
            <p className="mt-0.5 text-xs text-white">{pr.authorName}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] font-bold uppercase text-[var(--color-git-muted)]">Protocolado em</p>
            <p className="mt-0.5 text-xs text-white">
              {new Date(pr.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
      </section>

      {/* ── Painel de Votação Inline ── */}
      {voting && (
        <section className="glass-panel p-5 rounded-[20px] border border-[rgba(56,189,248,0.2)] shadow-[0_0_30px_rgba(56,189,248,0.06)]">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--color-git-blue)]">Consulta popular</p>
              <h2 className="mt-1 font-display text-base font-bold text-white">{voting.title}</h2>
            </div>
            <Badge className={statusClass(voting.status)}>{voting.status}</Badge>
          </div>

          <VoteBar
            approve={voting.votesYes}
            reject={voting.votesNo}
            abstain={voting.votesAbstain}
            quorumReached={voting.quorumReached}
            quorumNeeded={voting.quorumNeeded}
          />

          {deadlineLabel && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-[var(--color-git-muted)]">
              <Clock className="h-3.5 w-3.5" />
              <span>Prazo: <span className="font-semibold text-[var(--color-git-text2)]">{deadlineLabel}</span></span>
            </div>
          )}

          <div className="mt-4 border-t border-[var(--color-git-border2)] pt-4">
            {voting.hasVoted ? (
              <div className="rounded-xl border border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.06)] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="h-4 w-4 text-[var(--color-git-green)]" />
                  <p className="text-sm font-bold text-[var(--color-git-green)]">Voto registrado</p>
                </div>
                {voting.userVoteSelection && (
                  <p className="text-sm text-white">
                    Você votou: <span className="font-bold">{voting.userVoteSelection}</span>
                  </p>
                )}
                {voting.voteReceipt && (
                  <p className="mt-2 font-mono text-xs text-[var(--color-git-muted)]">
                    Recibo: <span className="text-[var(--color-git-text2)]">{voting.voteReceipt}</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <p className="w-full font-mono text-[10px] font-bold uppercase text-[var(--color-git-muted)] mb-1">Registrar voto</p>
                {VOTE_SELECTIONS.map(selection => (
                  <button
                    key={selection}
                    onClick={() => onVote(voting.id, selection)}
                    className="btn-secondary btn-sm"
                  >
                    {selection}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        {/* ── Coluna principal ── */}
        <div className="space-y-6">
          {/* Diff normativo */}
          <section className="glass-panel p-5 rounded-[20px]">
            <h2 className="font-display text-lg font-bold text-white">Diff normativo</h2>
            <div className="mt-4 space-y-4">
              {pr.diffs.length === 0 && <p className="text-sm text-[var(--color-git-muted)]">PR sem diff carregado.</p>}
              {pr.diffs.map(diff => (
                <DiffViewer key={`${diff.articleNumber}-${diff.titleRef}`} diff={diff} />
              ))}
            </div>
          </section>



          {/* Linha do tempo (Merge Timeline) */}
          {pr.mergeTimeline.length > 0 && (
            <section className="glass-panel p-5 rounded-[20px]">
              <h2 className="font-display text-lg font-bold text-white">Linha do tempo</h2>
              <ol className="mt-5 space-y-0">
                {pr.mergeTimeline.map((step, index) => {
                  const isLast = index === pr.mergeTimeline.length - 1;
                  return (
                    <li key={step.title} className="relative flex gap-4">
                      {/* Linha vertical conectora */}
                      {!isLast && (
                        <div className="absolute left-[11px] top-6 bottom-0 w-px bg-[var(--color-git-border2)]" />
                      )}
                      {/* Ícone */}
                      <div className="relative z-10 mt-0.5 shrink-0">
                        {step.completed ? (
                          <CheckCircle2 className="h-6 w-6 text-[var(--color-git-green)]" />
                        ) : (
                          <Circle className="h-6 w-6 text-[var(--color-git-border2)]" />
                        )}
                      </div>
                      {/* Conteúdo */}
                      <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className={`text-sm font-bold ${step.completed ? 'text-white' : 'text-[var(--color-git-muted)]'}`}>
                            {step.title}
                          </p>
                          <span className="font-mono text-[10px] text-[var(--color-git-muted)]">{step.date}</span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-[var(--color-git-muted)]">{step.description}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}
        </div>

        {/* ── Sidebar ── */}
        <aside className="space-y-6">
          {/* Pareceres (Reviews) — card expandido */}
          {pr.reviews.length > 0 && (
            <section className="glass-panel p-5 rounded-[20px]">
              <h2 className="font-display text-base font-bold text-white">Pareceres</h2>
              <div className="mt-4 space-y-3">
                {pr.reviews.map(review => {
                  const isApproved = review.status === 'Aprovado';
                  const isRejected = ['Reprovado', 'Rejeitado'].includes(review.status);
                  const borderColor = isApproved
                    ? 'border-[rgba(52,211,153,0.25)] bg-[rgba(52,211,153,0.04)]'
                    : isRejected
                      ? 'border-[rgba(244,63,94,0.25)] bg-[rgba(244,63,94,0.04)]'
                      : 'border-[rgba(250,204,21,0.25)] bg-[rgba(250,204,21,0.04)]';
                  const badgeColor = isApproved
                    ? 'border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.1)] text-[var(--color-git-green)]'
                    : isRejected
                      ? 'border-[rgba(244,63,94,0.3)] bg-[rgba(244,63,94,0.1)] text-[var(--color-git-red)]'
                      : 'border-[rgba(250,204,21,0.3)] bg-[rgba(250,204,21,0.1)] text-[var(--color-git-amber)]';
                  const dateLabel = review.createdAt
                    ? new Date(review.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
                    : null;
                  return (
                    <div key={review.id} className={`rounded-xl border p-4 ${borderColor}`}>
                      {/* Cabeçalho: papel + status */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0">
                          <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--color-git-muted)]">{review.reviewerRole}</p>
                          <p className="mt-0.5 text-sm font-bold text-white leading-snug">{review.reviewerName}</p>
                          {dateLabel && <p className="mt-0.5 font-mono text-[10px] text-[var(--color-git-muted)]">{dateLabel}</p>}
                        </div>
                        <span className={`shrink-0 rounded border px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${badgeColor}`}>
                          {review.status}
                        </span>
                      </div>
                      {/* Conclusão */}
                      {review.conclusion && (
                        <div className="mb-2">
                          <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--color-git-muted)] mb-1">Conclusão</p>
                          <p className="text-xs leading-5 text-[var(--color-git-text2)]">{review.conclusion}</p>
                        </div>
                      )}
                      {/* Feedback */}
                      {review.feedback && review.feedback !== review.conclusion && (
                        <div className="border-t border-[rgba(255,255,255,0.05)] pt-2">
                          <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--color-git-muted)] mb-1">Encaminhamento</p>
                          <p className="text-xs leading-5 text-[var(--color-git-muted)] italic">{review.feedback}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Forks Concorrentes */}
          {competingForks.length > 0 && (
            <section className="glass-panel p-5 rounded-[20px] border border-[rgba(192,132,252,0.15)]">
              <div className="flex items-center gap-2 mb-4">
                <GitFork className="h-4 w-4 text-[var(--color-git-purple,#a78bfa)]" />
                <h2 className="font-display text-base font-bold text-white">Forks concorrentes</h2>
                <span className="ml-auto rounded-full border border-[rgba(192,132,252,0.3)] bg-[rgba(192,132,252,0.1)] px-2 py-0.5 font-mono text-[10px] font-bold text-[#a78bfa]">{competingForks.length}</span>
              </div>
              <p className="text-xs leading-5 text-[var(--color-git-muted)] mb-4">Variações independentes desta proposta em tramitação paralela. A Câmara decide qual versão incorporar ao texto oficial.</p>
              <div className="space-y-3">
                {competingForks.map(fork => (
                  <button
                    key={fork.id}
                    onClick={() => onSelectPR(fork.id)}
                    className="w-full rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.02)] p-4 text-left transition hover:border-[rgba(192,132,252,0.4)] hover:bg-[rgba(192,132,252,0.04)] group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-mono text-[10px] font-bold text-[#a78bfa]">{fork.id}</span>
                      <Badge className={statusClass(fork.status)}>{fork.status}</Badge>
                    </div>
                    <p className="text-xs font-bold text-white leading-snug mb-1 group-hover:text-[#c4b5fd] transition">{fork.title}</p>
                    <p className="text-[11px] leading-4 text-[var(--color-git-muted)] line-clamp-2">{fork.citizenSummary}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="font-mono text-[10px] text-[var(--color-git-muted)]">{fork.authorName}</span>
                      <span className="font-mono text-[10px] text-[var(--color-git-muted)] ml-auto">↑ {fork.upvotes} apoios</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Painel Fork */}
          {!forkDismissed && (
            <section className="glass-panel p-5 rounded-[20px] border border-[rgba(192,132,252,0.2)] shadow-[0_0_24px_rgba(192,132,252,0.05)]">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <GitFork className="h-4 w-4 text-[var(--color-git-purple,#a78bfa)]" />
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--color-git-muted)]">Fork cívico</p>
                </div>
                <button onClick={() => setForkDismissed(true)} className="text-[var(--color-git-muted)] hover:text-white text-xs transition">✕</button>
              </div>
              <p className="text-sm font-bold text-white mb-1">Propor variação desta proposta</p>
              <p className="text-xs leading-5 text-[var(--color-git-muted)] mb-4">
                Discorda de algum ponto mas acredita na ideia central? Crie um fork — uma variação independente desta proposta com suas alterações, mantendo o vínculo com o PR original.
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-[var(--color-git-muted)] shrink-0" />
                  <p className="text-xs text-[var(--color-git-text2)]">Sua variação tramita em paralelo e pode ser comparada com a original</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-[var(--color-git-muted)] shrink-0" />
                  <p className="text-xs text-[var(--color-git-text2)]">O PR original permanece inalterado e visível pelo link de origem</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-[var(--color-git-muted)] shrink-0" />
                  <p className="text-xs text-[var(--color-git-text2)]">Qualquer cidadão pode votar nos dois e a Câmara decide qual incorporar</p>
                </div>
              </div>
              <button className="w-full btn-secondary btn-sm flex items-center justify-center gap-2">
                <GitFork className="h-3.5 w-3.5" />
                Iniciar fork de {pr.id}
              </button>
            </section>
          )}

          {/* Verificações Institucionais (Checks) */}
          {pr.checks.length > 0 && (
            <section className="glass-panel p-5 rounded-[20px]">
              <h2 className="font-display text-base font-bold text-white">Verificações institucionais</h2>
              <div className="mt-4 space-y-2">
                {pr.checks.map(check => (
                  <CIStatus
                    key={check.id}
                    label={check.name}
                    status={check.status}
                    description={check.feedback || check.description}
                  />
                ))}
              </div>
            </section>
          )}

          {pr.reviews.length === 0 && pr.checks.length === 0 && (
            <section className="glass-panel p-5 rounded-[20px]">
              <h2 className="font-display text-base font-bold text-white">Revisões</h2>
              <p className="mt-4 rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.02)] p-3 text-sm text-[var(--color-git-muted)]">
                Nenhum parecer ou verificação publicado.
              </p>
            </section>
          )}

          {/* Issues vinculadas */}
          <section className="glass-panel p-5 rounded-[20px]">
            <h2 className="font-display text-base font-bold text-white">Issues vinculadas</h2>
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

