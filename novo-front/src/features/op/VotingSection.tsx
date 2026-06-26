import { CheckCircle, Copy, Info, Lock, MapPin, Vote } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CycleConfig, Demanda, Territorio } from '../../shared/domain/types';

interface VotingSectionProps {
  territorios: Territorio[];
  demandas: Demanda[];
  cycle: CycleConfig;
  onVote: (demandaId: string) => string;
}

function isEligibleForVoting(demanda: Demanda) {
  return (
    demanda.passouProtocolar &&
    demanda.passouPopular &&
    demanda.admissibilidadeMarcar !== 'inadmissivel' &&
    !demanda.divergente
  );
}

export default function VotingSection({ territorios, demandas, cycle, onVote }: VotingSectionProps) {
  const [selectedTerritorioId, setSelectedTerritorioId] = useState<string>(territorios[0]?.id || '');
  const [selectedDemandId, setSelectedDemandId] = useState<string | null>(null);
  const [isCastingVote, setIsCastingVote] = useState(false);
  const [votedReceipt, setVotedReceipt] = useState<string | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  useEffect(() => {
    if (territorios.length === 0) return;
    const selectedStillExists = territorios.some(t => t.id === selectedTerritorioId);
    if (!selectedTerritorioId || !selectedStillExists) {
      setSelectedTerritorioId(territorios[0].id);
    }
  }, [selectedTerritorioId, territorios]);

  const selectedTerritorio = territorios.find(t => t.id === selectedTerritorioId);
  const eligibleDemandas = demandas.filter(demanda => demanda.territorioId === selectedTerritorioId && isEligibleForVoting(demanda));
  const votingOpen = cycle.faseAtual === 'votacao';

  const triggerVoting = (demandaId: string) => {
    if (!votingOpen) return;
    setSelectedDemandId(demandaId);
    setIsCastingVote(true);
    setVotedReceipt(null);
    setCopiedReceipt(false);

    setTimeout(() => {
      const receipt = onVote(demandaId);
      setVotedReceipt(receipt);
      setIsCastingVote(false);
    }, 1200);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  return (
    <div className="space-y-8" id="voting-section">
      <section className="border-2 border-[#1A1A1B] bg-white p-6 shadow-[4px_4px_0px_0px_#1A1A1B]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 border border-purple-300 bg-purple-50 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-purple-800">
              <Vote className="h-3.5 w-3.5" />
              Fase da esteira: votação territorial
            </div>
            <h1 className="font-serif text-2xl font-black italic text-slate-950">Votação Territorial</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              As propostas aparecem aqui depois de passarem pela checagem protocolar e pelo apoio mínimo da comunidade.
            </p>
          </div>

          <div className={`border-2 p-4 ${votingOpen ? 'border-emerald-500 bg-emerald-50' : 'border-amber-400 bg-amber-50'}`}>
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-600">Status da urna</span>
            <strong className={`mt-1 block text-sm ${votingOpen ? 'text-emerald-800' : 'text-amber-800'}`}>
              {votingOpen ? 'Aberta para voto' : 'Aguardando fase Votação'}
            </strong>
          </div>
        </div>
      </section>

      <section className="border-2 border-[#1A1A1B] bg-white p-5 shadow-[3px_3px_0px_0px_#1A1A1B]">
        <div className="mb-4 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-blue-600" />
          <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900">Território votante</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {territorios.map(territorio => (
            <button
              key={territorio.id}
              onClick={() => {
                setSelectedTerritorioId(territorio.id);
                setSelectedDemandId(null);
                setVotedReceipt(null);
              }}
              className={`border px-4 py-2 font-mono text-xs font-bold uppercase transition-colors ${
                selectedTerritorioId === territorio.id
                  ? 'border-[#1A1A1B] bg-[#1A1A1B] text-white'
                  : 'border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-500'
              }`}
            >
              {territorio.nome}
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-[#1A1A1B] pb-3">
            <h2 className="font-serif text-xl font-black italic text-slate-950">
              Propostas aptas ({eligibleDemandas.length})
            </h2>
            <span className="font-mono text-[10px] font-bold uppercase text-slate-500">{selectedTerritorio?.nome}</span>
          </div>

          {eligibleDemandas.length === 0 ? (
            <div className="border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-slate-500">
              <Info className="mx-auto mb-2 h-9 w-9 text-slate-300" />
              <p className="font-mono text-xs font-bold uppercase">Nenhuma proposta apta para este território.</p>
              <p className="mt-1 text-xs">Demandas precisam passar pelos portões protocolar e popular antes da votação.</p>
            </div>
          ) : (
            eligibleDemandas.map(demanda => (
              <article
                key={demanda.id}
                className={`border-2 bg-white p-5 shadow-[3px_3px_0px_0px_#1A1A1B] ${
                  selectedDemandId === demanda.id ? 'border-purple-500' : 'border-slate-200'
                }`}
              >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="border border-emerald-300 bg-emerald-50 px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-emerald-800">
                    Checagem ok
                  </span>
                  <span className="border border-blue-300 bg-blue-50 px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-blue-800">
                    {demanda.apoiosCount}/{demanda.apoiosNecessarios} apoios
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-950">{demanda.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{demanda.descricao}</p>
                <button
                  onClick={() => triggerVoting(demanda.id)}
                  disabled={!votingOpen || isCastingVote}
                  className={`mt-4 inline-flex items-center gap-2 border-2 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                    votingOpen
                      ? 'border-[#1A1A1B] bg-[#1A1A1B] text-white hover:bg-purple-700'
                      : 'cursor-not-allowed border-slate-300 bg-slate-100 text-slate-400'
                  }`}
                >
                  <Lock className="h-4 w-4" />
                  {votingOpen ? 'Registrar voto' : 'Votação fechada'}
                </button>
              </article>
            ))
          )}
        </section>

        <aside className="space-y-4">
          <div className="border-2 border-[#1A1A1B] bg-slate-900 p-5 text-white shadow-[4px_4px_0px_0px_#1A1A1B]">
            <div className="mb-4 flex items-center gap-2 border-b border-slate-700 pb-3">
              <Lock className="h-4 w-4 text-emerald-300" />
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider">Recibo opaco</h2>
            </div>

            {isCastingVote ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin border-4 border-slate-600 border-t-blue-400" />
                <p className="font-mono text-[10px] font-bold uppercase text-slate-300">Registrando voto...</p>
              </div>
            ) : votedReceipt ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-emerald-300">
                  <CheckCircle className="h-4 w-4" />
                  Voto computado
                </div>
                <div className="flex items-start gap-2 border border-slate-700 bg-slate-950 p-3 font-mono text-[9px] text-emerald-300">
                  <span className="break-all">{votedReceipt}</span>
                  <button
                    onClick={() => copyToClipboard(votedReceipt)}
                    className="border border-slate-700 p-1 text-slate-300 hover:bg-slate-800 hover:text-white"
                    title="Copiar recibo"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                {copiedReceipt && <p className="text-right font-mono text-[9px] font-bold uppercase text-emerald-300">Recibo copiado</p>}
              </div>
            ) : (
              <p className="text-xs leading-relaxed text-slate-300">
                Quando a votação estiver aberta, selecione uma proposta apta para emitir seu recibo.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
