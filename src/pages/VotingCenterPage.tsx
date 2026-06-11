/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrowRight } from 'lucide-react';
import { VOTE_SELECTIONS } from '../contracts/civic';
import type { VoteSelection } from '../hooks';
import { VoteBar } from '../shared/civic';
import { Badge, PageTitle, statusClass } from '../shared/ui';
import type { CivicPR, Voting } from '../types';

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
                {VOTE_SELECTIONS.map(selection => (
                  <button
                    key={selection}
                    onClick={() => onVote(voting.id, selection)}
                    disabled={voting.hasVoted}
                    className="btn-secondary btn-sm"
                  >
                    {selection}
                  </button>
                ))}
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
