import React, { useState } from 'react';
import { 
  CheckSquare, Play, AlertTriangle, CheckCircle, Info, 
  ArrowRight, ShieldCheck, MapPin, Sparkles, AlertCircle 
} from 'lucide-react';
import { Demanda, Territorio } from '../../shared/domain/types';

interface ExecutionSectionProps {
  demandas: Demanda[];
  territorios: Territorio[];
  onSetStatusExecucao: (demandaId: string, status: Demanda['statusExecucao'], justificativa?: string) => void;
  canEditStatus: boolean;
}

export default function ExecutionSection({
  demandas,
  territorios,
  onSetStatusExecucao,
  canEditStatus
}: ExecutionSectionProps) {
  const [selectedDemandaId, setSelectedDemandaId] = useState<string | null>(null);
  const [novoStatus, setNovoStatus] = useState<Demanda['statusExecucao']>('planejamento');
  const [justificativaFrustrado, setJustificativaFrustrado] = useState('');

  // Get approved and eligible proposals to track execution
  const approvedDemandas = demandas.filter(d => 
    d.admissibilidadeMarcar === 'admissivel' || d.statusExecucao
  );

  const getTerritorioNome = (id: string) => {
    return territorios.find(t => t.id === id)?.nome || 'Brumadinho';
  };

  const getTerritorioCarencia = (id: string) => {
    return territorios.find(t => t.id === id)?.indiceCarencia || 0;
  };

  const handleStatusChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDemandaId) return;

    if (novoStatus === 'frustrado' && !justificativaFrustrado.trim()) {
      alert("Para marcar uma obra como frustrada, forneça uma justificativa pública sobre os impedimentos.");
      return;
    }

    onSetStatusExecucao(
      selectedDemandaId, 
      novoStatus, 
      novoStatus === 'frustrado' ? justificativaFrustrado : undefined
    );

    setSelectedDemandaId(null);
    setJustificativaFrustrado('');
  };

  const kanbanColumns = [
    { id: 'planejamento', label: 'Planejamento', color: 'bg-slate-100 text-slate-800 border-[#1A1A1B]' },
    { id: 'licitacao', label: 'Licitação', color: 'bg-amber-100 text-amber-900 border-[#1A1A1B]' },
    { id: 'obra', label: 'Em Obra', color: 'bg-sky-100 text-sky-900 border-[#1A1A1B]' },
    { id: 'concluido', label: 'Concluído', color: 'bg-emerald-100 text-emerald-900 border-[#1A1A1B]' },
    { id: 'frustrado', label: 'Frustrado', color: 'bg-red-100 text-red-900 border-[#1A1A1B]' },
  ];

  return (
    <div className="space-y-8" id="execution-section">
      
      {/* Intro Header */}
      <div className="bg-slate-900 text-white rounded-none border-2 border-[#1A1A1B] p-6 md:p-8 shadow-[4px_4px_0px_0px_#1A1A1B] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">FASE C • Accountability</span>
          <h2 className="text-2xl font-serif italic font-black text-emerald-300 leading-tight">
            Execução e Memória Pública
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            Acompanhe o andamento físico de cada uma das decisões aprovadas no Orçamento Participativo. Código Público conecta o fracasso de fornecedores diretamente ao reajuste orçamentário corretivo de Brumadinho.
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 p-4 rounded-none text-xs text-slate-300 space-y-1.5 max-w-sm flex-shrink-0">
          <span className="font-bold font-mono text-[10px] text-emerald-400 flex items-center gap-1 uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-yellow-400" /> Aprendizado do Kernel:
          </span>
          <p className="text-[11px] leading-relaxed text-slate-300">
            Se uma obra for marcada como **Frustrada** por falhas administrativas, o território recebe um acréscimo automático de **+0.10** em seu indicador de carência para o próximo ano, aumentando o sub-envelope garantido.
          </p>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4" id="kanban-board">
        {kanbanColumns.map((col) => {
          const colProposals = approvedDemandas.filter(d => 
            (d.statusExecucao || 'planejamento') === col.id
          );

          return (
            <div key={col.id} className="bg-slate-50 rounded-none p-4 border-2 border-[#1A1A1B] flex flex-col min-h-[420px] shadow-[2px_2px_0px_0px_#1A1A1B]">
              <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
                <span className={`text-[10px] font-bold font-mono uppercase tracking-wider px-2 py-1 rounded-none border-2 ${col.color}`}>
                  {col.label}
                </span>
                <span className="font-mono text-xs font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 border border-slate-300">
                  {colProposals.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {colProposals.map((demanda) => (
                  <div 
                    key={demanda.id}
                    id={`kanban-item-${demanda.id}`}
                    className={`bg-white rounded-none border-2 border-[#1A1A1B] p-3.5 shadow-sm space-y-2 hover:bg-slate-100 transition-colors ${
                      col.id === 'frustrado' ? 'border-red-400 bg-red-50/25' : ''
                    }`}
                  >
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-widest block flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5 text-slate-400" /> {getTerritorioNome(demanda.territorioId)}
                      </span>
                      <h4 className="font-bold text-[11px] text-slate-900 mt-1 font-sans leading-tight">
                        {demanda.titulo}
                      </h4>
                    </div>

                    {demanda.statusExecucao === 'frustrado' && (
                      <div className="p-2.5 bg-red-50 text-[10px] text-red-950 rounded-none border border-red-300 space-y-1">
                        <span className="font-mono font-bold uppercase text-[9px] text-red-800 block">Justificativa Pública:</span>
                        <p className="italic font-sans">"{demanda.justificativaFrustrado}"</p>
                        <span className="font-bold font-mono block mt-1.5 text-[9px] text-red-900 bg-red-100 px-1 py-0.5 border border-red-200 uppercase tracking-wide">
                          Compensação: Carência +0.10!
                        </span>
                      </div>
                    )}

                    {canEditStatus ? (
                      <button
                        id={`btn-mudar-estado-${demanda.id}`}
                        onClick={() => {
                          setSelectedDemandaId(demanda.id);
                          setNovoStatus(demanda.statusExecucao || 'planejamento');
                          setJustificativaFrustrado(demanda.justificativaFrustrado || '');
                        }}
                        className="w-full text-center py-1 bg-slate-50 hover:bg-[#3B82F6] hover:text-white border border-[#1A1A1B] rounded-none text-[10px] font-mono font-bold uppercase tracking-wider transition-colors"
                      >
                        Mudar Estado Técnico
                      </button>
                    ) : (
                      <div className="border border-slate-200 bg-slate-50 px-2 py-1 text-center font-mono text-[9px] font-bold uppercase tracking-wider text-slate-500">
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

      {/* Editor Modal / Container for Execution Status */}
      {canEditStatus && selectedDemandaId && (
        (() => {
          const selectedDemanda = approvedDemandas.find(d => d.id === selectedDemandaId);
          return (
            <div className="bg-slate-900 text-white rounded-none p-6 border-2 border-[#1A1A1B] shadow-[4px_4px_0px_0px_#1A1A1B] max-w-lg mx-auto space-y-4 animate-fade-in" id="status-change-modal">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h3 className="font-serif italic font-black text-sm text-purple-300">Ajustar Progresso Físico do Projeto</h3>
                <button 
                  onClick={() => setSelectedDemandaId(null)} 
                  className="text-[10px] font-mono font-bold uppercase text-slate-400 hover:text-white transition-colors"
                >
                  Fechar
                </button>
              </div>

              <form onSubmit={handleStatusChangeSubmit} className="space-y-4">
                <div className="bg-slate-950 p-3.5 rounded-none border border-slate-800 text-xs space-y-1">
                  <span className="text-purple-400 font-mono text-[9px] font-bold uppercase tracking-wider">OBRA SELECIONADA / CONTEXTO</span>
                  <p className="font-bold text-slate-200 font-sans">{selectedDemanda?.titulo}</p>
                  <p className="text-slate-400 font-mono text-[10px] uppercase">Localidade: {getTerritorioNome(selectedDemanda?.territorioId || '')}</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Novo Status da Obra</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {['planejamento', 'licitacao', 'obra', 'concluido', 'frustrado'].map((statusOption) => (
                      <button
                        key={statusOption}
                        type="button"
                        id={`btn-opt-status-${statusOption}`}
                        onClick={() => setNovoStatus(statusOption as Demanda['statusExecucao'])}
                        className={`py-2 px-2 rounded-none border-2 border-[#1A1A1B] text-[10px] font-mono font-bold text-center capitalize transition-all ${
                          novoStatus === statusOption
                            ? statusOption === 'frustrado'
                              ? 'bg-red-600 text-white border-[#1A1A1B]'
                              : statusOption === 'concluido'
                              ? 'bg-emerald-600 text-white border-[#1A1A1B]'
                              : 'bg-purple-700 text-white border-[#1A1A1B]'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-850'
                        }`}
                      >
                        {statusOption}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Warning about systematic compensations */}
                {novoStatus === 'frustrado' && (
                  <div className="bg-red-950/40 border-2 border-red-800 rounded-none p-4 space-y-2.5 text-xs text-red-200">
                    <p className="font-mono font-bold flex items-center gap-1 text-red-300 uppercase tracking-wider">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      Protocolo de Salvaguarda Democrática:
                    </p>
                    <p className="text-[11px] leading-relaxed font-sans text-slate-300">
                      Ao declarar a frustração formal da obra, você ativará o protocolo de compensação do Código Público. O indicador de vulnerabilidade de **{getTerritorioNome(selectedDemanda?.territorioId || '')}** sofrerá um aumento de **+0.10** no regimento do próximo ciclo para que tenham direito a uma fatia maior de orçamento corretivo.
                    </p>
                    
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono font-bold text-red-300 uppercase tracking-wider">Motivo/Justificativa Pública do Impedimento</label>
                      <input
                        type="text"
                        id="input-justificativa-frustrado"
                        placeholder="Ex: Empresa faliu / Licitação deserta..."
                        value={justificativaFrustrado}
                        onChange={(e) => setJustificativaFrustrado(e.target.value)}
                        className="w-full p-2.5 rounded-none bg-slate-950 border-2 border-red-800 text-xs font-mono text-white focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDemandaId(null)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-none text-xs font-mono font-bold uppercase tracking-wider transition-colors border border-[#1A1A1B]"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    id="btn-confirmar-status"
                    className="flex-1 py-2.5 bg-purple-700 hover:bg-[#3B82F6] text-white font-mono font-bold rounded-none text-xs uppercase tracking-wider transition-colors shadow-[2px_2px_0px_0px_#1A1A1B] border border-[#1A1A1B]"
                  >
                    Confirmar Mudança
                  </button>
                </div>
              </form>
            </div>
          );
        })()
      )}

    </div>
  );
}
