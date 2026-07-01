/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Badge, PageTitle, PercentBar, statusClass } from '../shared/ui';
import type { ExecutionTracker } from '../types';

export function ExecutionCenter({
  trackers
}: {
  trackers: ExecutionTracker[];
}) {
  return (
    <div className="space-y-6 fade-in">
      <PageTitle
        eyebrow="Pós-release"
        title="Fiscalização da execução"
        subtitle="Depois da consolidação e inclusão na matriz do OP, a plataforma acompanha o andamento, orçamento e entregas públicas."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {trackers.length === 0 && <p className="glass-panel p-6 text-sm text-[var(--color-git-muted)] rounded-[20px]">Nenhuma execução vinculada.</p>}
        {trackers.map(tracker => {
          return (
            <div key={tracker.id} className="glass-panel p-5 rounded-[20px]">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={statusClass(tracker.status)}>{tracker.status}</Badge>
              </div>
              <h2 className="mt-3 font-display text-lg font-bold text-white">{tracker.title}</h2>
              <p className="mt-2 text-sm text-[var(--color-git-muted)]">{tracker.normReference}</p>
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs text-[var(--color-git-text2)]">
                  <span>{tracker.responsibleDepartment}</span>
                  <span>{tracker.progressPercentage}%</span>
                </div>
                <PercentBar value={tracker.progressPercentage} total={100} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-[var(--color-git-border2)] p-3">
                  <p className="font-mono text-[10px] font-bold uppercase text-[var(--color-git-muted)]">Dotação</p>
                  <p className="mt-1 text-sm font-semibold text-white">{tracker.budgetAllocated}</p>
                </div>
                <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-[var(--color-git-border2)] p-3">
                  <p className="font-mono text-[10px] font-bold uppercase text-[var(--color-git-muted)]">Executado</p>
                  <p className="mt-1 text-sm font-semibold text-white">{tracker.budgetSpent}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
