/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Home,
  Briefcase,
  GraduationCap,
  LoaderCircle,
  MapPin,
  ShieldQuestion,
  XCircle
} from 'lucide-react';
import {
  appealBond,
  getMyBond,
  getTerritoryGovernance,
  requestBond,
  type BondType,
  type TerritoryBond,
  type TerritoryGovernance
} from '../lib/api';
import { ApiError } from '../api/client';
import { useToast } from '../shared/feedback/ToastContext';
import type { Territory } from '../types';

// Tradução do status técnico do vínculo para linguagem cidadã. A "constituição"
// (níveis T0–T4, máquina de estados) fica escondida — o cidadão vê só o que
// importa para ele.
const bondTypeLabel: Record<BondType, string> = {
  morador: 'morador',
  trabalhador: 'trabalhador',
  estudante: 'estudante'
};

const bondTypeOptions: { value: BondType; icon: typeof Home; title: string; hint: string }[] = [
  { value: 'morador', icon: Home, title: 'Moro aqui', hint: 'Resido neste bairro' },
  { value: 'trabalhador', icon: Briefcase, title: 'Trabalho aqui', hint: 'Moro em outro lugar' },
  { value: 'estudante', icon: GraduationCap, title: 'Estudo aqui', hint: 'Moro em outro lugar' }
];

