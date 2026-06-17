/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { VOTE_SELECTIONS } from '../contracts/civic';
import type { VoteSelection } from '../hooks';
import { canResolveVoting, canVote, type OPActionContext } from '../lib/op-permissions';
import { VoteBar } from '../shared/civic';
import { Badge, formatDate, PageTitle, statusClass } from '../shared/ui';
import type { CivicPR, OPVoting, Voting } from '../types';

export function VotingCenter({
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
                {linkedPR && (
                  <button onClick={() => onSelectPR(linkedPR.id)} className="btn-primary btn-sm ml-auto">
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

export function OPVotingCenter({
  votings,
  onVote,
  onResolve,
  actionContext
}: {
  votings: OPVoting[];
  onVote: (votingId: string, selection: VoteSelection) => void;
  onResolve: (votingId: string) => void;
  actionContext: OPActionContext;
}) {
  return (
    <div className="space-y-6 fade-in">
      <PageTitle
        eyebrow="Orçamento Participativo"
        title="Votações territoriais"
        subtitle="Propostas maduras entram em votação no território antes de compor a matriz municipal do OP."
      />

      <div className="grid gap-4">
        {votings.length === 0 && (
          <div className="glass-panel p-8 text-center text-sm text-[var(--color-git-muted)] rounded-[20px]">
            Nenhuma proposta do OP está em votação.
          </div>
        )}

        {votings.map(voting => {
          const voteGate = canVote(actionContext, voting);
          const resolveGate = canResolveVoting(actionContext, voting);
          const outcome = voting.status === 'Encerrada' ? votingOutcome(voting) : null;

          return (
            <article key={voting.id} className="glass-panel hover-glow p-5 rounded-[20px]">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={statusClass(voting.status)}>{voting.status}</Badge>
                <Badge className="chip-purple">{voting.id}</Badge>
                <Badge className="chip-blue">{voting.territoryName}</Badge>
              </div>
              <h2 className="mt-3 font-display text-xl font-bold text-white">{voting.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-git-muted)]">{voting.summary}</p>
              <p className="mt-3 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--color-git-muted)]">
                Prazo: {formatDate(voting.deadline)}
              </p>

              <VoteBar
                className="mt-4"
                approve={voting.votesYes}
                reject={voting.votesNo}
                abstain={voting.votesAbstain}
                quorumReached={voting.quorumReached}
                quorumNeeded={voting.quorumNeeded}
              />

              {outcome && (
                <div className={`mt-4 rounded-xl border p-3 ${outcome.className}`}>
                  <p className="flex items-center gap-2 text-sm font-bold">
                    <CheckCircle2 className="h-4 w-4" />
                    {outcome.title}
                  </p>
                  <p className="mt-1 text-xs leading-5 opacity-80">{outcome.description}</p>
                </div>
              )}

              {voting.voteReceipt ? (
                <p className="mt-4 rounded-xl border border-[var(--color-git-border2)] bg-white/[0.03] p-3 font-mono text-[10px] text-[var(--color-git-muted)]">
                  Recibo: <span className="text-[var(--color-git-green)]">{voting.voteReceipt}</span>
                </p>
              ) : (
                <>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {VOTE_SELECTIONS.map(selection => (
                      <button
                        key={selection}
                        onClick={() => onVote(voting.id, selection)}
                        disabled={!voteGate.enabled}
                        title={voteGate.reason}
                        className="btn-secondary btn-sm justify-center disabled:opacity-45"
                      >
                        {selection}
                      </button>
                    ))}
                  </div>
                  {!voteGate.enabled && voteGate.reason && (
                    <p className="mt-3 rounded-lg border border-[rgba(251,191,36,0.18)] bg-[rgba(251,191,36,0.05)] px-3 py-2 text-xs leading-5 text-[var(--color-git-amber)]">
                      {voteGate.reason}
                    </p>
                  )}
                </>
              )}

              {voting.status === 'Aberta' && (
                <div className="mt-4 border-t border-[var(--color-git-border)] pt-4">
                  <button
                    onClick={() => onResolve(voting.id)}
                    disabled={!resolveGate.enabled}
                    title={resolveGate.reason}
                    className="btn-primary btn-sm w-full justify-center disabled:opacity-45"
                  >
                    Encerrar votação
                  </button>
                  {!resolveGate.enabled && resolveGate.reason && (
                    <p className="mt-2 text-xs leading-5 text-[var(--color-git-muted)]">
                      {resolveGate.reason}
                    </p>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function votingOutcome(voting: OPVoting) {
  const approved = voting.quorumReached >= voting.quorumNeeded && voting.votesYes > voting.votesNo;
  if (approved) {
    return {
      title: 'Proposta priorizada',
      description: 'Quórum atingido e maioria favorável. A proposta segue para consolidação municipal.',
      className: 'border-[rgba(52,211,153,0.2)] bg-[rgba(52,211,153,0.06)] text-[var(--color-git-green)]'
    };
  }

  return {
    title: 'Retornada para maturação',
    description: 'A votação não atingiu os critérios de priorização. A proposta volta para amadurecimento territorial.',
    className: 'border-[rgba(251,191,36,0.22)] bg-[rgba(251,191,36,0.06)] text-[var(--color-git-amber)]'
  };
}
