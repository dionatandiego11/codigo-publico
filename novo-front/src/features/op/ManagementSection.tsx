import { ArrowRight, CheckCircle2, CircleX, Link2, MapPin, MessageSquareText } from 'lucide-react';
import { useState } from 'react';
import type { Demanda, Territorio } from '../../shared/domain/types';

export type DemandTransition = 'mature' | 'request-info' | 'validate' | 'mark-ready';

interface ManagementSectionProps {
  demandas: Demanda[];
  territorios: Territorio[];
  onTransition: (demandId: string, transition: DemandTransition, reason: string) => void;
  onGroup: (demandId: string, targetDemandId: string, reason: string) => void;
  onSetViability: (demandId: string, admissibility: 'admissivel' | 'inadmissivel', reason: string, estimatedCostCents?: number) => Promise<void>;
  onSetExecution: (demandId: string, status: Demanda['statusExecucao'], reason?: string) => Promise<void>;
}

type ColumnId = 'received' | 'maturing' | 'viability' | 'decided';
type ActionType = 'info' | 'group' | 'approve' | 'reject';

const columns: Array<{ id: ColumnId; label: string; description: string; color: string }> = [
  { id: 'received', label: 'Recebidas', description: 'Novas demandas', color: 'border-t-blue-500' },
  { id: 'maturing', label: 'Em maturação', description: 'Apoio e complementação', color: 'border-t-purple-500' },
  { id: 'viability', label: 'Viabilidade', description: 'Análise da prefeitura', color: 'border-t-amber-500' },
  { id: 'decided', label: 'Decididas', description: 'Aptas ou justificadas', color: 'border-t-emerald-500' },
];

function demandColumn(demanda: Demanda): ColumnId {
  if (
    [
      'Apta para priorização',
      'Em votação',
      'Aprovada',
      'Não aprovada',
      'Em planejamento',
      'Em execução',
      'Concluída',
      'Frustrada',
      'Arquivada',
    ].includes(demanda.status || '')
    ||
    demanda.admissibilidadeMarcar === 'admissivel'
    || demanda.admissibilidadeMarcar === 'inadmissivel'
    || demanda.statusExecucao
    || demanda.status === 'Agrupada'
    || Boolean(demanda.agrupadaEmId)
  ) return 'decided';
  if (
    demanda.status === 'Validada territorialmente' && demanda.passouPopular
  ) return 'viability';
  if (
    ['Engajamento inicial', 'Maturação territorial', 'Precisa de informações', 'Validada territorialmente'].includes(demanda.status || '')
  ) return 'maturing';
  return 'received';
}

function statusLabel(demanda: Demanda) {
  if (demanda.agrupadaEmId || demanda.status === 'Agrupada') return 'Agrupada';
  if (demanda.status === 'Em votação') return 'Em votação';
  if (demanda.status === 'Aprovada') return 'Aprovada no ciclo';
  if (demanda.status === 'Não aprovada') return 'Não aprovada no ciclo';
  if (demanda.admissibilidadeMarcar === 'inadmissivel') return 'Não aprovada';
  if (demanda.admissibilidadeMarcar === 'admissivel') return 'Apta para votação';
  if (demanda.status === 'Precisa de informações') return 'Aguardando informação';
  if (demanda.status === 'Validada territorialmente') return demanda.passouPopular ? 'Pronta para análise' : 'Aguardando apoios';
  return demanda.status || 'Recebida';
}

