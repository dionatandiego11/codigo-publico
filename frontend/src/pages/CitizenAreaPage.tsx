/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Badge, PageTitle } from '../shared/ui';
import { TerritoryBondCard } from './TerritoryBondView';
import type { CitizenDashboardData, Territory } from '../types';

export function CitizenArea({
  isAuthenticated,
  onLogin,
  profile,
  territories,
  onSelectVoting
}: {
  isAuthenticated: boolean;
  onLogin: () => void;
  profile: CitizenDashboardData;
  territories: Territory[];
  onSelectVoting: (votingId: string) => void;
}) {
  const territory = territories.find(item => item.id === profile.territoryId);
  const hasRegisteredTerritory = Boolean(profile.territoryId || profile.territoryName || territory);

  return (
    <div className="space-y-6 fade-in">
      <PageTitle
        eyebrow="Conta cidadã"
        title={isAuthenticated ? profile.name : 'Minha Área'}
        subtitle={isAuthenticated ? `${profile.citizenId} • ${profile.email || 'sem e-mail'}` : 'Entre para ver seu território, apoios, votos e recibos.'}
      />
      {!isAuthenticated && (
        <button onClick={onLogin} className="btn-primary">
          Entrar ou cadastrar cidadão
        </button>
      )}

      {isAuthenticated && !hasRegisteredTerritory && <TerritoryBondCard territories={territories} />}

      <div className="glass-panel p-5 rounded-[20px]">
        <h3 className="font-mono text-xs font-bold text-[var(--color-git-muted)] uppercase tracking-wider mb-2">Território</h3>
        <p className="font-display text-2xl font-bold text-white mb-6">{profile.territoryName ?? territory?.name ?? 'não informado'}</p>
        <div className="grid grid-cols-2 gap-4 border-t border-[var(--color-git-border2)] pt-4">
          <div>
            <p className="text-xs font-mono text-[var(--color-git-muted)] mb-1">votos</p>
            <p className="font-display text-xl font-bold text-white">{profile.votedList.length}</p>
          </div>
          <div>
            <p className="text-xs font-mono text-[var(--color-git-muted)] mb-1">território</p>
            <p className="font-display text-xl font-bold text-white">{hasRegisteredTerritory ? 'vinculado' : '—'}</p>
          </div>
        </div>
      </div>

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
  );
}
