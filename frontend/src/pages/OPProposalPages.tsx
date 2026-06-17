/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vote } from 'lucide-react';
import { canOpenVoting, type OPActionContext } from '../lib/op-permissions';
import { Badge, formatDate, statusClass } from '../shared/ui';
import type { BudgetProposal, OPVoting } from '../types';

export function OPProposalList({
  proposals,
  votings = [],
  onOpenVoting,
  onSelectVoting,
  onViewIncidents,
  actionContext
}: {
  proposals: BudgetProposal[];
  votings?: OPVoting[];
  onOpenVoting?: (proposal: BudgetProposal) => void;
  onSelectVoting?: (votingId: string) => void;
  onViewIncidents?: () => void;
  actionContext: OPActionContext;
}) {
  return (
    <div className="glass-panel rounded-[20px] overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--color-git-border)] bg-[rgba(255,255,255,0.02)] p-4">
        <div className="min-w-0">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-[var(--color-git-blue)]">
            Propostas do OP
          </p>
          <h2 className="mt-1 font-display text-lg font-bold text-white">Propostas territoriais</h2>
        </div>
        {onViewIncidents && (
          <button onClick={onViewIncidents} className="btn-secondary btn-sm shrink-0">
            Incidentes
          </button>
        )}
      </div>

      <div className="divide-y divide-[var(--color-git-border)]">
        {proposals.length === 0 && (
          <p className="p-6 text-sm leading-6 text-[var(--color-git-muted)]">
            Nenhuma proposta criada a partir das demandas maduras.
          </p>
        )}

        {proposals.map(proposal => {
          const voting = votings.find(item => item.proposalId === proposal.id);
          const openGate = canOpenVoting(actionContext, proposal);

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
                    <div className="text-right">
                      <button
                        onClick={() => onOpenVoting(proposal)}
                        disabled={!openGate.enabled}
                        title={openGate.reason}
                        className="btn-primary btn-sm disabled:opacity-45"
                      >
                        <Vote className="h-4 w-4" />
                        Abrir votação
                      </button>
                      {!openGate.enabled && openGate.reason && (
                        <p className="mt-2 max-w-48 text-right text-[10px] leading-4 text-[var(--color-git-amber)]">
                          {openGate.reason}
                        </p>
                      )}
                    </div>
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
