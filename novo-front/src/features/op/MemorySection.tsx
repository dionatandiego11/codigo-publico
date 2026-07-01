import { BarChart3, CheckCircle2, CircleX, Clock3, MapPin, AlertCircle, Sparkles, Shield, Filter } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import type { CycleConfig, RankingItem, Territorio } from '../../shared/domain/types';

type MemoryView = 'ranking' | 'execucao' | 'decisoes';

interface MemorySectionProps {
  cycle: CycleConfig;
  ranking: RankingItem[];
  territorios: Territorio[];
  canEditStatus?: boolean;
  onUpdateStatus?: (itemId: string, status: string, reason?: string) => Promise<void>;
  frozen?: boolean;
  frozenAt?: string;
}

const kanbanColumns = [
  { id: 'Computado', label: 'Planejamento cívico', color: 'bg-slate-100 text-slate-800 border-[#1A1A1B]' },
  { id: 'Incluído na matriz', label: 'Garantido no orçamento', color: 'bg-amber-100 text-amber-900 border-[#1A1A1B]' },
  { id: 'Em execução', label: 'Obra iniciada', color: 'bg-sky-100 text-sky-900 border-[#1A1A1B]' },
  { id: 'Concluído', label: 'Obra entregue! 🎉', color: 'bg-emerald-100 text-emerald-900 border-[#1A1A1B]' },
  { id: 'Frustrado', label: 'Interrompida', color: 'bg-red-100 text-red-900 border-[#1A1A1B]' },
];