export default function ManagementSection({
  demandas,
  territorios,
  onTransition,
  onGroup,
  onSetViability,
  onSetExecution,
}: ManagementSectionProps) {
  const [activeAction, setActiveAction] = useState<{ demandId: string; type: ActionType } | null>(null);
  const [reason, setReason] = useState('');
  const [targetId, setTargetId] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const territoryName = (id: string) => territorios.find(t => t.id === id)?.nome || 'Território não informado';

  const openAction = (demandId: string, type: ActionType) => {
    setActiveAction({ demandId, type });
    setReason('');
    setTargetId('');
    setEstimatedCost('');
  };

  const closeAction = () => {
    setActiveAction(null);
    setReason('');
    setTargetId('');
    setEstimatedCost('');
  };

  const submitAction = () => {
    if (!activeAction) return;
    const { demandId, type } = activeAction;
    if (type === 'group') {
      if (!targetId || !reason.trim()) return;
      onGroup(demandId, targetId, reason.trim());
    } else if (type === 'info') {
      if (!reason.trim()) return;
      onTransition(demandId, 'request-info', reason.trim());
    } else {
      if (!reason.trim()) return;
      const estimatedCostCents = type === 'approve'
        ? Math.round(Number(estimatedCost.replace(',', '.')) * 100)
        : undefined;
      if (type === 'approve' && (!estimatedCostCents || estimatedCostCents <= 0)) return;
      void onSetViability(
        demandId,
        type === 'approve' ? 'admissivel' : 'inadmissivel',
        reason.trim(),
        estimatedCostCents,
      ).catch(() => undefined);
    }
    closeAction();
  };

  return (
    <div className="space-y-6" id="management-section">
      <header>
        <span className="text-sm font-semibold text-blue-700">Área da gestão</span>
        <h1 className="mt-1 font-display text-2xl font-bold text-slate-950">Esteira de demandas</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Organize demandas semelhantes, acompanhe a maturação e registre a análise de viabilidade.
        </p>
      </header>

      <section className="grid items-start gap-4 xl:grid-cols-4" aria-label="Quadro de demandas">
        {columns.map(column => {
          const items = demandas.filter(demanda => demandColumn(demanda) === column.id);
          return (
            <div key={column.id} className={`border border-slate-200 border-t-4 bg-slate-100 ${column.color}`}>
              <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-950">{column.label}</h2>
                  <p className="mt-0.5 text-xs text-slate-500">{column.description}</p>
                </div>
                <span className="grid h-7 min-w-7 place-items-center bg-white px-2 text-xs font-bold text-slate-700">{items.length}</span>
              </div>

              <div className="space-y-3 p-3">
                {items.length === 0 && <p className="border border-dashed border-slate-300 bg-white p-5 text-center text-xs text-slate-400">Nenhuma demanda</p>}
                {items.map(demanda => {
                  const actionOpen = activeAction?.demandId === demanda.id;
                  const groupTargets = demandas.filter(target => (
                    target.id !== demanda.id
                    && target.territorioId === demanda.territorioId
                    && demandColumn(target) !== 'decided'
                  ));

                  return (
                    <article key={demanda.id} className="border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="inline-flex items-center gap-1 text-slate-500"><MapPin className="h-3 w-3" />{territoryName(demanda.territorioId)}</span>
                        <span className="font-medium text-slate-500">{statusLabel(demanda)}</span>
                      </div>
                      <h3 className="mt-2 text-sm font-bold leading-5 text-slate-950">{demanda.titulo}</h3>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{demanda.descricao}</p>
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                        <span>{demanda.apoiosCount}/{demanda.apoiosNecessarios} apoios</span>
                        <span className="inline-flex items-center gap-1"><MessageSquareText className="h-3.5 w-3.5" />{demanda.comentarios.length}</span>
                      </div>

                      {column.id === 'received' && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button onClick={() => onTransition(demanda.id, 'mature', 'Demanda encaminhada para maturação pela gestão.')} className="inline-flex h-9 items-center justify-center gap-1.5 bg-slate-900 px-2 text-xs font-semibold text-white hover:bg-blue-800">Maturar <ArrowRight className="h-3.5 w-3.5" /></button>
                          <button onClick={() => openAction(demanda.id, 'group')} disabled={groupTargets.length === 0} className="inline-flex h-9 items-center justify-center gap-1.5 border border-slate-300 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><Link2 className="h-3.5 w-3.5" />Agrupar</button>
                        </div>
                      )}

                      {column.id === 'maturing' && (
                        <div className="mt-3 space-y-2">
                          {demanda.status === 'Validada territorialmente' ? (
                            <button
                              onClick={() => onTransition(demanda.id, 'mark-ready', 'Apoio mínimo confirmado; demanda encaminhada para análise de viabilidade.')}
                              disabled={!demanda.passouPopular}
                              className="inline-flex h-9 w-full items-center justify-center gap-1.5 bg-slate-900 px-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                            >
                              Enviar para análise <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button onClick={() => onTransition(demanda.id, 'validate', 'Informações territoriais conferidas pela gestão.')} className="inline-flex h-9 w-full items-center justify-center gap-1.5 bg-slate-900 px-2 text-xs font-semibold text-white hover:bg-blue-800"><CheckCircle2 className="h-3.5 w-3.5" />Validar informações</button>
                          )}
                          <button onClick={() => openAction(demanda.id, 'info')} className="h-8 w-full text-xs font-medium text-blue-700 hover:bg-blue-50">Solicitar complemento</button>
                        </div>
                      )}

                      {column.id === 'viability' && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button onClick={() => openAction(demanda.id, 'approve')} className="inline-flex h-9 items-center justify-center gap-1.5 bg-emerald-700 px-2 text-xs font-semibold text-white hover:bg-emerald-800"><CheckCircle2 className="h-3.5 w-3.5" />Aprovar</button>
                          <button onClick={() => openAction(demanda.id, 'reject')} className="inline-flex h-9 items-center justify-center gap-1.5 border border-red-300 px-2 text-xs font-semibold text-red-700 hover:bg-red-50"><CircleX className="h-3.5 w-3.5" />Rejeitar</button>
                        </div>
                      )}

                      {column.id === 'decided'
                        && demanda.admissibilidadeMarcar === 'admissivel'
                        && ['Aprovada', 'Em planejamento', 'Em execução', 'Concluída', 'Frustrada'].includes(demanda.status || '')
                        && (
                        <select
                          value={demanda.statusExecucao || ''}
                          onChange={event => {
                            void onSetExecution(
                              demanda.id,
                              event.target.value as Demanda['statusExecucao'],
                            ).catch(() => undefined);
                          }}
                          className="mt-3 h-9 w-full border border-slate-300 bg-white px-2 text-xs outline-none focus:border-emerald-600"
                          aria-label="Atualizar execução"
                        >
                          <option value="">Aguardando execução</option>
                          <option value="planejamento">Planejamento e orçamento</option>
                          <option value="obra">Em execução</option>
                          <option value="concluido">Concluída</option>
                          <option value="frustrado">Não executada</option>
                        </select>
                      )}

                      {actionOpen && (
                        <div className="mt-3 border-t border-slate-200 pt-3">
                          {activeAction.type === 'group' && (
                            <select value={targetId} onChange={event => setTargetId(event.target.value)} className="mb-2 h-9 w-full border border-slate-300 bg-white px-2 text-xs outline-none" aria-label="Demanda principal">
                              <option value="">Escolha a demanda principal</option>
                              {groupTargets.map(target => <option key={target.id} value={target.id}>{target.titulo}</option>)}
                            </select>
                          )}
                          {activeAction.type === 'approve' && (
                            <label className="mb-2 block text-xs font-medium text-slate-700">
                              Custo estimado (R$)
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={estimatedCost}
                                onChange={event => setEstimatedCost(event.target.value)}
                                className="mt-1 h-9 w-full border border-slate-300 bg-white px-2 text-xs outline-none focus:border-emerald-600"
                                placeholder="0,00"
                              />
                            </label>
                          )}
                          <textarea
                            value={reason}
                            onChange={event => setReason(event.target.value)}
                            placeholder={activeAction.type === 'info' ? 'Informação necessária' : activeAction.type === 'group' ? 'Motivo do agrupamento' : 'Justificativa da análise'}
                            rows={3}
                            className="w-full resize-none border border-slate-300 px-2 py-2 text-xs outline-none focus:border-blue-600"
                          />
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <button onClick={closeAction} className="h-8 border border-slate-300 text-xs font-medium text-slate-600">Cancelar</button>
                            <button onClick={submitAction} className="h-8 bg-slate-900 text-xs font-semibold text-white">Confirmar</button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
