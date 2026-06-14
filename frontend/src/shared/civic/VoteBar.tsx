/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface VoteBarProps {
  approve: number;
  reject: number;
  abstain?: number;
  quorumReached?: number;
  quorumNeeded?: number;
  className?: string;
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function percent(value: number, total: number) {
  return total > 0 ? Math.max(0, Math.min(100, (value / total) * 100)) : 0;
}

export function VoteBar({
  approve,
  reject,
  abstain = 0,
  quorumReached,
  quorumNeeded,
  className = ''
}: VoteBarProps) {
  const totalVotes = approve + reject + abstain;
  const reached = quorumReached ?? totalVotes;
  const needed = quorumNeeded ?? totalVotes;
  const quorumPercent = percent(reached, needed);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="grid grid-cols-3 gap-2 text-center">
        <VoteMetric label="Aprovo" value={approve} className="text-[var(--color-git-green)]" />
        <VoteMetric label="Rejeito" value={reject} className="text-[var(--color-git-red)]" />
        <VoteMetric label="Abstenção" value={abstain} className="text-[var(--color-git-text2)]" />
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between font-mono text-[10px] font-bold uppercase text-[var(--color-git-muted)]">
          <span>Resultado parcial</span>
          <span>{formatNumber(totalVotes)} votos</span>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.05)] border border-[var(--color-git-border2)]">
          <div className="bg-[var(--color-git-green)] transition-all shadow-[0_0_10px_rgba(52,211,153,0.5)]" style={{ width: `${percent(approve, totalVotes)}%` }} />
          <div className="bg-[var(--color-git-muted)] transition-all" style={{ width: `${percent(abstain, totalVotes)}%` }} />
          <div className="bg-[var(--color-git-red)] transition-all shadow-[0_0_10px_rgba(244,63,94,0.5)]" style={{ width: `${percent(reject, totalVotes)}%` }} />
        </div>
      </div>

      {needed > 0 && (
        <div>
          <div className="mb-1 flex items-center justify-between font-mono text-[10px] font-bold uppercase text-[var(--color-git-muted)]">
            <span>Quórum</span>
            <span>{formatNumber(reached)}/{formatNumber(needed)} · {Math.round(quorumPercent)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.05)] border border-[var(--color-git-border2)]">
            <div className="h-full rounded-full bg-[var(--color-git-blue)] transition-all shadow-[0_0_10px_rgba(56,189,248,0.5)]" style={{ width: `${quorumPercent}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

function VoteMetric({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.02)] p-2">
      <p className={`text-lg font-bold leading-none ${className}`}>{formatNumber(value)}</p>
      <p className="mt-1 font-mono text-[9px] font-bold uppercase text-[var(--color-git-muted)]">{label}</p>
    </div>
  );
}
