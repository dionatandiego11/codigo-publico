import React, { useState } from 'react';
import { 
  Landmark, ShieldAlert, FileText, CheckCircle, XCircle, 
  Scale, MessageSquare, Calendar, AlertTriangle, ArrowRight, Gavel 
} from 'lucide-react';
import { Demanda, Territorio } from '../../shared/domain/types';

interface InstitutionalSectionProps {
  demandas: Demanda[];
  territorios: Territorio[];
  onSetAdmissibilidade: (demandaId: string, admissibilidade: 'admissivel' | 'inadmissivel', justificativa: string) => void;
}

export default function InstitutionalSection({
  demandas,
  territorios,
  onSetAdmissibilidade
}: InstitutionalSectionProps) {
  // Filter active state: 'filter-form' | 'divergences'
  const [subTab, setSubTab] = useState<'filter-form' | 'divergences'>('filter-form');
  
  // Selected demand to judge
  const [judgingDemandaId, setJudgingDemandaId] = useState<string | null>(null);
  const [admissibilidadeStatus, setAdmissibilidadeStatus] = useState<'admissivel' | 'inadmissivel'>('admissivel');
  const [justificativaTexto, setJustificativaTexto] = useState('');

  const getTerritorioNome = (id: string) => {
    return territorios.find(t => t.id === id)?.nome || 'Brumadinho';
  };

  const handleJudgementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!judgingDemandaId) return;
    
    // Strict front-end enforcement: justification must have content
    if (admissibilidadeStatus === 'inadmissivel' && justificativaTexto.trim().length < 15) {
      alert("Aviso de Conformidade Democrática: Para barrar uma proposta comunitária, é obrigatório preencher uma justificativa legal de no mínimo 15 caracteres.");
      return;
    }

    onSetAdmissibilidade(
      judgingDemandaId, 
      admissibilidadeStatus, 
      admissibilidadeStatus === 'inadmissivel' ? justificativaTexto : 'Aprovado na análise técnica e de admissibilidade regimental municipal.'
    );
    
    // reset states
    setJudgingDemandaId(null);
    setJustificativaTexto('');
  };

  // Divergences list (where popular approved proposal was marked inadmissible or has divergente status)
  const divergencias = demandas.filter(d => d.divergente || (d.admissibilidadeMarcar === 'inadmissivel' && d.passouPopular));

  return (
    <div className="space-y-8" id="institutional-section">
      
      {/* Tab bar header inside institutional view */}
      <div className="flex flex-wrap border-b-2 border-[#1A1A1B]" id="institutional-sub-tabs">
        <button
          onClick={() => setSubTab('filter-form')}
          className={`py-3 px-6 text-xs font-mono font-bold uppercase tracking-wider border-r-2 border-t-2 border-[#1A1A1B] flex items-center gap-1.5 transition-all ${
            subTab === 'filter-form'
              ? 'bg-[#1A1A1B] text-white border-b-2 border-b-[#1A1A1B]'
              : 'bg-white text-slate-600 hover:bg-slate-100 border-b-2 border-b-transparent'
          }`}
        >
          <Gavel className="h-4 w-4" />
          Filtro e Admissibilidade Formal
        </button>
        <button
          onClick={() => setSubTab('divergences')}
          className={`py-3 px-6 text-xs font-mono font-bold uppercase tracking-wider border-r-2 border-t-2 border-[#1A1A1B] flex items-center gap-1.5 transition-all relative ${
            subTab === 'divergences'
              ? 'bg-[#1A1A1B] text-white border-b-2 border-b-[#1A1A1B]'
              : 'bg-white text-slate-600 hover:bg-slate-100 border-b-2 border-b-transparent'
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          Incidentes de Divergência Pública
          {divergencias.length > 0 && (
            <span className="absolute -top-1 right-2 bg-red-600 text-white text-[9px] font-mono font-bold h-4.5 w-4.5 rounded-none flex items-center justify-center animate-pulse border border-[#1A1A1B]">
              {divergencias.length}
            </span>
          )}
        </button>
      </div>

      {subTab === 'filter-form' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="subtab-admissibilidade">
          {/* Left panel: List of proposals awaiting judging */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-none border-2 border-[#1A1A1B] p-6 shadow-[4px_4px_0px_0px_#1A1A1B]">
              <div className="flex flex-wrap justify-between items-center border-b border-[#1A1A1B] pb-3 mb-4 gap-2">
                <h3 className="font-serif italic font-black text-slate-950 text-base">Propostas da Comunidade em Análise</h3>
                <span className="text-[10px] text-slate-500 font-mono font-bold uppercase">Triagem Técnica Inicial</span>
              </div>

              <div className="space-y-4">
                {demandas.map((demanda) => {
                  const isSelected = judgingDemandaId === demanda.id;
                  return (
                    <div 
                      key={demanda.id}
                      className={`p-4 rounded-none border-2 transition-all ${
                        isSelected 
                          ? 'border-amber-500 bg-amber-50/20' 
                          : 'border-slate-300 bg-slate-50/40 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex flex-wrap justify-between items-start gap-2 mb-2 pb-1.5 border-b border-dashed border-slate-200">
                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                          Vila: {getTerritorioNome(demanda.territorioId)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {demanda.passouPopular ? (
                            <span className="text-[9px] font-bold font-mono uppercase bg-sky-50 text-sky-800 px-2 py-0.5 rounded-none border border-sky-300">
                              Quórum Atingido
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold font-mono uppercase bg-slate-200 text-slate-600 px-2 py-0.5 rounded-none border border-slate-300">
                              Apoios: {demanda.apoiosCount}
                            </span>
                          )}
                          <span className={`text-[9px] font-bold font-mono uppercase px-2 py-0.5 rounded-none border ${
                            demanda.admissibilidadeMarcar === 'admissivel'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : demanda.admissibilidadeMarcar === 'inadmissivel'
                              ? 'bg-red-50 text-red-800 border-red-300'
                              : 'bg-slate-200 text-slate-700 border-slate-300'
                          }`}>
                            {demanda.admissibilidadeMarcar || 'pendente'}
                          </span>
                        </div>
                      </div>

                      <h4 className="font-bold text-slate-900 text-xs mb-1 font-sans leading-tight">{demanda.titulo}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-4">
                        {demanda.descricao}
                      </p>

                      <button
                        id={`btn-julgar-${demanda.id}`}
                        onClick={() => {
                          setJudgingDemandaId(demanda.id);
                          setAdmissibilidadeStatus(demanda.admissibilidadeMarcar === 'inadmissivel' ? 'inadmissivel' : 'admissivel');
                          setJustificativaTexto(demanda.justificativaInadmissibilidade || '');
                        }}
                        className="py-1 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-[#1A1A1B] rounded-none text-[10px] font-mono font-bold uppercase tracking-wider transition-colors"
                      >
                        Avaliar Admissibilidade Legal
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right panel: Admissibility judge box */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-none border-2 border-[#1A1A1B] p-6 shadow-[4px_4px_0px_0px_#1A1A1B] sticky top-24">
              <h3 className="font-serif italic font-black text-slate-950 text-base mb-4 flex items-center gap-1.5 text-amber-900">
                <Landmark className="h-5 w-5 text-amber-800" />
                Voto Técnico da Admissibilidade
              </h3>

              {judgingDemandaId ? (
                (() => {
                  const judgedDemanda = demandas.find(d => d.id === judgingDemandaId);
                  return (
                    <form onSubmit={handleJudgementSubmit} className="space-y-4" id="form-julgar-admissibilidade">
                      <div className="bg-slate-50 p-3.5 rounded-none border border-slate-300">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">Analisando proposta</span>
                        <h4 className="font-bold text-xs text-slate-900 mt-1 font-sans">{judgedDemanda?.titulo}</h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-3">
                          {judgedDemanda?.descricao}
                        </p>
                      </div>

                      {/* Decisão radio selection */}
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-slate-700 uppercase tracking-wider mb-1.5">Veredito Admissível?</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            type="button"
                            id="btn-admissibilidade-sim"
                            onClick={() => {
                              setAdmissibilidadeStatus('admissivel');
                              setJustificativaTexto('');
                            }}
                            className={`py-2 px-3 rounded-none text-[10px] font-mono font-bold uppercase transition-all text-center flex items-center justify-center gap-1.5 border-2 ${
                              admissibilidadeStatus === 'admissivel'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-600'
                                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                            Admissível
                          </button>
                          <button
                            type="button"
                            id="btn-admissibilidade-nao"
                            onClick={() => setAdmissibilidadeStatus('inadmissivel')}
                            className={`py-2 px-3 rounded-none text-[10px] font-mono font-bold uppercase transition-all text-center flex items-center justify-center gap-1.5 border-2 ${
                              admissibilidadeStatus === 'inadmissivel'
                                ? 'bg-red-50 text-red-800 border-red-600'
                                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <XCircle className="h-4 w-4 text-red-600" />
                            Inadmissível
                          </button>
                        </div>
                      </div>

                      {/* Mandatory Justification Input (Forced by UI) */}
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Justificativa Legal / Técnica 
                          {admissibilidadeStatus === 'inadmissivel' && <span className="text-red-500"> (Obrigatório)</span>}
                        </label>
                        <textarea
                          id="textarea-justificativa"
                          rows={4}
                          placeholder={
                            admissibilidadeStatus === 'inadmissivel'
                              ? "Indique o artigo da lei complementar municipal, o impacto ambiental proibitivo ou o conflito de faixa de domínio estadual..."
                              : "Observações ou notas técnicas complementares..."
                          }
                          value={justificativaTexto}
                          onChange={(e) => setJustificativaTexto(e.target.value)}
                          className="w-full p-2.5 rounded-none border border-slate-300 text-xs bg-slate-50 focus:outline-none focus:border-[#1A1A1B] font-mono"
                          required={admissibilidadeStatus === 'inadmissivel'}
                        ></textarea>
                        
                        {admissibilidadeStatus === 'inadmissivel' && (
                          <div className="bg-red-50 border-2 border-red-200 text-red-950 p-3 rounded-none text-[10px] mt-2 space-y-1">
                            <span className="font-mono font-bold uppercase text-[9px] text-red-800 block">Salvaguarda Democrática:</span>
                            <p className="font-sans leading-relaxed text-slate-700">Toda rejeição parlamentar de iniciativas populares de Brumadinho exige justificativa pública pormenorizada sob pena de nulidade constitucional automática.</p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setJudgingDemandaId(null)}
                          className="flex-1 py-2 bg-slate-150 hover:bg-slate-200 text-slate-700 rounded-none text-[10px] font-mono font-bold uppercase tracking-wider transition-colors border border-slate-300"
                        >
                          Fechar
                        </button>
                        <button
                          type="submit"
                          id="btn-salvar-admissibilidade"
                          disabled={admissibilidadeStatus === 'inadmissivel' && justificativaTexto.trim().length < 15}
                          className={`flex-1 py-2 rounded-none text-[10px] font-mono font-bold uppercase tracking-wider transition-colors border border-[#1A1A1B] text-white shadow-[2px_2px_0px_0px_#1A1A1B] hover:shadow-none ${
                            admissibilidadeStatus === 'inadmissivel' && justificativaTexto.trim().length < 15
                              ? 'bg-slate-300 cursor-not-allowed text-slate-500 border-slate-300'
                              : 'bg-amber-600 hover:bg-[#3B82F6]'
                          }`}
                        >
                          Salvar Decisão
                        </button>
                      </div>

                    </form>
                  );
                })()
              ) : (
                <div className="text-center py-12 text-slate-400 space-y-3">
                  <Scale className="h-10 w-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wide">Selecione uma proposta para julgar</p>
                  <p className="text-[11px] leading-relaxed max-w-xs mx-auto text-slate-500">
                    Nesta área, os técnicos ou parlamentares exercem o filtro formal de competência governamental.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {subTab === 'divergences' && (
        <div className="space-y-6" id="subtab-divergencias">
          <div className="bg-white rounded-none border-2 border-[#1A1A1B] p-6 shadow-[4px_4px_0px_0px_#1A1A1B]">
            <div className="max-w-2xl border-b border-slate-200 pb-4 mb-6">
              <h3 className="font-serif italic font-black text-slate-950 text-base mb-1">
                Confronto Político e Transparência Radical
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                O **Incidente de Divergência** é uma inovação democrática do Código Público. Quando a população alcança o apoio necessário para propor uma ideia legítima, mas o Legislativo decide bloqueá-la formalmente, o sistema não engaveta o processo em silêncio. Ele eleva a questão a esta página pública indexável para que a contradição entre o bairro e a Câmara permaneça visível.
              </p>
            </div>

            {divergencias.length === 0 ? (
              <div className="bg-emerald-50 border-2 border-emerald-300 py-10 px-6 text-center text-emerald-900 rounded-none max-w-xl mx-auto space-y-2">
                <CheckCircle className="h-10 w-10 text-emerald-600 mx-auto" />
                <p className="text-xs font-mono font-bold uppercase tracking-wide text-emerald-800">Harmonia Democrática Vigente</p>
                <p className="text-[11px] text-slate-600 font-sans leading-relaxed">Nenhum impasse ativo identificado. Todas as demandas apoiadas pela comunidade estão autorizadas pelo Legislativo municipal.</p>
              </div>
            ) : (
              <div className="space-y-6" id="divergences-timeline-list">
                {divergencias.map((demanda) => (
                  <div key={demanda.id} className="border-l-4 border-red-500 bg-red-50/5 rounded-none border border-slate-300 p-6 shadow-sm space-y-4">
                    <div className="flex flex-wrap justify-between items-start gap-2 border-b border-dashed border-slate-200 pb-2">
                      <div>
                        <span className="text-[10px] font-mono text-red-600 font-bold uppercase block tracking-wider">
                          IMPASSE EM: {getTerritorioNome(demanda.territorioId).toUpperCase()}
                        </span>
                        <h4 className="text-sm font-bold text-slate-950 mt-1 font-sans leading-tight">{demanda.titulo}</h4>
                      </div>
                      <span className="text-[9px] bg-red-100 text-red-800 border border-red-300 font-mono px-2.5 py-1 rounded-none font-bold uppercase tracking-wider">
                        Divergência Ativa
                      </span>
                    </div>

                    {/* Timeline representation of the dispute */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Popular Column */}
                      <div className="bg-white p-4 rounded-none border border-slate-200 space-y-2 relative">
                        <div className="absolute top-2.5 right-2.5 bg-sky-100 text-sky-800 text-[9px] font-bold px-2 py-0.5 rounded-none font-mono uppercase border border-sky-200">
                          👥 Popular
                        </div>
                        <h5 className="font-bold text-xs text-slate-900 font-sans">Deliberação da Comunidade</h5>
                        <p className="text-[11px] text-slate-500 leading-relaxed italic">
                          "{demanda.descricao}"
                        </p>
                        <div className="text-[10px] text-sky-800 font-mono font-bold pt-1 border-t border-slate-100 mt-2">
                          Assinaturas Coletadas: {demanda.apoiosCount} de {demanda.apoiosNecessarios}
                        </div>
                      </div>

                      {/* Legislative Column */}
                      <div className="bg-white p-4 rounded-none border border-red-200 space-y-2 relative">
                        <div className="absolute top-2.5 right-2.5 bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-none font-mono uppercase border border-amber-200">
                          🏛️ Legislativo
                        </div>
                        <h5 className="font-bold text-xs text-red-900 font-sans">Veto de Admissibilidade</h5>
                        <p className="text-[11px] text-red-950 font-mono italic bg-red-50/50 p-2.5 rounded-none border border-red-100 leading-relaxed">
                          "{demanda.justificativaDivergencia || demanda.justificativaInadmissibilidade}"
                        </p>
                        <div className="text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-100 mt-2">
                          Bloqueio formal registrado por vereadores de Brumadinho.
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-relaxed font-sans pt-1 border-t border-slate-100">
                      Por determinação do Rito de Código Público, esta visualização confrontada assegura que o veto dos vereadores que rejeitaram a iniciativa popular seja conhecido nominalmente e rastreado no boletim de controle social local.
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
