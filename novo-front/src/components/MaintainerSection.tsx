import React, { useState } from 'react';
import { Settings, Coins, Users, Calendar, TrendingUp, Info, ShieldAlert, Check } from 'lucide-react';
import { CycleConfig, Territorio } from '../types';

interface MaintainerSectionProps {
  cycle: CycleConfig;
  territorios: Territorio[];
  onUpdateRegimento: (updatedCycle: Partial<CycleConfig>) => void;
}

export default function MaintainerSection({
  cycle,
  territorios,
  onUpdateRegimento
}: MaintainerSectionProps) {
  // Local form states
  const [pisoIgualBase, setPisoIgualBase] = useState(cycle.pisoIgualBase);
  const [parcelaCarenciaTotal, setParcelaCarenciaTotal] = useState(cycle.parcelaCarenciaTotal);
  const [limiarApoioPercentual, setLimiarApoioPercentual] = useState(cycle.limiarApoioPercentual);
  const [tamanhoConselho, setTamanhoConselho] = useState(cycle.tamanhoConselho);
  const [prazoDias, setPrazoDias] = useState(cycle.prazoDias);

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Real-time calculation of budgets to show the maintainer the impact of their decisions
  const somaPonderadaCarencia = territorios.reduce(
    (acc, t) => acc + t.populacao * t.indiceCarencia,
    0
  );

  const simulatedTerritorios = territorios.map((t) => {
    const piso = pisoIgualBase;
    const parcela = somaPonderadaCarencia > 0
      ? (t.populacao * t.indiceCarencia / somaPonderadaCarencia) * parcelaCarenciaTotal
      : 0;
    
    return {
      ...t,
      pisoIgual: piso,
      parcelaCarencia: Math.round(parcela),
      totalOrcamento: Math.round(piso + parcela),
      assinaturasNecessarias: Math.round(t.populacao * limiarApoioPercentual)
    };
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateRegimento({
      pisoIgualBase,
      parcelaCarenciaTotal,
      limiarApoioPercentual,
      tamanhoConselho,
      prazoDias
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-8" id="maintainer-section">
      
      {/* Intro Warning */}
      <div className="bg-amber-50 border-2 border-dashed border-amber-300 text-amber-950 rounded-none p-5 text-xs space-y-2 shadow-[2px_2px_0px_0px_#1A1A1B]">
        <h3 className="font-serif italic font-black text-sm flex items-center gap-1.5 text-amber-950">
          <ShieldAlert className="h-5 w-5 text-amber-700" />
          Aviso Importante de Arquitetura Democrática
        </h3>
        <p className="leading-relaxed font-sans">
          O rito do **Código Público** separa estritamente o **Kernel** (as regras invioláveis como a existência de portões, conselho sorteado e integridade criptográfica) do **Regimento** (valores calibráveis por município). Aqui, você altera apenas os números regimentais locais. Qualquer alteração aqui é refletida em tempo real nas fórmulas matemáticas de sub-envelope e quóruns de assinaturas do cidadão.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: Parameter adjustments */}
        <form onSubmit={handleFormSubmit} className="lg:col-span-5 bg-white rounded-none border-2 border-[#1A1A1B] p-6 shadow-[4px_4px_0px_0px_#1A1A1B] space-y-6" id="form-maintainer">
          <div className="flex items-center gap-1.5 border-b-2 border-[#1A1A1B] pb-3">
            <Settings className="h-5 w-5 text-rose-600" />
            <h3 className="font-serif italic font-black text-slate-950 text-base">Ajustes do Regimento</h3>
          </div>

          {/* Budget Envelope breakdown fields */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">Envelope Orçamentário Comum</h4>
            
            <div className="space-y-1">
              <label className="block text-[10px] font-mono font-bold text-slate-700 uppercase tracking-wider">Piso Garantido por Território (R$)</label>
              <input
                type="number"
                id="input-piso-base"
                value={pisoIgualBase}
                onChange={(e) => setPisoIgualBase(Number(e.target.value))}
                className="w-full p-2.5 rounded-none border-2 border-[#1A1A1B] text-xs focus:outline-none focus:border-rose-500 bg-slate-50 font-mono text-slate-900"
                min="100000"
                step="50000"
                required
              />
              <span className="text-[10px] text-slate-400 block mt-0.5 leading-relaxed font-sans">Dinheiro fixo inicial recebido por cada vila independentemente da população.</span>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-mono font-bold text-slate-700 uppercase tracking-wider">Fundo Geral por Carência (R$)</label>
              <input
                type="number"
                id="input-parcela-carencia"
                value={parcelaCarenciaTotal}
                onChange={(e) => setParcelaCarenciaTotal(Number(e.target.value))}
                className="w-full p-2.5 rounded-none border-2 border-[#1A1A1B] text-xs focus:outline-none focus:border-rose-500 bg-slate-50 font-mono text-slate-900"
                min="500000"
                step="100000"
                required
              />
              <span className="text-[10px] text-slate-400 block mt-0.5 leading-relaxed font-sans">Recurso extra distribuído proporcionalmente ao indicador social de vulnerabilidade de cada vila.</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-none border-2 border-[#1A1A1B] text-white">
              <span className="text-[9px] uppercase font-bold text-slate-400 font-mono block tracking-wider">ENVELOPE TOTAL DA CIDADE</span>
              <p className="text-lg font-black font-mono mt-1 text-emerald-400 leading-none">
                {formatCurrency(pisoIgualBase * territorios.length + parcelaCarenciaTotal)}
              </p>
            </div>
          </div>

          {/* Social/Democratic thresholds */}
          <div className="space-y-4 pt-4 border-t-2 border-dashed border-[#1A1A1B]">
            <h4 className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">Parâmetros Sociais e Quóruns</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-mono font-bold text-slate-700 uppercase tracking-wider">Limiar Popular (%)</label>
                <select
                  id="select-limiar-popular"
                  value={limiarApoioPercentual}
                  onChange={(e) => setLimiarApoioPercentual(Number(e.target.value))}
                  className="w-full p-2.5 rounded-none border-2 border-[#1A1A1B] text-xs focus:outline-none focus:border-rose-500 bg-slate-50 font-mono text-slate-900"
                >
                  <option value={0.01}>1% da População</option>
                  <option value={0.02}>2% da População</option>
                  <option value={0.03}>3% (Padrão)</option>
                  <option value={0.05}>5% da População</option>
                </select>
                <span className="text-[9px] text-slate-400 block mt-0.5 font-sans leading-normal">Meta de assinaturas do portão popular.</span>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono font-bold text-slate-700 uppercase tracking-wider">Tamanho Conselho</label>
                <select
                  id="select-tamanho-conselho"
                  value={tamanhoConselho}
                  onChange={(e) => setTamanhoConselho(Number(e.target.value))}
                  className="w-full p-2.5 rounded-none border-2 border-[#1A1A1B] text-xs focus:outline-none focus:border-rose-500 bg-slate-50 font-mono text-slate-900"
                >
                  <option value={3}>3 Membros (Min)</option>
                  <option value={5}>5 Membros (Rec)</option>
                  <option value={7}>7 Membros (Max)</option>
                </select>
                <span className="text-[9px] text-slate-400 block mt-0.5 font-sans leading-normal">Representantes sorteados para o mandato.</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-mono font-bold text-slate-700 uppercase tracking-wider">Prazo de Maturação (Dias)</label>
              <input
                type="number"
                id="input-prazo-dias"
                value={prazoDias}
                onChange={(e) => setPrazoDias(Number(e.target.value))}
                className="w-full p-2.5 rounded-none border-2 border-[#1A1A1B] text-xs focus:outline-none focus:border-rose-500 bg-slate-50 font-mono text-slate-900"
                min="15"
                max="90"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            {savedSuccess && (
              <div className="bg-emerald-50 border-2 border-emerald-500 text-emerald-900 p-2.5 rounded-none text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 animate-fade-in" id="maintainer-success-badge">
                <Check className="h-4 w-4 text-emerald-600" />
                Regimento Gravado!
              </div>
            )}
            <button
              type="submit"
              id="btn-gravar-regimento"
              className="w-full py-2.5 bg-rose-600 text-white hover:bg-[#3B82F6] rounded-none text-xs font-mono font-bold uppercase tracking-wider transition-colors border-2 border-[#1A1A1B] shadow-[3px_3px_0px_0px_#1A1A1B] hover:shadow-none"
            >
              Gravar Alterações
            </button>
          </div>
        </form>

        {/* Right Panel: Impact simulation grid */}
        <div className="lg:col-span-7 bg-white rounded-none border-2 border-[#1A1A1B] p-6 shadow-[4px_4px_0px_0px_#1A1A1B] space-y-6">
          <div>
            <h3 className="font-serif italic font-black text-slate-950 text-base leading-tight">Simulação de Impacto Territorial em Tempo Real</h3>
            <p className="text-xs text-slate-500 font-sans mt-1">
              Veja abaixo como as vilas de Brumadinho reagem instantaneamente às modificações nos limites do envelope.
            </p>
          </div>

          <div className="overflow-x-auto border-2 border-[#1A1A1B]" id="simulation-grid">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-[#1A1A1B] bg-slate-100 text-slate-800 uppercase tracking-wider font-mono text-[9px] font-bold">
                  <th className="py-3 px-3">Vila / Território</th>
                  <th className="py-3 px-3 text-right">População</th>
                  <th className="py-3 px-3 text-center">Fator Carência</th>
                  <th className="py-3 px-3 text-right">Piso Fixo</th>
                  <th className="py-3 px-3 text-right font-bold text-slate-900">Envelope Total</th>
                  <th className="py-3 px-3 text-right text-sky-800">Apoios Exigidos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-sans">
                {simulatedTerritorios.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900">{t.nome}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-500">{t.populacao}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="bg-amber-100 text-amber-950 border border-amber-300 font-bold px-1.5 py-0.5 rounded-none font-mono text-[10px]">
                        {(t.indiceCarencia * 10).toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-500 font-mono">{formatCurrency(t.pisoIgual)}</td>
                    <td className="py-3 px-3 text-right font-extrabold text-slate-950 font-mono bg-slate-50/50">{formatCurrency(t.totalOrcamento)}</td>
                    <td className="py-3 px-3 text-right font-bold font-mono text-sky-800">{t.assinaturasNecessarias}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Interactive Information Explainer */}
          <div className="bg-rose-50 border-2 border-dashed border-rose-200 rounded-none p-4 space-y-2 text-xs">
            <h4 className="font-mono font-bold uppercase tracking-wider text-rose-950 flex items-center gap-1">
              <Info className="h-4 w-4 text-rose-700" /> Fórmulas Matemáticas de Distribuição:
            </h4>
            <div className="space-y-1.5 text-[11px] text-slate-700 leading-relaxed font-mono">
              <p>1. <span className="font-bold text-slate-900 uppercase">Sub-envelope Total</span> = Piso Fixo + (Fração de Carência Ponderada)</p>
              <p>2. <span className="font-bold text-slate-900 uppercase">Fração Carência</span> = (População × Fator Carência) / Somatório de todos os Territórios</p>
              <p>3. <span className="font-bold text-slate-900 uppercase">Apoios Exigidos</span> = População × Percentual do Limiar (Arredondado)</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