export default function MemorySection({ cycle, ranking, territorios, canEditStatus, onUpdateStatus, frozen, frozenAt }: MemorySectionProps) {
  const [view, setView] = useState<MemoryView>('ranking');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [novoStatus, setNovoStatus] = useState<string>('Computado');
  const [justificativaFrustrado, setJustificativaFrustrado] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [territoryFilter, setTerritoryFilter] = useState<string>('');

  const cycleClosed = cycle.faseAtual === 'execucao';

  const hasRanking = ranking.length > 0;

  // Unique territories from ranking items
  const rankingTerritories = useMemo(() => {
    const unique = new Map<string, string>();
    ranking.forEach(item => {
      if (!unique.has(item.territoryId)) {
        unique.set(item.territoryId, item.territoryName);
      }
    });
    return Array.from(unique.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [ranking]);

  // Ranking view — filtered by territory
  const rankedItems = useMemo(() => {
    let items = ranking.slice();
    if (territoryFilter) {
      items = items.filter(item => item.territoryId === territoryFilter);
    }
    return items.sort((a, b) => a.position - b.position);
  }, [ranking, territoryFilter]);

  // Execution view (only approved items)
  const executionItems = ranking.filter(item => item.approved);

  // Decisions view (rejected items or frustrated items)
  const rejectedItems = ranking.filter(item => !item.approved);

  const handleStatusChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || !onUpdateStatus) return;

    if (novoStatus === 'Frustrado' && !justificativaFrustrado.trim()) {
      alert("Para marcar uma obra como frustrada, forneça uma justificativa pública sobre os impedimentos.");
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdateStatus(
        selectedItemId,
        novoStatus,
        novoStatus === 'Frustrado' ? justificativaFrustrado : undefined
      );
      setSelectedItemId(null);
      setJustificativaFrustrado('');
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6" id="memory-section">
      <header>
        <span className="text-sm font-semibold text-amber-700">Memória pública</span>
        <h1 className="mt-1 font-display text-2xl font-bold text-slate-950">
          Resultado do Ciclo {cycle.nome}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          O ciclo preserva prioridades, decisões, justificativas e o andamento de cada proposta após a votação.
        </p>
      </header>

      <section className="flex flex-col gap-4 border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs text-slate-500">Ciclo municipal</span>
          <h2 className="mt-1 text-lg font-bold text-slate-950">{cycle.nome}</h2>
        </div>
        <div className="flex items-center gap-3">
          {frozen && (
            <div className="flex items-center gap-2 border border-emerald-300 bg-emerald-50 px-3 py-2">
              <Shield className="h-4 w-4 text-emerald-700" />
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800">Resultado congelado</span>
                {frozenAt && (
                  <span className="block text-[10px] text-emerald-600">
                    {new Date(frozenAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          )}
          <div className={`border-l-4 px-4 py-2 ${cycleClosed ? 'border-emerald-500 bg-emerald-50' : 'border-blue-500 bg-blue-50'}`}>
            <span className="block text-xs text-slate-500">Publicação</span>
            <strong className={`block text-sm ${cycleClosed ? 'text-emerald-800' : 'text-blue-800'}`}>{cycleClosed ? 'Resultado final' : 'Resultado parcial'}</strong>
          </div>
        </div>
      </section>

      <div className="flex w-full overflow-x-auto border border-slate-300 bg-white p-1 sm:w-fit">
        {([
          ['ranking', 'Classificação Popular', BarChart3],
          ['execucao', 'Acompanhamento de Obras', Clock3],
          ['decisoes', 'Não Priorizadas', CircleX],
        ] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setView(id)} className={`flex h-10 shrink-0 items-center gap-2 px-4 text-sm font-semibold ${view === id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      {view === 'ranking' && (
        <section className="border border-slate-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-950">Propostas mais votadas pela comunidade</h2>
              <p className="mt-1 text-sm text-slate-500">Resultado final consolidado após a votação de todos os moradores.</p>
            </div>
            {rankingTerritories.length > 1 && (
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <select
                  value={territoryFilter}
                  onChange={e => setTerritoryFilter(e.target.value)}
                  className="border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
                  id="territory-filter"
                >
                  <option value="">Todos os territórios</option>
                  {rankingTerritories.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {!hasRanking ? <EmptyState text="A classificação das propostas estará disponível assim que a votação popular for concluída." /> : (
            <div className="divide-y divide-slate-200">
              {rankedItems.map((item, index) => (
                <article key={item.id} className="grid gap-4 p-5 sm:grid-cols-[44px_1fr_auto] sm:items-center">
                  <span className={`grid h-10 w-10 place-items-center text-sm font-bold ${index < 3 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>{item.position}</span>
                  <div>
                    <div className="mb-1 flex gap-2">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${item.approved ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {item.approved ? 'Priorizada' : 'Não priorizada'}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-950">{item.proposalTitle}</h3>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5" />
                      {item.territoryName}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <strong className="block text-sm text-slate-900">{item.approvalPct.toFixed(1)}% aprov.</strong>
                    <span className="text-xs text-slate-500">{item.votesYes} sim / {item.votesNo} não</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {view === 'execucao' && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white border border-slate-800 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest font-bold">Transparência pública</span>
              <h2 className="text-xl font-display font-bold text-white leading-tight">
                Acompanhamento das Obras Prometidas
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed font-sans">
                Veja em tempo real o andamento de cada projeto que ganhou a votação popular e está sendo planejado ou executado pela prefeitura.
              </p>
            </div>
            <div className="bg-slate-800 border border-slate-700 p-4 text-xs text-slate-300 space-y-1.5 max-w-sm flex-shrink-0">
              <span className="font-bold font-mono text-[10px] text-emerald-400 flex items-center gap-1 uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5 text-yellow-400" /> Aprendizado do Ciclo:
              </span>
              <p className="text-[11px] leading-relaxed text-slate-300">
                Se uma obra for marcada como <strong>Interrompida</strong>, o território recebe um acréscimo automático de <strong>+0.10</strong> em seu indicador de carência para o próximo ano.
              </p>
            </div>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth md:grid md:grid-cols-5 md:gap-4 md:pb-0" id="kanban-board">
            {kanbanColumns.map((col) => {
              const colProposals = executionItems.filter(item => item.status === col.id);

              return (
                <div key={col.id} className="bg-slate-50 p-4 border border-slate-200 flex flex-col min-h-[420px] snap-center shrink-0 w-[290px] md:w-auto">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
                    <span className={`text-[10px] font-bold font-mono uppercase tracking-wider px-2 py-1 border ${col.color}`}>
                      {col.label}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-200 px-2 py-0.5">
                      {colProposals.length}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {colProposals.map((item) => (
                      <div 
                        key={item.id}
                        className={`bg-white border p-3.5 shadow-sm space-y-2 ${
                          col.id === 'Frustrado' ? 'border-red-400 bg-red-50' : 'border-slate-300 hover:border-purple-400'
                        }`}
                      >
                        <div>
                          <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-widest flex items-center gap-0.5">
                            <MapPin className="h-2.5 w-2.5 text-slate-400" /> {item.territoryName}
                          </span>
                          <h4 className="font-bold text-xs text-slate-900 mt-1 leading-tight">
                            {item.proposalTitle}
                          </h4>
                        </div>

                        {item.status === 'Frustrado' && (
                          <div className="p-2.5 bg-red-50 text-[10px] text-red-950 border border-red-200 space-y-1">
                            <span className="font-mono font-bold uppercase text-[9px] text-red-800 block">Justificativa Pública:</span>
                            <p className="italic font-sans">"{item.frustrationReason}"</p>
                          </div>
                        )}

                        {canEditStatus ? (
                          <button
                            onClick={() => {
                              setSelectedItemId(item.id);
                              setNovoStatus(item.status);
                              setJustificativaFrustrado(item.frustrationReason || '');
                            }}
                            className="w-full mt-2 py-1.5 bg-slate-50 hover:bg-purple-600 hover:text-white border border-slate-300 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider transition-colors"
                          >
                            Atualizar Status
                          </button>
                        ) : (
                          <div className="mt-2 border border-slate-200 bg-slate-50 px-2 py-1 text-center font-mono text-[9px] font-bold uppercase tracking-wider text-slate-500">
                            Acompanhamento público
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Editor Modal */}
          {canEditStatus && selectedItemId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
              <div className="bg-white border border-slate-200 shadow-xl max-w-lg w-full">
                <div className="flex justify-between items-center border-b border-slate-200 p-4 bg-slate-50">
                  <h3 className="font-bold text-slate-900">Atualizar Status de Execução</h3>
                  <button onClick={() => setSelectedItemId(null)} className="text-slate-400 hover:text-slate-600"><CircleX className="w-5 h-5" /></button>
                </div>

                <form onSubmit={handleStatusChangeSubmit} className="p-6 space-y-5">
                  {(() => {
                    const selectedItem = executionItems.find(d => d.id === selectedItemId);
                    return (
                      <>
                        <div className="bg-slate-50 p-3.5 border border-slate-200 text-sm">
                          <p className="font-bold text-slate-900">{selectedItem?.proposalTitle}</p>
                          <p className="text-slate-500 text-xs mt-1">{selectedItem?.territoryName}</p>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Novo Status</label>
                          <div className="grid grid-cols-2 gap-2">
                            {kanbanColumns.map((statusOption) => (
                              <button
                                key={statusOption.id}
                                type="button"
                                onClick={() => setNovoStatus(statusOption.id)}
                                className={`py-2 px-3 border text-xs font-bold text-center transition-all ${
                                  novoStatus === statusOption.id
                                    ? statusOption.id === 'Frustrado'
                                      ? 'bg-red-600 text-white border-red-700'
                                      : 'bg-purple-700 text-white border-purple-800'
                                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                {statusOption.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {novoStatus === 'Frustrado' && (
                          <div className="bg-red-50 border border-red-200 p-4 space-y-3">
                            <p className="text-xs font-bold flex items-center gap-1 text-red-700">
                              <AlertCircle className="h-4 w-4" /> Protocolo de Compensação
                            </p>
                            <p className="text-xs text-red-800 leading-relaxed">
                              Ao declarar a frustração, o território receberá +0.10 de carência no próximo ciclo.
                            </p>
                            <div className="space-y-1">
                              <label className="block text-xs font-bold text-red-700">Justificativa Pública</label>
                              <textarea
                                value={justificativaFrustrado}
                                onChange={(e) => setJustificativaFrustrado(e.target.value)}
                                className="w-full p-2 border border-red-300 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 min-h-20"
                                placeholder="Descreva os impedimentos (ex: licitação deserta, falência da empresa)..."
                                required
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex gap-3 pt-4 border-t border-slate-200">
                          <button
                            type="button"
                            onClick={() => setSelectedItemId(null)}
                            className="flex-1 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            disabled={isUpdating}
                            className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm disabled:opacity-50"
                          >
                            {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'decisoes' && (
        <section className="space-y-3">
          {rejectedItems.length === 0 ? <EmptyState text="Nenhuma demanda foi rejeitada neste ciclo." /> : rejectedItems.map(item => (
            <article key={item.id} className="border border-slate-200 bg-white p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <span className="mb-2 inline-block bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800">Não priorizada</span>
                  <h3 className="text-base font-bold text-slate-950">{item.proposalTitle}</h3>
                  <p className="mt-1 text-xs text-slate-500">{item.territoryName}</p>
                </div>
                <div className="max-w-xl border-l-4 border-red-400 bg-red-50 p-4">
                  <strong className="text-xs uppercase text-red-900">Motivo principal</strong>
                  <p className="mt-1 text-sm leading-5 text-red-800">
                    {!item.quorumReached
                      ? 'A proposta não atingiu a quantidade mínima de votos (meta do bairro).'
                      : 'A maioria dos moradores que votou preferiu rejeitar esta sugestão nesta rodada.'}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <CheckCircle2 className="mx-auto h-8 w-8 text-slate-300" />
      <p className="mt-3 text-sm text-slate-500">{text}</p>
    </div>
  );
}