export function TerritoryBondCard({ territories }: { territories: Territory[] }) {
  const { pushToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [bond, setBond] = useState<TerritoryBond | null>(null);

  const reload = () => {
    setLoading(true);
    getMyBond()
      .then(b => setBond(b ?? null))
      .catch(() => setBond(null))
      .finally(() => setLoading(false));
  };

  useEffect(reload, []);

  if (loading) {
    return (
      <div className="glass-panel rounded-[20px] p-6 flex items-center gap-3 text-sm text-[var(--color-git-muted)]">
        <LoaderCircle className="h-4 w-4 animate-spin" />
        Carregando seu vínculo com o bairro…
      </div>
    );
  }

  if (bond) {
    return <BondStatus bond={bond} onChanged={reload} />;
  }

  return <BondRequest territories={territories} onRequested={reload} pushToast={pushToast} />;
}

function BondStatus({ bond, onChanged }: { bond: TerritoryBond; onChanged: () => void }) {
  const { pushToast } = useToast();
  const [appealing, setAppealing] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const view = (() => {
    switch (bond.status) {
      case 'Pendente':
        return {
          icon: Clock,
          tone: 'text-[var(--color-git-blue)]',
          ring: 'border-[rgba(56,189,248,0.25)] bg-[rgba(56,189,248,0.05)]',
          title: 'Pedido em análise',
          text: `Seu pedido foi enviado ao representante de ${bond.territoryName} e está em análise.`
        };
      case 'Aprovado':
        return {
          icon: CheckCircle2,
          tone: 'text-[var(--color-git-green)]',
          ring: 'border-[rgba(52,211,153,0.25)] bg-[rgba(52,211,153,0.05)]',
          title: `Você é ${bondTypeLabel[bond.bondType]} validado`,
          text: `Vínculo confirmado com ${bond.territoryName}. Você pode participar plenamente das decisões do seu bairro.`
        };
      case 'Contestado':
        return {
          icon: AlertTriangle,
          tone: 'text-[var(--color-git-amber)]',
          ring: 'border-[rgba(251,191,36,0.25)] bg-[rgba(251,191,36,0.05)]',
          title: 'Vínculo em revisão',
          text: 'Sua participação no bairro está em revisão por uma contestação da comunidade. Seu vínculo segue ativo até a decisão.'
        };
      case 'Recusado':
        return {
          icon: XCircle,
          tone: 'text-[var(--color-git-red)]',
          ring: 'border-[rgba(248,113,113,0.25)] bg-[rgba(248,113,113,0.05)]',
          title: 'Pedido não aprovado',
          text: bond.decisionReason || 'Seu pedido de vínculo não foi aprovado pelo representante do bairro.'
        };
      default: // Revogado
        return {
          icon: XCircle,
          tone: 'text-[var(--color-git-red)]',
          ring: 'border-[rgba(248,113,113,0.25)] bg-[rgba(248,113,113,0.05)]',
          title: 'Vínculo encerrado',
          text: bond.decisionReason || 'Seu vínculo com o bairro foi encerrado.'
        };
    }
  })();

  const Icon = view.icon;

  const submitAppeal = () => {
    if (!reason.trim()) return;
    setSubmitting(true);
    appealBond(bond.id, reason.trim())
      .then(() => {
        pushToast('success', 'Recurso enviado para a revisão geral.');
        setAppealing(false);
        setReason('');
        onChanged();
      })
      .catch(error => {
        const message = error instanceof ApiError ? error.message : 'Falha ao enviar o recurso.';
        pushToast('error', message);
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <div className={`glass-panel rounded-[20px] p-6 border ${view.ring}`}>
      <div className="flex items-start gap-4">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] border border-[var(--color-git-border2)] ${view.tone}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--color-git-muted)]">
            Meu bairro · {bond.territoryName}
          </p>
          <h3 className="mt-1 font-display text-lg font-bold text-white leading-tight">{view.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-git-text2)]">{view.text}</p>
        </div>
      </div>

      {bond.status === 'Recusado' && (
        <div className="mt-4 border-t border-[var(--color-git-border)] pt-4">
          {appealing ? (
            <div className="space-y-3">
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                placeholder="Explique por que o vínculo deveria ser reconsiderado…"
                className="field resize-none"
              />
              <div className="flex gap-2">
                <button onClick={submitAppeal} disabled={submitting || !reason.trim()} className="btn-primary btn-sm">
                  {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  Enviar recurso
                </button>
                <button onClick={() => setAppealing(false)} className="btn-secondary btn-sm">Cancelar</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAppealing(true)} className="btn-secondary btn-sm">
              Discordo — pedir revisão geral
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function BondRequest({
  territories,
  onRequested,
  pushToast
}: {
  territories: Territory[];
  onRequested: () => void;
  pushToast: ReturnType<typeof useToast>['pushToast'];
}) {
  const [slug, setSlug] = useState('');
  const [bondType, setBondType] = useState<BondType | ''>('');
  const [evidence, setEvidence] = useState('');
  const [governance, setGovernance] = useState<TerritoryGovernance | null>(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) {
      setGovernance(null);
      return;
    }
    setChecking(true);
    getTerritoryGovernance(slug)
      .then(setGovernance)
      .catch(() => setGovernance(null))
      .finally(() => setChecking(false));
  }, [slug]);

  const accepts = governance?.acceptsNewBonds ?? false;

  const submit = () => {
    if (!slug || !bondType) return;
    setSubmitting(true);
    requestBond(slug, { bondType, evidenceNote: evidence.trim() || undefined })
      .then(() => {
        pushToast('success', 'Pedido enviado ao representante do seu bairro.');
        onRequested();
      })
      .catch(error => {
        const message = error instanceof ApiError ? error.message : 'Falha ao enviar o pedido.';
        pushToast('error', message);
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="glass-panel rounded-[20px] p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(56,189,248,0.1)] border border-[rgba(56,189,248,0.2)] text-[var(--color-git-blue)] icon-glow-blue">
          <MapPin className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-display text-lg font-bold text-white leading-tight">Vincule-se ao seu bairro</h3>
          <p className="text-xs text-[var(--color-git-muted)]">Para participar das decisões do seu território, confirme seu vínculo.</p>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        <div>
          <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--color-git-muted)] mb-1.5">
            Qual é o seu bairro?
          </label>
          <select value={slug} onChange={e => setSlug(e.target.value)} className="field">
            <option value="">Selecione…</option>
            {territories.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {slug && checking && (
          <p className="flex items-center gap-2 text-xs text-[var(--color-git-muted)]">
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Verificando o bairro…
          </p>
        )}

        {slug && !checking && governance && !accepts && (
          <div className="flex items-start gap-3 rounded-xl border border-[rgba(251,191,36,0.25)] bg-[rgba(251,191,36,0.05)] p-4">
            <ShieldQuestion className="h-5 w-5 shrink-0 text-[var(--color-git-amber)]" />
            <div>
              <p className="text-sm font-semibold text-white">Este bairro ainda não tem representante ativo.</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--color-git-text2)]">
                Você pode acompanhar os problemas públicos enquanto aguarda. Novos cadastros abrem quando o bairro tiver um representante.
              </p>
            </div>
          </div>
        )}

        {slug && !checking && accepts && (
          <>
            <div>
              <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--color-git-muted)] mb-2">
                Você mora, trabalha ou estuda aqui?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {bondTypeOptions.map(opt => {
                  const Icon = opt.icon;
                  const active = bondType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setBondType(opt.value)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition ${
                        active
                          ? 'border-[var(--color-git-blue)] bg-[rgba(56,189,248,0.1)] text-white shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                          : 'border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.02)] text-[var(--color-git-text2)] hover:border-[var(--color-git-border3)]'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${active ? 'text-[var(--color-git-blue)]' : 'text-[var(--color-git-muted)]'}`} />
                      <span className="text-xs font-bold">{opt.title}</span>
                      <span className="text-[10px] leading-tight text-[var(--color-git-muted)]">{opt.hint}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--color-git-muted)] mb-1.5">
                Comprovação (opcional)
              </label>
              <textarea
                value={evidence}
                onChange={e => setEvidence(e.target.value)}
                rows={2}
                placeholder="Ex.: tenho conta de luz no endereço; trabalho na rua tal há 3 anos…"
                className="field resize-none"
              />
              <p className="mt-1 text-[10px] text-[var(--color-git-muted)]">
                O representante do bairro pode pedir comprovação (conta de luz, telefone, contrato) antes de validar.
              </p>
            </div>

            <button onClick={submit} disabled={!bondType || submitting} className="btn-primary w-full">
              {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              Enviar pedido ao representante
            </button>
          </>
        )}
      </div>
    </div>
  );
}
