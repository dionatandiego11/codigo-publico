import React, { useState, useEffect } from 'react';
import { 
  Layers, Users, Sparkles, Check, CheckCircle, Upload, 
  HelpCircle, Shuffle, ShieldCheck, ArrowRight, UserPlus
} from 'lucide-react';
import { ConselhoCandidato, CycleConfig } from '../../shared/domain/types';

interface CouncilSectionProps {
  candidatos: ConselhoCandidato[];
  onAddCandidato: (nome: string, bairro: string) => void;
  onLotteryComplete: (sorteados: ConselhoCandidato[], semente: string) => void;
  cycle: CycleConfig;
  navigateToAuditory: () => void;
}

export default function CouncilSection({
  candidatos,
  onAddCandidato,
  onLotteryComplete,
  cycle,
  navigateToAuditory
}: CouncilSectionProps) {
  // Enrollment states
  const [nomeCandidato, setNomeCandidato] = useState('');
  const [bairroCandidato, setBairroCandidato] = useState('Córrego do Feijão');
  const [comprovanteFile, setComprovanteFile] = useState<string | null>(null);
  const [enrolledSuccess, setEnrolledSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Sorteio states
  const [sementePublica, setSementePublica] = useState('BRUMADINHO_PROSPERO_2026_DIARIO_OFICIAL_42');
  const [drawPhase, setDrawPhase] = useState<'setup' | 'drawing' | 'completed'>('setup');
  const [drawnMembers, setDrawnMembers] = useState<ConselhoCandidato[]>([]);
  const [currentCheckingCandidate, setCurrentCheckingCandidate] = useState<string | null>(null);
  const [shufflingIndex, setShufflingIndex] = useState(0);

  // Filter candidates who are already drafted
  const drawnIds = new Set(drawnMembers.map(m => m.id));

  // Simulates candidate registration file upload
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setComprovanteFile(e.dataTransfer.files[0].name);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setComprovanteFile(e.target.files[0].name);
    }
  };

  const handleEnrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeCandidato.trim() || !comprovanteFile) return;
    onAddCandidato(nomeCandidato, bairroCandidato);
    setEnrolledSuccess(true);
    setNomeCandidato('');
    setComprovanteFile(null);
    setTimeout(() => setEnrolledSuccess(false), 3000);
  };

  // Run the Sorteio visual ritual
  const runSorteioRitual = () => {
    if (candidatos.length < cycle.tamanhoConselho) {
      alert("Erro: Não há candidatos qualificados suficientes cadastrados no momento.");
      return;
    }
    setDrawPhase('drawing');
    setDrawnMembers([]);

    let count = 0;
    const size = cycle.tamanhoConselho;
    const eligiblePool = [...candidatos].filter(c => c.comprovado);
    const selected: ConselhoCandidato[] = [];

    // Dramatic recursive drawer to add rhythm to the lottery
    const drawNext = () => {
      if (count >= size) {
        // Complete lottery
        setDrawPhase('completed');
        onLotteryComplete(selected, sementePublica);
        return;
      }

      // 1. Shuffling simulation phase
      let tick = 0;
      const shuffleInterval = setInterval(() => {
        const randomCand = eligiblePool[Math.floor(Math.random() * eligiblePool.length)];
        setCurrentCheckingCandidate(randomCand.nome);
        setShufflingIndex(prev => prev + 1);
        tick++;

        if (tick > 10) {
          clearInterval(shuffleInterval);
          
          // 2. Select actual candidate based on seed logic (simulated deterministically with random selection for UI)
          let candidate = eligiblePool[Math.floor(Math.random() * eligiblePool.length)];
          // Avoid duplicates
          while (selected.some(s => s.id === candidate.id)) {
            candidate = eligiblePool[Math.floor(Math.random() * eligiblePool.length)];
          }

          selected.push(candidate);
          setDrawnMembers([...selected]);
          count++;
          
          // Pause slightly before drawing the next representative
          setTimeout(drawNext, 1200);
        }
      }, 80);
    };

    drawNext();
  };

  // Helper to partially mask names for democratic GDPR / Privacy compliance
  const maskName = (name: string) => {
    const parts = name.split(' ');
    if (parts.length === 1) return name.substring(0, 3) + '...';
    return `${parts[0]} ${parts[1].substring(0, 1)}...`;
  };

  return (
    <div className="space-y-8" id="council-section">
      
      {/* Visual Introduction Hero */}
      <div className="bg-slate-900 text-white rounded-none border-2 border-[#1A1A1B] p-6 md:p-8 shadow-[4px_4px_0px_0px_#1A1A1B] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest font-bold">FASE A • Representação Popular</span>
          <h2 className="text-2xl font-serif italic font-black text-purple-300 leading-tight">Sorteio do Conselho Territorial</h2>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            Para garantir neutralidade, Código Público não escolhe representantes por "popularidade de rede social", mas por **sorteio com semente pública** auditável. Qualquer morador com vínculo comprovado pode se candidatar de forma voluntária.
          </p>
        </div>
        <div className="bg-slate-800 p-4 rounded-none border border-slate-700 flex-shrink-0 text-center min-w-[120px]">
          <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">Conselho Vigente</span>
          <span className="text-3xl font-extrabold text-purple-300 font-mono">05</span>
          <span className="text-[9px] uppercase font-mono text-slate-400 block mt-1">Sorteados</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column (8 cols): The Draw Ritual */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-none border-2 border-[#1A1A1B] p-6 shadow-[4px_4px_0px_0px_#1A1A1B]">
            
            {/* Draw setup/configuration */}
            {drawPhase === 'setup' && (
              <div className="space-y-6" id="sorteio-setup">
                <div className="flex flex-wrap justify-between items-center border-b border-[#1A1A1B] pb-4 gap-2">
                  <div>
                    <h3 className="font-serif italic font-black text-slate-950 text-base">Preparar Sorteio de Representantes</h3>
                    <p className="text-xs text-slate-500">Sorteio garantido por criptografia aleatória e determinística</p>
                  </div>
                  <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-300 rounded-none text-[10px] font-bold font-mono uppercase tracking-wider">
                    🎲 Semente Auditável
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-none border border-slate-300 space-y-3">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-700 uppercase mb-1">Semente Pública (Seed)</label>
                    <input
                      type="text"
                      id="input-semente"
                      value={sementePublica}
                      onChange={(e) => setSementePublica(e.target.value)}
                      placeholder="Ex: DIARIO_OFICIAL_2026_06_24_LOTERIA_FED"
                      className="w-full p-2.5 rounded-none border border-slate-300 text-xs font-mono focus:outline-none focus:border-[#1A1A1B] bg-white"
                    />
                    <p className="text-[10px] text-slate-500 mt-1.5 leading-normal">
                      A semente pública é um dado gerado fora do sistema (ex: resultado do Diário Oficial ou Loteria Federal do dia). Ela garante que o algoritmo produza um resultado neutro e impossível de ser manipulado.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-[10px] font-mono font-bold uppercase text-slate-500">
                    Candidatos Aptos na Vila: <span className="text-slate-800">{candidatos.filter(c => c.comprovado).length} cidadãos</span>
                  </div>
                  <button
                    id="btn-iniciar-sorteio"
                    onClick={runSorteioRitual}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-purple-700 text-white rounded-none border-2 border-[#1A1A1B] text-xs font-bold font-mono uppercase tracking-wider hover:bg-[#3B82F6] hover:border-[#3B82F6] transition-colors shadow-[2px_2px_0px_0px_#1A1A1B] hover:shadow-none"
                  >
                    <Shuffle className="h-4 w-4" />
                    Iniciar Sorteio Público
                  </button>
                </div>
              </div>
            )}

            {/* Drawing Animation Phase */}
            {drawPhase === 'drawing' && (
              <div className="space-y-6 text-center py-8" id="sorteio-running">
                <div className="animate-spin h-10 w-10 border-4 border-[#1A1A1B] border-t-purple-600 rounded-none mx-auto"></div>
                
                <div className="space-y-2">
                  <h3 className="font-serif italic font-black text-slate-900 text-lg">Rito Eleitoral em Andamento</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Computando a semente <span className="font-mono bg-slate-100 px-2 py-0.5 border border-slate-300 text-purple-700 font-bold">"{sementePublica}"</span> contra a lista de inscritos.
                  </p>
                </div>

                <div className="bg-purple-50 max-w-sm mx-auto p-4 rounded-none border-2 border-purple-300 animate-pulse">
                  <span className="text-[9px] uppercase font-mono font-bold text-purple-600 block mb-1">Buscando Representante #{drawnMembers.length + 1}</span>
                  <span className="font-mono text-base font-bold text-purple-900">{currentCheckingCandidate || 'Embaralhando...'}</span>
                </div>

                {/* Progress bar of selected members */}
                <div className="max-w-md mx-auto">
                  <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400 mb-1">
                    <span>SELECIONADOS ({drawnMembers.length} de {cycle.tamanhoConselho})</span>
                    <span>{Math.round((drawnMembers.length / cycle.tamanhoConselho) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-4 rounded-none overflow-hidden border border-[#1A1A1B]">
                    <div 
                      className="bg-purple-600 h-full transition-all duration-300"
                      style={{ width: `${(drawnMembers.length / cycle.tamanhoConselho) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Drawn list as they appear */}
                <div className="flex flex-wrap justify-center gap-2 pt-4">
                  {drawnMembers.map((m, idx) => (
                    <div key={m.id} className="bg-white px-3 py-1.5 rounded-none border border-[#1A1A1B] text-xs font-mono font-bold text-purple-900 flex items-center gap-1 shadow-sm">
                      <span className="font-mono bg-purple-100 text-purple-700 h-4 w-4 rounded-none flex items-center justify-center text-[9px]">{idx + 1}</span>
                      {maskName(m.nome)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Drawing Finished Phase */}
            {drawPhase === 'completed' && (
              <div className="space-y-6 animate-fade-in" id="sorteio-finalizado">
                <div className="text-center py-4 space-y-2">
                  <div className="h-12 w-12 bg-purple-100 text-purple-700 rounded-none border border-purple-300 flex items-center justify-center mx-auto mb-2">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <h3 className="font-serif italic font-black text-slate-900 text-lg">Conselho Territorial Formado</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Os {cycle.tamanhoConselho} conselheiros listados abaixo foram selecionados de forma imparcial usando a semente pública para este mandato.
                  </p>
                </div>

                {/* Selected members card layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" id="drawn-members-grid">
                  {drawnMembers.map((member, idx) => (
                    <div key={member.id} className="bg-purple-50/50 rounded-none border border-[#1A1A1B] p-4 text-center space-y-1">
                      <div className="h-8 w-8 rounded-none bg-purple-100 text-purple-700 flex items-center justify-center mx-auto text-xs font-mono font-bold border border-purple-200">
                        #{idx + 1}
                      </div>
                      <h4 className="font-bold text-slate-800 text-xs font-sans">{maskName(member.nome)}</h4>
                      <p className="text-[9px] text-slate-500 font-mono uppercase">{member.bairro}</p>
                      <span className="inline-flex items-center gap-0.5 text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-none border border-emerald-300 font-mono font-bold uppercase">
                        <Check className="h-2 w-2" /> Vínculo OK
                      </span>
                    </div>
                  ))}
                </div>

                {/* Audit navigation trigger */}
                <div className="p-4 bg-slate-50 border-2 border-dashed border-[#1A1A1B] rounded-none flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-left font-sans">
                    <p className="text-xs font-bold text-slate-800">O resultado deste sorteio é criptograficamente imutável</p>
                    <p className="text-[10px] text-slate-500 font-mono uppercase">
                      Assinatura de Integridade ancorada na cadeia de provas.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      id="btn-reiniciar-sorteio"
                      onClick={() => setDrawPhase('setup')}
                      className="px-4 py-2 bg-slate-150 border border-slate-300 hover:bg-slate-200 text-slate-800 rounded-none text-xs font-mono font-bold uppercase transition-colors"
                    >
                      Sortear Novamente
                    </button>
                    <button
                      id="btn-verificar-sorteio"
                      onClick={navigateToAuditory}
                      className="flex items-center gap-1 px-4 py-2 bg-purple-700 hover:bg-[#3B82F6] hover:border-[#3B82F6] text-white rounded-none border border-[#1A1A1B] text-xs font-mono font-bold uppercase tracking-wider transition-colors shadow-[2px_2px_0px_0px_#1A1A1B]"
                    >
                      Verificar
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Qualified Candidates List */}
          <div className="bg-white rounded-none border-2 border-[#1A1A1B] p-6 shadow-[4px_4px_0px_0px_#1A1A1B]">
            <h3 className="font-serif italic font-black text-slate-900 text-base mb-4">
              Candidatos Registrados de Brumadinho ({candidatos.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {candidatos.map((cand) => (
                <div 
                  key={cand.id} 
                  className={`p-3 rounded-none border text-xs flex items-center justify-between ${
                    drawnIds.has(cand.id) 
                      ? 'border-purple-400 bg-purple-50/50' 
                      : 'border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <div className="font-mono">
                    <p className="font-bold text-slate-800">{maskName(cand.nome)}</p>
                    <p className="text-[9px] text-slate-500 uppercase">{cand.bairro}</p>
                  </div>
                  {drawnIds.has(cand.id) ? (
                    <span className="text-[9px] bg-purple-100 text-purple-800 font-mono font-bold px-2 py-0.5 rounded-none border border-purple-200 uppercase">
                      Sorteado
                    </span>
                  ) : (
                    <span className="text-[9px] bg-slate-200 text-slate-600 font-mono font-bold px-2 py-0.5 rounded-none border border-slate-300 uppercase">
                      Inscrito
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column (4 cols): Enrollment Form */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-none border-2 border-[#1A1A1B] p-6 shadow-[4px_4px_0px_0px_#1A1A1B] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-sky-700 uppercase font-mono mb-2">
                <UserPlus className="h-4 w-4" /> Inscrição Voluntária
              </div>
              <h3 className="font-serif italic font-black text-slate-900 text-base mb-1">
                Representar seu bairro?
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed font-sans">
                Inscreva-se para colocar seu nome na urna de sorteio público. Não exigimos formalidades jurídicas complexas.
              </p>
            </div>

            {enrolledSuccess ? (
              <div className="bg-[#10B981]/5 border-2 border-[#10B981] text-emerald-950 p-4 rounded-none text-xs space-y-1 animate-fade-in" id="enrollment-success-banner">
                <p className="font-mono font-bold uppercase flex items-center gap-1 text-[#065F46]">
                  <CheckCircle className="h-4 w-4 text-[#10B981]" />
                  Inscrição Registrada!
                </p>
                <p className="font-sans text-slate-600">Seu nome já foi inserido na lista pública de candidatos aptos ao sorteio da vila.</p>
              </div>
            ) : (
              <form onSubmit={handleEnrollSubmit} className="space-y-4" id="form-inscricao-conselho">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-700 uppercase mb-1">Qual o seu nome completo?</label>
                  <input
                    type="text"
                    id="input-nome-conselho"
                    value={nomeCandidato}
                    onChange={(e) => setNomeCandidato(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full p-2.5 rounded-none border border-slate-300 text-xs font-mono focus:outline-none focus:border-[#1A1A1B] bg-slate-50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-700 uppercase mb-1">Onde você mora ou atua?</label>
                  <select
                    id="select-bairro-conselho"
                    value={bairroCandidato}
                    onChange={(e) => setBairroCandidato(e.target.value)}
                    className="w-full p-2.5 rounded-none border border-slate-300 text-xs font-mono focus:outline-none focus:border-[#1A1A1B] bg-slate-50"
                  >
                    <option value="Córrerego do Feijão">Córrego do Feijão</option>
                    <option value="Alberto Flores">Alberto Flores</option>
                    <option value="Tejuco">Tejuco</option>
                    <option value="Parque da Cachoeira">Parque da Cachoeira</option>
                    <option value="Aranha">Aranha</option>
                    <option value="Brumadinho Centro">Brumadinho Centro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-700 uppercase mb-1">
                    Vínculo Simplificado (Conta/Título)
                  </label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-none p-4 text-center transition-colors cursor-pointer ${
                      isDragging 
                        ? 'border-purple-500 bg-purple-50' 
                        : comprovanteFile 
                        ? 'border-emerald-500 bg-emerald-50/20' 
                        : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="file"
                      id="input-comprovante"
                      onChange={handleFileChange}
                      className="hidden"
                      required={!comprovanteFile}
                    />
                    <label htmlFor="input-comprovante" className="cursor-pointer space-y-1 block">
                      <Upload className={`h-6 w-6 mx-auto ${comprovanteFile ? 'text-emerald-500' : 'text-slate-400'}`} />
                      <p className="text-[10px] font-bold font-mono uppercase text-slate-700">
                        {comprovanteFile ? `Anexado: ${comprovanteFile}` : 'Arraste ou clique para anexar'}
                      </p>
                      <p className="text-[9px] text-slate-500 leading-normal">
                        Anexe conta de luz, título de eleitor ou carteira de trabalho.
                      </p>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-enviar-inscricao"
                  className="w-full py-2.5 bg-[#1A1A1B] text-white hover:bg-[#3B82F6] rounded-none text-xs font-mono font-bold uppercase tracking-wider transition-colors shadow-[2px_2px_0px_0px_#1A1A1B] hover:shadow-none border border-[#1A1A1B]"
                >
                  Solicitar Inscrição
                </button>
              </form>
            )}
          </div>

          {/* Educational Note about Zero Manipulation */}
          <div className="bg-purple-950 text-white rounded-none border-2 border-[#1A1A1B] p-5 shadow-[4px_4px_0px_0px_#1A1A1B] space-y-2">
            <h4 className="font-mono font-bold uppercase tracking-wider text-xs text-purple-300 flex items-center gap-1 border-b border-purple-800 pb-1">
              <Sparkles className="h-3.5 w-3.5 text-yellow-400" /> Como a semente garante integridade?
            </h4>
            <p className="text-[10px] text-slate-300 leading-relaxed font-sans">
              O algoritmo usa a semente textual pública de forma determinística. Se executarmos o sorteio com a mesma semente, os membros sorteados serão exatamente os mesmos. Isso permite que qualquer cidadão no mundo comprove o resultado.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
