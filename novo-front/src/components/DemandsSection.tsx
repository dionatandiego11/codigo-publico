import React, { useEffect, useState } from 'react';
import { 
  GitFork, Merge, CheckCircle, XCircle, MessageSquare, 
  Heart, Lock, Copy, PlusCircle, ArrowRight, Coins, 
  TrendingUp, User, MapPin, Calendar, HelpCircle, Info, Shield
} from 'lucide-react';
import { Territorio, CycleConfig, Demanda, Comment } from '../types';

interface DemandsSectionProps {
  territorios: Territorio[];
  demandas: Demanda[];
  cycle: CycleConfig;
  onAddDemanda: (titulo: string, descricao: string, territorioId: string) => void;
  onApoiar: (demandaId: string) => void;
  onAddComentario: (demandaId: string, texto: string) => void;
  onForkDemanda: (demandaId: string, novoTitulo: string, novaDescricao: string) => void;
  onVote: (demandaId: string) => string; // returns recipe hash
}

export default function DemandsSection({
  territorios,
  demandas,
  cycle,
  onAddDemanda,
  onApoiar,
  onAddComentario,
  onForkDemanda,
  onVote
}: DemandsSectionProps) {
  const [selectedTerritorioId, setSelectedTerritorioId] = useState<string>(territorios[0]?.id || '');
  
  // Form states
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [showNovoForm, setShowNovoForm] = useState(false);

  // Fork states
  const [forkingDemandaId, setForkingDemandaId] = useState<string | null>(null);
  const [forkTitulo, setForkTitulo] = useState('');
  const [forkDescricao, setForkDescricao] = useState('');

  // Comment state
  const [comentariosInputs, setComentariosInputs] = useState<Record<string, string>>({});

  // Secret ballot state
  const [votedReceipt, setVotedReceipt] = useState<string | null>(null);
  const [votingDemandaId, setVotingDemandaId] = useState<string | null>(null);
  const [isCastingVote, setIsCastingVote] = useState(false);
  const [copiedReceipt, setCopiedReceipt] = useState(false);
  const [fusionSubmitted, setFusionSubmitted] = useState(false);

  useEffect(() => {
    if (territorios.length === 0) return;
    const selectedStillExists = territorios.some(t => t.id === selectedTerritorioId);
    if (!selectedTerritorioId || !selectedStillExists) {
      setSelectedTerritorioId(territorios[0].id);
    }
  }, [selectedTerritorioId, territorios]);

  const selectedTerritorio = territorios.find(t => t.id === selectedTerritorioId);
  const filteredDemandas = demandas.filter(d => d.territorioId === selectedTerritorioId);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  const handleSubmitDemanda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoTitulo.trim() || !novaDescricao.trim()) return;
    onAddDemanda(novoTitulo, novaDescricao, selectedTerritorioId);
    setNovoTitulo('');
    setNovaDescricao('');
    setShowNovoForm(false);
  };

  const handleForkSubmit = (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!forkTitulo.trim() || !forkDescricao.trim()) return;
    onForkDemanda(parentId, forkTitulo, forkDescricao);
    setForkTitulo('');
    setForkDescricao('');
    setForkingDemandaId(null);
  };

  const handleAddCommentSubmit = (demandaId: string) => {
    const text = comentariosInputs[demandaId];
    if (!text || !text.trim()) return;
    onAddComentario(demandaId, text);
    setComentariosInputs(prev => ({ ...prev, [demandaId]: '' }));
  };

  const triggerVoting = (demandaId: string) => {
    setVotingDemandaId(demandaId);
    setIsCastingVote(true);
    setVotedReceipt(null);
    setCopiedReceipt(false);

    setTimeout(() => {
      const receipt = onVote(demandaId);
      setVotedReceipt(receipt);
      setIsCastingVote(false);
    }, 1800);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  return (
    <div className="space-y-8" id="demands-section">
      
      {/* 1. Territory Selector & Budget Breakdown */}
      <div className="bg-white rounded-none border-2 border-[#1A1A1B] p-6 shadow-[4px_4px_0px_0px_#1A1A1B]">
        <h2 className="text-base font-black uppercase tracking-tight text-slate-900 mb-4 flex items-center gap-2 font-display">
          <MapPin className="h-5 w-5 text-[#3B82F6]" id="map-pin-icon" />
          Selecione seu Território para Participar
        </h2>
        
        {/* Horizontal tabs of Territories */}
        <div className="flex flex-wrap gap-2 pb-3 mb-6 border-b border-[#1A1A1B]">
          {territorios.map((t) => (
            <button
              key={t.id}
              id={`btn-territorio-${t.id}`}
              onClick={() => {
                setSelectedTerritorioId(t.id);
                setVotedReceipt(null);
                setVotingDemandaId(null);
              }}
              className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all border ${
                selectedTerritorioId === t.id
                  ? 'bg-[#1A1A1B] text-white border-[#1A1A1B]'
                  : 'bg-slate-100 text-[#1A1A1B] border-slate-300 hover:border-[#1A1A1B] hover:bg-slate-200'
              }`}
            >
              {t.nome}
            </button>
          ))}
        </div>

        {/* Sub-envelope layout */}
        {selectedTerritorio && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch" id="budget-breakdown">
            {/* Box 1: Quanto dinheiro sobrou para o seu bairro */}
            <div className="bg-[#3B82F6]/5 rounded-none border-2 border-[#1A1A1B] p-5 md:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#3B82F6] font-bold flex items-center gap-1">
                    <Coins className="h-4 w-4" /> Sub-envelope Orçamentário
                  </span>
                  <span className="text-[9px] font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded-none border border-blue-200 font-bold uppercase">
                    Fórmula Local Regimental
                  </span>
                </div>
                <h3 className="text-base font-serif italic font-black text-slate-900 mb-1">
                  Quanto dinheiro sobrou para o seu bairro
                </h3>
                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  O orçamento total disponível para o território é o resultado da soma de um piso igual para todas as vilas mais uma quantia proporcional calculada com base na carência estrutural e tamanho populacional do local.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#1A1A1B]/15">
                <div>
                  <span className="text-[9px] font-mono uppercase font-bold text-slate-500 block">Piso Garantido</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 font-mono">{formatCurrency(selectedTerritorio.pisoIgual)}</span>
                </div>
                <div>
                  <span className="text-[9px] font-mono uppercase font-bold text-slate-500 block">Parcela Carência</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 font-mono">+{formatCurrency(selectedTerritorio.parcelaCarencia)}</span>
                </div>
                <div className="bg-[#3B82F6]/10 rounded-none border border-[#3B82F6]/30 p-1.5 px-2.5 text-right">
                  <span className="text-[9px] font-mono uppercase font-bold text-[#3B82F6] block">TOTAL VILA</span>
                  <span className="text-sm sm:text-base font-extrabold text-[#1A1A1B] font-mono">{formatCurrency(selectedTerritorio.totalOrcamento)}</span>
                </div>
              </div>
            </div>

            {/* Box 2: Vulnerabilidade / Carência */}
            <div className="bg-[#F59E0B]/5 rounded-none border-2 border-[#1A1A1B] p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-700 font-bold flex items-center gap-1 mb-2">
                  <TrendingUp className="h-4 w-4" /> Bairros com mais necessidade
                </span>
                <h3 className="text-base font-serif italic font-black text-slate-900 mb-1">
                  Índice de Carência
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4 font-sans">
                  Define o percentual de prioridade territorial. Áreas com menos infraestrutura recebem uma fatia maior dos recursos.
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-600 font-medium font-sans">Fator de carência local:</span>
                  <span className="font-bold text-amber-700 font-mono">{(selectedTerritorio.indiceCarencia * 10).toFixed(1)} / 10.0</span>
                </div>
                <div className="w-full bg-slate-200 h-4 rounded-none overflow-hidden border border-[#1A1A1B]">
                  <div 
                    className="bg-[#F59E0B] h-full" 
                    style={{ width: `${selectedTerritorio.indiceCarencia * 100}%` }}
                  ></div>
                </div>
                <span className="text-[9px] font-mono text-slate-400 mt-1.5 block">População vinculada registrada: {selectedTerritorio.populacao} cidadãos</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Main content: Propose and Vote */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left/Middle: Demands list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b-2 border-[#1A1A1B] pb-3">
            <h2 className="text-xl font-serif italic font-black text-slate-900">
              Demandas Ativas ({filteredDemandas.length})
            </h2>
            <button
              id="btn-abrir-nova-demanda"
              onClick={() => setShowNovoForm(!showNovoForm)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1A1A1B] text-white rounded-none border-2 border-[#1A1A1B] text-xs font-bold uppercase tracking-wider hover:bg-[#3B82F6] hover:border-[#3B82F6] transition-colors shadow-[2px_2px_0px_0px_#1A1A1B] hover:shadow-none"
            >
              <PlusCircle className="h-4 w-4" />
              Sugerir Ideia Simples
            </button>
          </div>

          {/* New demand form */}
          {showNovoForm && (
            <div className="bg-white rounded-none border-2 border-[#1A1A1B] p-6 shadow-[4px_4px_0px_0px_#1A1A1B] animate-fade-in" id="form-nova-demanda">
              <div className="flex items-center justify-between mb-4 border-b border-[#1A1A1B] pb-2">
                <h3 className="font-bold text-slate-900 font-mono text-xs uppercase tracking-wider">Cadastrar uma ideia básica</h3>
                <button 
                  onClick={() => setShowNovoForm(false)} 
                  className="text-xs text-red-600 hover:underline font-mono uppercase font-bold"
                >
                  [Cancelar]
                </button>
              </div>
              <form onSubmit={handleSubmitDemanda} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-700 uppercase mb-1">Título em linguagem direta e natural</label>
                  <input
                    type="text"
                    id="input-titulo"
                    placeholder="Exemplo: Falta de médico pediatra no PSF"
                    value={novoTitulo}
                    onChange={(e) => setNovoTitulo(e.target.value)}
                    className="w-full p-2.5 rounded-none border border-slate-300 font-mono text-xs focus:outline-none focus:border-[#1A1A1B] focus:ring-1 focus:ring-[#1A1A1B] bg-slate-50"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Evite termos técnicos. Fale como se estivesse explicando o problema ao seu vizinho.</p>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-700 uppercase mb-1">O que precisa ser resolvido? (Descrição Livre)</label>
                  <textarea
                    id="input-descricao"
                    rows={3}
                    placeholder="Conte o que está acontecendo e como isso afeta as famílias do bairro."
                    value={novaDescricao}
                    onChange={(e) => setNovaDescricao(e.target.value)}
                    className="w-full p-2.5 rounded-none border border-slate-300 text-xs focus:outline-none focus:border-[#1A1A1B] focus:ring-1 focus:ring-[#1A1A1B] bg-slate-50"
                    required
                  ></textarea>
                </div>
                <button
                  type="submit"
                  id="btn-enviar-demanda"
                  className="w-full py-2.5 bg-[#3B82F6] text-white border-2 border-[#1A1A1B] font-mono text-xs font-bold uppercase tracking-wider hover:bg-blue-600 transition-colors shadow-[2px_2px_0px_0px_#1A1A1B]"
                >
                  Publicar Proposta na Comunidade
                </button>
              </form>
            </div>
          )}

          {/* List of demands */}
          {filteredDemandas.length === 0 ? (
            <div className="bg-slate-50 rounded-none border-2 border-dashed border-slate-300 py-12 px-6 text-center text-slate-500">
              <HelpCircle className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold font-mono">Nenhuma demanda ativa neste território ainda.</p>
              <p className="text-xs text-slate-400 mt-1">Seja o primeiro a enviar uma ideia básica clicando no botão acima!</p>
            </div>
          ) : (
            <div className="space-y-6" id="demands-list">
              {filteredDemandas.map((demanda) => {
                const isCouncilApproved = demanda.admissibilidadeMarcar === 'admissivel';
                const isLegislativeVetoed = demanda.admissibilidadeMarcar === 'inadmissivel';
                const showForkForm = forkingDemandaId === demanda.id;

                return (
                  <div 
                    key={demanda.id} 
                    id={`demanda-card-${demanda.id}`}
                    className={`bg-white rounded-none border-2 transition-all p-6 shadow-[4px_4px_0px_0px_#1A1A1B] flex flex-col justify-between ${
                      demanda.divergente 
                        ? 'border-red-300 ring-1 ring-red-100 bg-red-50/10' 
                        : isLegislativeVetoed
                        ? 'border-amber-200 bg-amber-50/5'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Header: Title, tags, Fork origin */}
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex flex-wrap gap-1.5">
                          {/* Actor Badge: Protocolar */}
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-none text-[9px] font-mono font-bold uppercase tracking-wider border ${
                            demanda.passouProtocolar 
                              ? 'bg-[#10B981]/10 text-[#065F46] border-[#10B981]' 
                              : 'bg-slate-50 text-slate-400 border-slate-300'
                          }`}>
                            <CheckCircle className="h-3 w-3" /> 🔧 Protocolar: {demanda.passouProtocolar ? 'Apto' : 'Análise'}
                          </span>

                          {/* Actor Badge: Popular */}
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-none text-[9px] font-mono font-bold uppercase tracking-wider border ${
                            demanda.passouPopular 
                              ? 'bg-[#3B82F6]/10 text-[#1E3A8A] border-[#3B82F6]' 
                              : 'bg-slate-50 text-slate-400 border-slate-300'
                          }`}>
                            <Heart className="h-3 w-3" /> 👥 Popular: {demanda.passouPopular ? 'Quórum Atingido' : 'Em Curso'}
                          </span>

                          {/* Legislative filter status */}
                          {demanda.admissibilidadeMarcar && (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-none text-[9px] font-mono font-bold uppercase tracking-wider border ${
                              demanda.admissibilidadeMarcar === 'admissivel' 
                                ? 'bg-[#10B981]/15 text-[#065F46] border-[#10B981]' 
                                : 'bg-red-50 text-red-700 border-red-300'
                            }`}>
                              🏛️ Câmara: {demanda.admissibilidadeMarcar === 'admissivel' ? 'Admissível' : 'Barrada'}
                            </span>
                          )}

                          {/* Execution tracker status */}
                          {demanda.statusExecucao && (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-none text-[9px] font-mono font-bold uppercase tracking-wider border ${
                              demanda.statusExecucao === 'concluido' 
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-400'
                                : demanda.statusExecucao === 'frustrado'
                                ? 'bg-red-100 text-red-800 border-red-400'
                                : 'bg-amber-100 text-amber-800 border-amber-400'
                            }`}>
                              🚧 Obra: {demanda.statusExecucao}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">CRIADO EM {demanda.dataCriacao}</span>
                      </div>

                      {demanda.forkId && (
                        <div className="mb-3 inline-flex items-center gap-1 text-[10px] bg-sky-50 text-sky-800 px-2.5 py-1 rounded-none font-mono border border-sky-300 uppercase">
                          <GitFork className="h-3 w-3 text-sky-600" /> Ramificação: 
                          <span className="font-bold underline">{demanda.parentTitulo}</span>
                        </div>
                      )}

                      <h3 className="text-xl sm:text-2xl font-serif italic font-black text-slate-900 mb-2 leading-none">
                        {demanda.titulo}
                      </h3>
                      <p className="text-xs text-slate-600 mb-5 leading-relaxed font-sans">
                        {demanda.descricao}
                      </p>

                      {/* Warnings: Legislative vetos & divergence incidents */}
                      {demanda.divergente && (
                        <div className="mb-5 bg-red-50 border-2 border-red-600 rounded-none p-4 text-xs text-red-800">
                          <h4 className="font-mono font-bold uppercase tracking-wider flex items-center gap-1 text-xs mb-1.5 text-red-900">
                            ⚠️ Incidente de Divergência Institucional Ativado!
                          </h4>
                          <p className="mb-2 font-sans text-slate-700 leading-normal">
                            A comunidade deliberou e apoiou esta proposta, mas o corpo de vereadores votou formalmente pela rejeição ou bloqueio sob a seguinte justificativa:
                          </p>
                          <blockquote className="border-l-4 border-red-600 pl-3 py-1 bg-red-100/30 font-mono italic text-red-950 mb-2.5 text-xs">
                            "{demanda.justificativaDivergencia || demanda.justificativaInadmissibilidade}"
                          </blockquote>
                          <p className="text-[10px] text-slate-500 font-mono">
                            Esse veto político é tornado público por design para garantir transparência plena.
                          </p>
                        </div>
                      )}

                      {isLegislativeVetoed && !demanda.divergente && (
                        <div className="mb-5 bg-amber-50 border-2 border-[#F59E0B] rounded-none p-4 text-xs text-amber-800">
                          <h4 className="font-mono font-bold uppercase tracking-wider flex items-center gap-1 text-xs mb-1.5 text-amber-900">
                            🏛️ Inadmissibilidade Formal Declarada
                          </h4>
                          <p className="font-mono italic bg-white p-2.5 rounded-none border border-amber-200">
                            "{demanda.justificativaInadmissibilidade}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Footer parts */}
                    <div className="space-y-4 pt-4 border-t border-slate-200 mt-auto">
                      
                      {/* Portões / Progression Status */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch bg-slate-50 p-4 rounded-none border-2 border-[#1A1A1B]">
                        {/* 1. Portão Protocolar details */}
                        <div className="flex flex-col justify-between">
                          <div className="text-[9px] font-mono font-bold uppercase text-slate-500 mb-1.5 flex items-center gap-1">
                            🔧 Checagem Básica (Protocolar)
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs">
                              {demanda.criteriaProtocolar.vinculoValido ? <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> : <XCircle className="h-3.5 w-3.5 text-slate-400" />}
                              <span className="text-slate-600 font-sans">Autor vinculado ao território</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs">
                              {demanda.criteriaProtocolar.dadosMinimos ? <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> : <XCircle className="h-3.5 w-3.5 text-slate-400" />}
                              <span className="text-slate-600 font-sans">Formulário mínimo completo</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs">
                              {demanda.criteriaProtocolar.interessePublico ? <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> : <XCircle className="h-3.5 w-3.5 text-slate-400" />}
                              <span className="text-slate-600 font-sans">Competência de investimento municipal</span>
                            </div>
                          </div>
                        </div>

                        {/* 2. Portão Popular Progression */}
                        <div className="flex flex-col justify-between">
                          <div className="flex items-center justify-between text-[9px] font-mono font-bold uppercase text-[#3B82F6] mb-1.5">
                            <span>👥 Apoio da Comunidade</span>
                            <span>{demanda.apoiosCount} / {demanda.apoiosNecessarios}</span>
                          </div>
                          <div className="w-full bg-slate-200 h-4 rounded-none overflow-hidden mb-1.5 border border-[#1A1A1B]">
                            <div 
                              className={`h-full ${demanda.passouPopular ? 'bg-[#3B82F6]' : 'bg-blue-400'}`}
                              style={{ width: `${Math.min(100, (demanda.apoiosCount / demanda.apoiosNecessarios) * 100)}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono uppercase">
                            <span>Meta local (3%)</span>
                            <span className="font-bold">{demanda.passouPopular ? 'Apto! 🎉' : `${Math.max(0, demanda.apoiosNecessarios - demanda.apoiosCount)} apoios restantes`}</span>
                          </div>
                        </div>
                      </div>

                      {/* Interactive Section: Support / Fork / Secret Ballot */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        {/* Support Button */}
                        <button
                          id={`btn-apoiar-${demanda.id}`}
                          onClick={() => onApoiar(demanda.id)}
                          disabled={demanda.passouPopular}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-mono font-bold uppercase tracking-wider transition-all border-2 ${
                            demanda.passouPopular
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-400 cursor-not-allowed opacity-75'
                              : 'bg-white text-[#1A1A1B] border-[#1A1A1B] hover:bg-[#3B82F6] hover:text-white hover:border-[#3B82F6] shadow-[2px_2px_0px_0px_#1A1A1B] hover:shadow-none'
                          }`}
                        >
                          <Heart className={`h-3.5 w-3.5 ${demanda.passouPopular ? 'fill-emerald-500 stroke-emerald-500' : ''}`} />
                          {demanda.passouPopular ? 'Apoiada' : 'Apoiar'}
                        </button>

                        {/* Fork Button */}
                        <button
                          id={`btn-fork-${demanda.id}`}
                          onClick={() => {
                            setForkingDemandaId(forkingDemandaId === demanda.id ? null : demanda.id);
                            setForkTitulo(`Alternativa para: ${demanda.titulo}`);
                            setForkDescricao('');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-none border border-[#1A1A1B] text-xs font-bold font-mono text-purple-700 bg-purple-50 hover:bg-purple-100 shadow-[2px_2px_0px_0px_#1A1A1B] hover:shadow-none transition-all"
                        >
                          <GitFork className="h-3.5 w-3.5" />
                          Ramificar (Criar Fork)
                        </button>

                        {/* Secret Ballot button - if passed both gates */}
                        {demanda.passouProtocolar && demanda.passouPopular && !demanda.divergente && !isLegislativeVetoed && (
                          <button
                            id={`btn-votar-${demanda.id}`}
                            onClick={() => triggerVoting(demanda.id)}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-none border-2 border-[#1A1A1B] text-xs font-bold font-mono text-white bg-[#1A1A1B] hover:bg-[#3B82F6] hover:border-[#3B82F6] shadow-[2px_2px_0px_0px_#1A1A1B] hover:shadow-none transition-all"
                          >
                            <Lock className="h-3.5 w-3.5 text-[#10B981]" />
                            Urna Municipal: Votar
                          </button>
                        )}
                      </div>

                      {/* Visual Git Tree Diagram if it is a fork or has been forked */}
                      {(demanda.forkId || demandas.some(d => d.forkId === demanda.id)) && (
                        <div className="p-3 bg-slate-50 rounded-none border border-dashed border-slate-400 flex flex-col space-y-1.5 text-xs">
                          <span className="font-mono font-bold text-slate-600 uppercase text-[10px] flex items-center gap-1">
                            <GitFork className="h-3.5 w-3.5 text-purple-500" /> Árvore de Ramificações (Git Metaphor)
                          </span>
                          <div className="flex items-center space-x-2 font-mono text-[10px] text-slate-400 pl-4 border-l-2 border-purple-300">
                            <span className="text-slate-600 bg-slate-200 px-1 py-0.5 rounded-none">main</span>
                            <ArrowRight className="h-3 w-3" />
                            <span className="font-semibold text-slate-700">
                              {demanda.forkId ? demanda.parentTitulo : demanda.titulo}
                            </span>
                            {demandas.filter(d => d.forkId === demanda.id || (demanda.forkId && d.id === demanda.id)).map(f => (
                              <React.Fragment key={f.id}>
                                <span className="text-purple-400">|</span>
                                <span className="text-purple-700 bg-purple-50 px-1 py-0.5 rounded-none border border-purple-200">
                                  fork-{f.id.split('-')[1]} ({f.titulo.substring(0, 15)}...)
                                </span>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Interactive Fork Form Box */}
                      {showForkForm && (
                        <div className="bg-purple-50/50 rounded-none p-4 border border-purple-300 animate-fade-in" id="fork-form-container">
                          <h4 className="text-[10px] font-mono font-bold text-purple-900 uppercase mb-2 flex items-center gap-1">
                            <GitFork className="h-3.5 w-3.5" /> Ramificar Demanda de Origem
                          </h4>
                          <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
                            Crie uma ramificação (fork) para propor uma alternativa técnica, orçamentária ou física diferente para resolver o mesmo problema base. O apoio popular será contado separadamente para testar a preferência da comunidade.
                          </p>
                          <form onSubmit={(e) => handleForkSubmit(e, demanda.id)} className="space-y-3">
                            <div>
                              <input
                                type="text"
                                placeholder="Título alternativo"
                                value={forkTitulo}
                                onChange={(e) => setForkTitulo(e.target.value)}
                                className="w-full p-2.5 rounded-none border border-slate-300 text-xs bg-white focus:outline-none font-mono"
                                required
                              />
                            </div>
                            <div>
                              <textarea
                                placeholder="Explique como sua solução proposta se diferencia ou otimiza o problema original..."
                                rows={2}
                                value={forkDescricao}
                                onChange={(e) => setForkDescricao(e.target.value)}
                                className="w-full p-2.5 rounded-none border border-slate-300 text-xs bg-white focus:outline-none font-sans"
                                required
                              ></textarea>
                            </div>
                            <button
                              type="submit"
                              className="px-3 py-1.5 bg-purple-700 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-none border border-purple-900 hover:bg-purple-800 shadow-[2px_2px_0px_0px_#1A1A1B] hover:shadow-none transition-all"
                            >
                              Confirmar Ramificação (Fork)
                            </button>
                          </form>
                        </div>
                      )}

                      {/* Comments Threads */}
                      <div className="space-y-2 pt-2">
                        <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                          <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
                          Debates da Comunidade ({demanda.comentarios.length})
                        </div>
                        
                        {demanda.comentarios.length > 0 && (
                          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                            {demanda.comentarios.map((c) => (
                              <div key={c.id} className="bg-slate-50/80 p-2.5 rounded-none text-xs border border-slate-300">
                                <div className="flex justify-between items-center text-[9px] font-mono uppercase text-slate-500 mb-0.5">
                                  <span className="flex items-center gap-1 text-slate-700 font-bold">
                                    <User className="h-2.5 w-2.5" /> {c.autor}
                                  </span>
                                  <span>{c.data}</span>
                                </div>
                                <p className="text-slate-600 leading-relaxed font-sans">{c.texto}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Comentar Input */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Escreva um comentário público legítimo..."
                            value={comentariosInputs[demanda.id] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setComentariosInputs(prev => ({ ...prev, [demanda.id]: val }));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddCommentSubmit(demanda.id);
                            }}
                            className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-none text-xs focus:outline-none focus:border-[#1A1A1B]"
                          />
                          <button
                            onClick={() => handleAddCommentSubmit(demanda.id)}
                            className="px-3 bg-slate-100 hover:bg-[#1A1A1B] hover:text-white rounded-none text-xs font-mono font-bold uppercase tracking-wider border border-slate-400 transition-colors"
                          >
                            Postar
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right side panel: Voting result & Duplicates Check (Unificação) */}
        <div className="space-y-6">
          {/* Secret ballot drawer / active state indicator */}
          <div className="bg-white rounded-none border-2 border-[#1A1A1B] p-6 shadow-[4px_4px_0px_0px_#1A1A1B]">
            <h3 className="font-mono font-bold uppercase tracking-wider text-slate-900 text-xs mb-3 flex items-center gap-2 border-b border-slate-200 pb-1.5">
              <Lock className="h-4 w-4 text-emerald-600" /> Cabine de Voto Sigiloso
            </h3>

            {isCastingVote ? (
              <div className="py-6 text-center space-y-3 font-mono" id="voting-casting-loader">
                <div className="animate-spin h-8 w-8 border-4 border-[#1A1A1B] border-t-[#3B82F6] rounded-none mx-auto"></div>
                <p className="text-[10px] font-bold text-slate-700 animate-pulse">
                  CRIPTOGRAFANDO VOTO...
                </p>
                <p className="text-[9px] text-slate-400 px-4 leading-normal">
                  A urna eletrônica de Código Público está gerando provas de zero conhecimento para resguardar sua escolha.
                </p>
              </div>
            ) : votedReceipt ? (
              <div className="bg-[#10B981]/5 border-2 border-[#10B981] rounded-none p-4 space-y-3 animate-fade-in" id="receipt-container">
                <div className="flex items-center gap-1.5 text-xs text-[#065F46] font-bold font-mono uppercase tracking-wider">
                  <CheckCircle className="h-4 w-4 text-[#10B981]" />
                  Voto Computado!
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  Geramos o seu **Comprovante de seu voto (Recibo Opaco)**. Ele prova matematicamente na cadeia pública que seu voto foi computado, mas não revela em qual proposta você votou para manter o sigilo absoluto.
                </p>
                
                <div className="bg-slate-900 p-2.5 rounded-none border border-slate-800 font-mono text-[9px] text-[#10B981] break-all select-all flex items-start justify-between gap-1">
                  <span>{votedReceipt}</span>
                  <button 
                    onClick={() => copyToClipboard(votedReceipt)}
                    className="p-1 hover:bg-slate-800 rounded-none text-slate-400 hover:text-white transition-colors"
                    title="Copiar Recibo"
                    id="btn-copy-receipt"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                
                {copiedReceipt && (
                  <p className="text-[9px] text-emerald-700 font-bold font-mono text-right">✓ Recibo copiado!</p>
                )}

                <p className="text-[9px] text-slate-400 font-mono italic">
                  Guarde esse código e pesquise-o na aba "Cadeia de Auditoria" para confirmar a integridade.
                </p>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 space-y-2">
                <Info className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700">Urna Eletrônica Pronta</p>
                <p className="text-[11px] text-slate-500 px-2 leading-relaxed">
                  Quando uma proposta de {selectedTerritorio?.nome} passar pela "Checagem Básica" e pelo "Apoio da Comunidade", o botão de voto aparecerá no card.
                </p>
              </div>
            )}
          </div>

          {/* Merge Sugestion Panel (Unificação de Demandas Parecidas) */}
          <div className="bg-indigo-50/40 border-2 border-[#1A1A1B] rounded-none p-5 shadow-[4px_4px_0px_0px_#1A1A1B] space-y-3">
            <h3 className="font-bold text-indigo-900 text-xs uppercase font-mono tracking-wider flex items-center gap-1.5 border-b border-indigo-200 pb-1.5">
              <Merge className="h-4 w-4 text-indigo-700" /> Sugestões de Unificação
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              Para evitar que o apoio popular seja dividido em propostas parecidas, nossa checagem de proximidade semântica sugere agrupamentos automáticos.
            </p>

            {filteredDemandas.length >= 2 ? (
              <div className="bg-white border border-indigo-200 rounded-none p-3 space-y-2 text-xs shadow-sm">
                <div className="flex items-center gap-1 text-indigo-800 font-bold font-mono uppercase text-[9px]">
                  <Info className="h-3 w-3" /> Alta proximidade de conteúdo!
                </div>
                <div className="text-[10px] font-mono text-slate-500 space-y-1 pl-1">
                  <p>1. <span className="font-bold text-slate-700">{filteredDemandas[0].titulo.substring(0, 30)}...</span></p>
                  <p>2. <span className="font-bold text-slate-700">{filteredDemandas[1].titulo.substring(0, 30)}...</span></p>
                </div>
                <p className="text-[10px] text-indigo-600 font-sans">
                  Deseja sugerir a unificação sob um único branch principal para somar as assinaturas?
                </p>
                {fusionSubmitted ? (
                  <div className="bg-emerald-50 text-emerald-800 border border-emerald-300 p-2 text-center text-[10px] font-mono font-bold uppercase">
                    ✓ Solicitação de Fusão Enviada!
                  </div>
                ) : (
                  <button
                    id="btn-sugerir-unificacao"
                    onClick={() => setFusionSubmitted(true)}
                    className="w-full py-1.5 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-none border border-indigo-800 text-[10px] font-mono font-bold uppercase tracking-wider transition-all"
                  >
                    Solicitar Fusão de Ideias
                  </button>
                )}
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 italic font-mono uppercase">
                Nenhum duplicado flagrante identificado no momento para este bairro.
              </p>
            )}
          </div>

          {/* Dicionário de Legitimidade Educacional */}
          <div className="bg-slate-900 rounded-none border-2 border-[#1A1A1B] p-5 text-white shadow-[4px_4px_0px_0px_#1A1A1B] space-y-3">
            <h3 className="font-mono font-bold uppercase text-xs text-sky-400 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
              <Shield className="h-4 w-4 text-emerald-400" /> Guia Democrático de Termos
            </h3>
            <p className="text-[11px] text-slate-300">
              No Código Público, os termos complexos da política foram reescritos para serem compreendidos por todos:
            </p>
            <div className="space-y-2 text-[10px]">
              <div>
                <span className="font-semibold text-slate-200 font-mono">Checagem Básica</span> (Portão Protocolar):
                <p className="text-slate-400">Verificação automática se a ideia cumpre dados mínimos e leis.</p>
              </div>
              <div>
                <span className="font-semibold text-slate-200 font-mono">Apoio da Comunidade</span> (Portão Popular):
                <p className="text-slate-400">Arrecadação de assinaturas de vizinhos para validar o clamor local.</p>
              </div>
              <div>
                <span className="font-semibold text-slate-200 font-mono">Comprovante de seu Voto</span> (Recibo Opaco):
                <p className="text-slate-400">Comprova que seu voto entrou na contagem sem que ninguém saiba o que você votou.</p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
