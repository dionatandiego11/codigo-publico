/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Badge, Metric, PageTitle, statusClass } from '../shared/ui';
import type { CitizenDashboardData, Territory } from '../types';

export function CitizenArea({
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
  profile: CitizenDashboardData;
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
        <button onClick={onLogin} className="btn-primary">
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
