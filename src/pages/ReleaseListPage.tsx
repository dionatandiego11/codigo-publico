/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Badge, formatDate } from '../shared/ui';
import type { Release } from '../types';

export function ReleaseList({ releases, onSelectPR }: { releases: Release[]; onSelectPR: (prId: string) => void }) {
  return (
    <div className="glass-panel rounded-[20px] overflow-hidden">
      <div className="border-b border-[var(--color-git-border)] bg-[rgba(255,255,255,0.02)] p-4">
        <h2 className="font-display text-lg font-bold text-white">Releases legislativas</h2>
      </div>
      <div className="divide-y divide-[var(--color-git-border)]">
        {releases.length === 0 && <p className="p-6 text-sm text-[var(--color-git-muted)]">Nenhuma release publicada nesse repositório.</p>}
        {releases.map(release => (
          <div key={release.id} className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="chip-purple">{release.id}</Badge>
              <span className="text-[11px] text-[var(--color-git-muted)] font-bold">{formatDate(release.date)}</span>
            </div>
            <h3 className="mt-3 font-display text-lg font-bold text-white">{release.title}</h3>
            <ul className="mt-3 space-y-1 text-sm text-[var(--color-git-muted)]">
              {release.changelog.map(item => <li key={item}>• {item}</li>)}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              {release.incorporatedPRIds.map(prId => (
                <button key={prId} onClick={() => onSelectPR(prId)} className="btn-secondary btn-sm">
                  {prId}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
