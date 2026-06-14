/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { CheckCircle2, LoaderCircle, MapPin, UserCheck, XCircle } from 'lucide-react';
import { decideBond, listTerritoryBonds, type TerritoryBond } from '../lib/api';
import { ApiError } from '../api/client';
import { useToast } from '../shared/feedback/ToastContext';
import { Badge, statusClass } from '../shared/ui';
import type { Territory } from '../types';

const bondTypeLabel: Record<string, string> = {
  morador: 'Morador',
  trabalhador: 'Trabalhador',
  estudante: 'Estudante'
};

/**
 * Painel do maintainer: lista os pedidos de vínculo pendentes de um território
 * e permite validar (aprovar) ou recusar com justificativa. A API recusa a ação
 * (403) se o ator não for maintainer do território — então o painel respeita a
 * autoridade real do backend.
 */
export function BondValidationPanel({ territories }: { territories: Territory[] }) {
  const { pushToast } = useToast();
  const [slug, setSlug] = useState(territories[0]?.id ?? '');
  const [bonds, setBonds] = useState<TerritoryBond[]>([]);
  const [loading, setLoading] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = (territorySlug: string) => {
    if (!territorySlug) return;
    setLoading(true);
    listTerritoryBonds(territorySlug, 'Pendente')
      .then(setBonds)
      .catch(error => {
        // 403 = não é maintainer deste território; mostra vazio sem ruído.
        if (!(error instanceof ApiError && error.status === 403)) {
          pushToast('error', error instanceof ApiError ? error.message : 'Falha ao carregar pedidos.');
        }
        setBonds([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(slug);
  }, [slug]);

  const approve = (bond: TerritoryBond) => {
    setBusyId(bond.id);
    decideBond(bond.id, { approve: true })
      .then(() => {
        pushToast('success', `${bond.citizenName} validado(a) como ${bondTypeLabel[bond.bondType] ?? bond.bondType}.`);
        load(slug);
      })
      .catch(error => pushToast('error', error instanceof ApiError ? error.message : 'Falha ao aprovar.'))
      .finally(() => setBusyId(null));
  };

  const reject = (bond: TerritoryBond) => {
    if (!reason.trim()) return;
    setBusyId(bond.id);
    decideBond(bond.id, { approve: false, reason: reason.trim() })
      .then(() => {
        pushToast('success', `Pedido de ${bond.citizenName} recusado.`);
        setRejectingId(null);
        setReason('');
        load(slug);
      })
      .catch(error => pushToast('error', error instanceof ApiError ? error.message : 'Falha ao recusar.'))
      .finally(() => setBusyId(null));
  };

  return (
    <section className="glass-panel p-5 rounded-[20px]">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-[var(--color-git-blue)]" />
          Vínculos para validar
        </h2>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[var(--color-git-muted)]" />
          <select value={slug} onChange={e => setSlug(e.target.value)} className="field !w-auto py-1.5">
            {territories.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      {loading && (
        <p className="flex items-center gap-2 text-sm text-[var(--color-git-muted)] py-4">
          <LoaderCircle className="h-4 w-4 animate-spin" /> Carregando pedidos…
        </p>
      )}

      {!loading && bonds.length === 0 && (
        <p className="text-sm text-[var(--color-git-muted)] py-6 text-center">
          Nenhum pedido de vínculo pendente neste bairro (ou você não é o representante dele).
        </p>
      )}

      <div className="space-y-3">
        {bonds.map(bond => (
          <div key={bond.id} className="rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.02)] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={statusClass(bond.status)}>{bond.status}</Badge>
              <Badge className="chip-purple">{bondTypeLabel[bond.bondType] ?? bond.bondType}</Badge>
            </div>
            <h3 className="mt-2 text-sm font-bold text-white">{bond.citizenName}</h3>
            {bond.evidenceNote && (
              <p className="mt-1 text-xs leading-relaxed text-[var(--color-git-text2)]">
                <span className="text-[var(--color-git-muted)]">Comprovação: </span>{bond.evidenceNote}
              </p>
            )}

            {rejectingId === bond.id ? (
              <div className="mt-3 space-y-2">
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  rows={2}
                  placeholder="Motivo da recusa (obrigatório)…"
                  className="field resize-none"
                />
                <div className="flex gap-2">
                  <button onClick={() => reject(bond)} disabled={busyId === bond.id || !reason.trim()} className="btn-secondary btn-sm">
                    Confirmar recusa
                  </button>
                  <button onClick={() => { setRejectingId(null); setReason(''); }} className="btn-secondary btn-sm">Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => approve(bond)} disabled={busyId === bond.id} className="btn-success btn-sm">
                  {busyId === bond.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Validar
                </button>
                <button onClick={() => { setRejectingId(bond.id); setReason(''); }} className="btn-secondary btn-sm">
                  <XCircle className="h-4 w-4" />
                  Recusar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
