/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CircleDot } from 'lucide-react';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
});

export function formatDate(value?: string) {
  if (!value) return 'sem data';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return dateFormatter.format(parsed);
}

// Mapeia status de domínio para os chips do design system (tema escuro).
export function statusClass(status: string) {
  if (['Resolvida', 'Cumprida', 'Aprovado', 'Aprovado formalmente', 'Incorporado ao texto oficial', 'Aprovado pela consulta pública'].includes(status)) {
    return 'border bg-[rgba(52,211,153,0.08)] text-[var(--color-git-green)] border-[rgba(52,211,153,0.22)]';
  }
  if (['Em votação', 'Aberta', 'Aberto para debate', 'Em execução', 'Pronto para votação'].includes(status)) {
    return 'border bg-[rgba(56,189,248,0.08)] text-[var(--color-git-blue)] border-[rgba(56,189,248,0.22)]';
  }
  if (['Em triagem', 'Em análise técnica', 'Atenção', 'Aguardando ajustes', 'Em regulamentação', 'Aguardando regulamentação', 'Parcialmente cumprida'].includes(status)) {
    return 'border bg-[rgba(251,191,36,0.08)] text-[var(--color-git-amber)] border-[rgba(251,191,36,0.22)]';
  }
  if (['Rejeitado', 'Arquivada', 'Arquivado', 'Descumprida', 'Suspensa judicialmente', 'Reprovado'].includes(status)) {
    return 'border bg-[rgba(248,113,113,0.08)] text-[var(--color-git-red)] border-[rgba(248,113,113,0.22)]';
  }
  return 'border bg-white/[0.04] text-[var(--color-git-muted2)] border-[var(--color-git-border2)]';
}

export function PercentBar({ value, total }: { value: number; total: number }) {
  const percent = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="h-2 overflow-hidden rounded bg-[var(--color-git-bg2)] border border-[var(--color-git-border)]">
      <div className="h-full rounded bg-[var(--color-git-blue)]" style={{ width: `${percent}%`, boxShadow: '0 0 10px var(--color-git-blue-glow)' }} />
    </div>
  );
}

export function Badge({ children, className = '' }: { children: string; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${className}`}>
      {children}
    </span>
  );
}

export function PageTitle({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="pb-5">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-git-muted)] font-bold">{eyebrow}</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">{title}</h1>
      {subtitle && <p className="mt-2 text-sm text-[var(--color-git-muted)]">{subtitle}</p>}
    </div>
  );
}

export function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-[var(--color-git-border)] bg-[rgba(255,255,255,0.03)] p-3">
      <p className="font-mono text-[10px] font-bold uppercase text-[var(--color-git-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

export function MetricMini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-[var(--color-git-border)] p-2 text-center flex flex-col items-center justify-center">
      <p className="text-sm font-bold text-white">{value}</p>
      <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--color-git-muted)]">{label}</p>
    </div>
  );
}

export function NotFound({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="glass-panel p-8 text-center rounded-[20px]">
      <CircleDot className="mx-auto h-8 w-8 text-[var(--color-git-muted)]" />
      <h1 className="mt-3 font-display text-xl font-bold text-white">{title}</h1>
      <button onClick={onBack} className="btn-primary btn-sm mt-4">
        Voltar
      </button>
    </div>
  );
}
