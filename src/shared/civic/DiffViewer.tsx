/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { DiffLine, NormativeDiff } from '../../types';

interface DiffViewerProps {
  diff?: NormativeDiff;
  lines?: DiffLine[];
  title?: string;
  subtitle?: string;
  maxHeightClassName?: string;
}

function buildLinesFromTexts(beforeText?: string, afterText?: string): DiffLine[] {
  const before = (beforeText ?? '').trim();
  const after = (afterText ?? '').trim();

  if (!before && after) return [{ type: 'added', content: after }];
  if (before && !after) return [{ type: 'removed', content: before }];
  if (before === after) return [{ type: 'neutral', content: before || 'Sem alteração textual.' }];

  return [
    { type: 'removed', content: before },
    { type: 'added', content: after }
  ];
}

function lineClass(type: DiffLine['type']) {
  if (type === 'added') return 'bg-emerald-950/40 text-emerald-100';
  if (type === 'removed') return 'bg-rose-950/40 text-rose-100';
  return 'text-slate-300';
}

function marker(type: DiffLine['type']) {
  if (type === 'added') return '+';
  if (type === 'removed') return '-';
  return ' ';
}

export function DiffViewer({
  diff,
  lines,
  title,
  subtitle,
  maxHeightClassName = 'max-h-80'
}: DiffViewerProps) {
  const resolvedTitle = title ?? diff?.titleRef ?? 'Diff normativo';
  const resolvedSubtitle = subtitle ?? (diff ? `Art. ${diff.articleNumber}` : 'prévia');
  const resolvedLines = lines?.length
    ? lines
    : diff?.lines?.length
      ? diff.lines
      : buildLinesFromTexts(diff?.beforeText, diff?.afterText);

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.02)] font-mono text-xs shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-git-border)] bg-[rgba(255,255,255,0.04)] px-3 py-2">
        <span className="min-w-0 truncate text-[11px] font-bold text-white">{resolvedTitle}</span>
        <span className="shrink-0 text-[10px] font-bold uppercase text-[var(--color-git-muted)]">{resolvedSubtitle}</span>
      </div>

      <div className={`${maxHeightClassName} overflow-auto`}>
        {resolvedLines.map((line, index) => (
          <div
            key={`${line.type}-${index}-${line.content.slice(0, 16)}`}
            className={`grid grid-cols-[36px_22px_1fr] gap-2 border-b border-[rgba(255,255,255,0.02)] px-3 py-2 last:border-b-0 ${lineClass(line.type)}`}
          >
            <span className="select-none text-right text-[var(--color-git-muted)]">{index + 1}</span>
            <span className="select-none text-[var(--color-git-muted)]">{marker(line.type)}</span>
            <span className="whitespace-pre-wrap break-words leading-5">{line.content}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
