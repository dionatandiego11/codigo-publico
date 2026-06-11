/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlertTriangle, CheckCircle2, Clock3, XCircle } from 'lucide-react';
import type { InstitutionalCheckStatus, PRReviewStatus } from '../../types';

type CIStatusValue = InstitutionalCheckStatus | PRReviewStatus | boolean | null | string;

interface CIStatusProps {
  status: CIStatusValue;
  label: string;
  description?: string;
}

function normalizeStatus(status: CIStatusValue) {
  if (status === true) return 'Aprovado';
  if (status === false) return 'Reprovado';
  if (status === null) return 'Pendente';
  return String(status);
}

function statusTone(status: string) {
  if (status === 'Aprovado') {
    return {
      icon: CheckCircle2,
      row: 'border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.05)]',
      text: 'text-[var(--color-git-green)]',
      badge: 'border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.1)] text-[var(--color-git-green)]'
    };
  }

  if (status === 'Reprovado' || status === 'Rejeitado') {
    return {
      icon: XCircle,
      row: 'border-[rgba(244,63,94,0.3)] bg-[rgba(244,63,94,0.05)]',
      text: 'text-[var(--color-git-red)]',
      badge: 'border-[rgba(244,63,94,0.3)] bg-[rgba(244,63,94,0.1)] text-[var(--color-git-red)]'
    };
  }

  if (status === 'Atenção' || status === 'Aprovado com ressalvas' || status === 'Solicita alterações') {
    return {
      icon: AlertTriangle,
      row: 'border-[rgba(250,204,21,0.3)] bg-[rgba(250,204,21,0.05)]',
      text: 'text-[var(--color-git-amber)]',
      badge: 'border-[rgba(250,204,21,0.3)] bg-[rgba(250,204,21,0.1)] text-[var(--color-git-amber)]'
    };
  }

  return {
    icon: Clock3,
    row: 'border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.02)]',
    text: 'text-[var(--color-git-text2)]',
    badge: 'border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.05)] text-[var(--color-git-muted)]'
  };
}

export function CIStatus({ status, label, description }: CIStatusProps) {
  const normalized = normalizeStatus(status);
  const tone = statusTone(normalized);
  const Icon = tone.icon;

  return (
    <div className={`rounded-xl border p-3 transition-colors ${tone.row}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone.text}`} />
          <span className="min-w-0">
            <span className={`block text-sm font-semibold ${tone.text}`}>{label}</span>
            {description && <span className="mt-1 block text-xs leading-5 text-[var(--color-git-muted)]">{description}</span>}
          </span>
        </div>
        <span className={`shrink-0 rounded border px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${tone.badge}`}>
          {normalized}
        </span>
      </div>
    </div>
  );
}
