/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vote } from 'lucide-react';
import { Badge, formatDate, statusClass } from '../shared/ui';
import type { BudgetProposal, OPVoting } from '../types';

export function OPProposalList({
  proposals,
  votings = [],
  onOpenVoting,
  onSelectVoting
}: {
  proposals: BudgetProposal[];
  votings?: OPVoting[];
  onOpenVoting?: (proposal: BudgetProposal) => void;
  onSelectVoting?: (votingId: string) => void;
}) {
  return (
    <div className="glass-panel rounded-[20px] overflow-hidden">
      <div className="border-b border-[var(--color-git-border)] bg-[rgba(255,255,255,0.02)] p-4">
        <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-[var(--color-git-blue)]">
          Propostas do OP
        </p>
        <h2 className="mt-1 font-display text-lg font-bold text-white">Aptas para votação</h2>
      </div>

      <div className="divide-y divide-[var(--color-git-border)]">
        {proposals.length === 0 && (
          <p className="p-6 text-sm leading-6 text-[var(--color-git-muted)]">
            Nenhuma proposta criada a partir das demandas maduras.
          </p>
        )}

        {proposals.map(proposal => {
          const voting = votings.find(item => item.proposalId === proposal.id);

          return (
            <article key={proposal.id} className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] font-bold text-[var(--color-git-muted)]">{proposal.id}</span>
                <Badge className={statusClass(proposal.status)}>{proposal.status}</Badge>
                <Badge className="chip-blue">{proposal.territoryName}</Badge>
                {voting && <Badge className={statusClass(voting.status)}>{voting.id}</Badge>}
              </div>
              <h3 className="mt-2 text-sm font-bold text-white">{proposal.title}</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--color-git-muted)]">{proposal.solutionScope}</p>
              <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-[var(--color-git-muted)]">
                <span>{formatCurrency(proposal.estimatedCostCents)}</span>
                <span>{formatDate(proposal.createdAt)}</span>
              </div>
              <div className="mt-4 flex justify-end">
                {voting ? (
                  <button onClick={() => onSelectVoting?.(voting.id)} className="btn-secondary btn-sm">
                    <Vote className="h-4 w-4" />
                    Ver votação
                  </button>
                ) : (
                  proposal.status === 'Apta para votação' && onOpenVoting && (
                    <button onClick={() => onOpenVoting(proposal)} className="btn-primary btn-sm">
                      <Vote className="h-4 w-4" />
                      Abrir votação
                    </button>
                  )
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  }).format(cents / 100);
}
