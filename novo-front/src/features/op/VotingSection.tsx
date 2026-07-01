import { Building2, CheckCircle2, Copy, Info, Lock, MapPin, Vote } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { CycleConfig, OPVoting, Territorio } from '../../shared/domain/types';
import { opApi } from './api';
import { mapOPVoting } from './adapters';

interface VotingSectionProps {
  territorios: Territorio[];
  cycle: CycleConfig;
  userTerritoryId?: string;
}

export default function VotingSection({ territorios, cycle, userTerritoryId }: VotingSectionProps) {
  const defaultTerritory = territorios.find(t => t.id === userTerritoryId)?.id || territorios[0]?.id || '';
  const [territoryId, setTerritoryId] = useState(defaultTerritory);
  const [votings, setVotings] = useState<OPVoting[]>([]);
  const [selectedVotingId, setSelectedVotingId] = useState<string | null>(null);
  const [votedVotingIds, setVotedVotingIds] = useState<Set<string>>(() => new Set());
  const [receipt, setReceipt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [voteLoading, setVoteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userTerritoryId && territorios.some(t => t.id === userTerritoryId)) setTerritoryId(userTerritoryId);
  }, [territorios, userTerritoryId]);

  const loadVotings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiVotings = territoryId
        ? await opApi.opVotingsByTerritory(territoryId)
        : await opApi.opVotings();
      setVotings(apiVotings.map(mapOPVoting));
    } catch (err) {
      console.warn('Não foi possível carregar votações OP.', err);
      setVotings([]);
    } finally {
      setLoading(false);
    }
  }, [territoryId]);

  useEffect(() => { void loadVotings(); }, [loadVotings]);

  const territory = territorios.find(item => item.id === territoryId);
  const openVotings = votings.filter(v => v.status === 'Aberta');
  const closedVotings = votings.filter(v => v.status === 'Encerrada');
  const votingOpen = cycle.faseAtual === 'votacao';

  const castVote = async (votingId: string, selection: 'Aprovo' | 'Rejeito' | 'Abstenção') => {
    if (!votingOpen || voteLoading) return;
    setVoteLoading(true);
    setError(null);
    try {
      const response = await opApi.castOPVote(votingId, selection);
      setReceipt(response.receiptCode);
      setSelectedVotingId(votingId);
      setVotedVotingIds(current => new Set(current).add(votingId));
      setCopied(false);
      // Atualizar os dados da votação com os resultados atualizados.
      setVotings(prev =>
        prev.map(v => v.id === response.voting.id ? mapOPVoting(response.voting) : v)
      );
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar voto.');
    } finally {
      setVoteLoading(false);
    }
  };

  const copyReceipt = async () => {
    if (!receipt) return;
    await navigator.clipboard.writeText(receipt);
    setCopied(true);
  };

  return (
    <div className="space-y-6" id="voting-section">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-sm font-semibold text-purple-700">A voz da nossa comunidade 🗳️</span>
          <h1 className="mt-1 font-display text-2xl font-bold text-slate-950">Votação Popular</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Chegou a hora de decidir! Abaixo estão as propostas do seu bairro que passaram pela análise da prefeitura e estão prontas para receber seu voto.
          </p>
        </div>
        <div className={`min-w-48 border-l-4 p-3 ${votingOpen ? 'border-emerald-500 bg-emerald-50' : 'border-amber-400 bg-amber-50'}`}>
          <span className="block text-xs text-slate-500">Situação</span>
          <strong className={`block text-sm ${votingOpen ? 'text-emerald-800' : 'text-amber-800'}`}>
            {votingOpen ? 'Votação aberta para participação!' : 'A votação ainda não começou'}
          </strong>
        </div>
      </header>

      <section className="flex flex-col gap-4 border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center bg-purple-100 text-purple-700"><MapPin className="h-5 w-5" /></span>
          <div>
            <span className="block text-xs text-slate-500">Seu território de votação</span>
            <strong className="block text-sm text-slate-900">{territory?.nome || 'Não identificado'}</strong>
          </div>
        </div>
        {!userTerritoryId && (
          <select value={territoryId} onChange={event => setTerritoryId(event.target.value)} className="h-10 border border-slate-300 bg-white px-3 text-sm outline-none focus:border-purple-600">
            {territorios.map(item => <option key={item.id} value={item.id}>{item.nome}</option>)}
          </select>
        )}
        <p className="max-w-lg text-xs leading-5 text-slate-500">
          Demandas territoriais são votadas por quem vive no local afetado. Demandas municipais aparecem para todos.
        </p>
      </section>

      {error && (
        <div className="border-l-4 border-red-500 bg-red-50 p-4 text-sm text-red-800">{error}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-300 pb-3">
            <h2 className="font-display text-lg font-bold text-slate-950">Propostas em votação</h2>
            <span className="text-sm text-slate-500">{openVotings.length} abertas</span>
          </div>

          {loading ? (
            <div className="border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <p className="text-sm text-slate-500">Carregando votações…</p>
            </div>
          ) : openVotings.length === 0 ? (
            <div className="border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <Info className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-800">Nenhuma proposta em votação</p>
              <p className="mt-1 text-sm text-slate-500">As propostas aparecerão quando concluírem a maturação e a análise.</p>
            </div>
          ) : openVotings.map((voting) => (
            <article key={voting.id} className={`border bg-white p-5 ${selectedVotingId === voting.id ? 'border-purple-500 ring-1 ring-purple-200' : 'border-slate-200'}`}>
              <div className="flex gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap gap-2 text-xs">
                    <span className="bg-emerald-100 px-2 py-1 font-semibold text-emerald-800">Votação aberta</span>
                    {(() => {
                      const isMunicipal = voting.scope === 'municipio' || voting.scope === 'municipal' || voting.scope === 'Escopo municipal';
                      return (
                        <span className={`px-2 py-1 font-semibold ${isMunicipal ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                          {isMunicipal ? 'Escopo Municipal' : 'Escopo Territorial'}
                        </span>
                      );
                    })()}
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 text-slate-500">
                      <MapPin className="h-3.5 w-3.5" />{voting.territoryName}
                    </span>
                    <span className="text-slate-400">até {new Date(voting.deadline).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <h3 className="text-base font-bold leading-6 text-slate-950">{voting.title}</h3>
                  <p className="mt-1.5 text-sm leading-5 text-slate-600">{voting.summary}</p>

                  <div className="mt-3 grid grid-cols-3 gap-3 border-t border-slate-100 pt-3 text-center text-xs">
                    <div>
                      <span className="block text-lg font-bold text-emerald-700">{voting.votesYes}</span>
                      <span className="text-slate-500">Aprovações 👍</span>
                    </div>
                    <div>
                      <span className="block text-lg font-bold text-red-600">{voting.votesNo}</span>
                      <span className="text-slate-500">Rejeições 👎</span>
                    </div>
                    <div>
                      <span className="block text-lg font-bold text-slate-500">{voting.votesAbstain}</span>
                      <span className="text-slate-500">Neutros 😐</span>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-slate-500">
                    Participação no bairro: <strong>{voting.quorumReached} moradores já votaram</strong> (meta mínima: {voting.quorumNeeded})
                    {voting.quorumReached >= voting.quorumNeeded && (
                      <span className="ml-2 font-semibold text-emerald-700">✓ Votação válida e legítima</span>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {votedVotingIds.has(voting.id) ? (
                      <span className="inline-flex items-center gap-2 bg-emerald-100 px-4 py-2.5 text-sm font-semibold text-emerald-800">
                        <CheckCircle2 className="h-4 w-4" /> Seu voto foi registrado com sucesso! 🛡️
                      </span>
                    ) : votingOpen ? (
                      (() => {
                        const isMunicipal = voting.scope === 'municipio' || voting.scope === 'municipal' || voting.scope === 'Escopo municipal';
                        const allowed = isMunicipal || !userTerritoryId || userTerritoryId === voting.territoryId;

                        if (!allowed) {
                          return (
                            <span className="inline-flex items-center gap-2 rounded bg-amber-50 border border-amber-200 px-3 py-2 text-xs font-medium text-amber-800">
                              <Lock className="h-3.5 w-3.5" /> Exclusivo para moradores do bairro {voting.territoryName} 🏠
                            </span>
                          );
                        }

                        return (
                          <>
                            <button
                              onClick={() => castVote(voting.id, 'Aprovo')}
                              disabled={voteLoading}
                              className="inline-flex h-10 items-center gap-2 bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                            >
                              <Vote className="h-4 w-4" /> 👍 Aprovar proposta
                            </button>
                            <button
                              onClick={() => castVote(voting.id, 'Rejeito')}
                              disabled={voteLoading}
                              className="inline-flex h-10 items-center gap-2 bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              👎 Rejeitar proposta
                            </button>
                            <button
                              onClick={() => castVote(voting.id, 'Abstenção')}
                              disabled={voteLoading}
                              className="inline-flex h-10 items-center gap-2 border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                              😐 Deixar neutro
                            </button>
                          </>
                        );
                      })()
                    ) : (
                      <span className="text-xs text-slate-400">Votação encerrada</span>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}

          {closedVotings.length > 0 && (
            <>
              <div className="flex items-center justify-between border-b border-slate-300 pb-3 pt-6">
                <h2 className="font-display text-lg font-bold text-slate-950">Votações encerradas</h2>
                <span className="text-sm text-slate-500">{closedVotings.length}</span>
              </div>
              {closedVotings.map((voting) => {
                const totalDecisive = voting.votesYes + voting.votesNo;
                const approvalPct = totalDecisive > 0 ? (voting.votesYes / totalDecisive * 100).toFixed(1) : '0';
                const approved = voting.quorumReached >= voting.quorumNeeded && voting.votesYes > voting.votesNo;
                return (
                  <article key={voting.id} className="border border-slate-200 bg-slate-50 p-5">
                    <div className="mb-2 flex flex-wrap gap-2 text-xs">
                      <span className={`px-2 py-1 font-semibold ${approved ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {approved ? 'Priorizada no Orçamento' : 'Não priorizada nesta rodada'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-slate-500">
                        <MapPin className="h-3.5 w-3.5" />{voting.territoryName}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{voting.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">
                      {approvalPct}% de aprovação • {voting.votesYes + voting.votesNo + voting.votesAbstain} votos totais
                    </p>
                  </article>
                );
              })}
            </>
          )}
        </section>

        <aside className="h-fit border border-slate-200 bg-white p-5 lg:sticky lg:top-36">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <Lock className="h-4 w-4 text-purple-700" />
            <h2 className="text-sm font-bold text-slate-900">Comprovante de Votação Seguro</h2>
          </div>
          {receipt ? (
            <div className="mt-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" />Voto registrado com sucesso!</p>
              <div className="mt-3 flex items-start gap-2 bg-slate-50 p-3">
                <code className="min-w-0 flex-1 break-all text-[10px] leading-4 text-slate-600">{receipt}</code>
                <button onClick={copyReceipt} className="grid h-8 w-8 shrink-0 place-items-center border border-slate-300 bg-white text-slate-600 hover:bg-slate-100" title="Copiar comprovante"><Copy className="h-3.5 w-3.5" /></button>
              </div>
              {copied && <p className="mt-2 text-right text-xs text-emerald-700">Comprovante copiado</p>}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-5 text-slate-500">O seu comprovante de votação será exibido aqui assim que você registrar o seu voto. Guarde-o para fins de auditoria pública!</p>
          )}
        </aside>
      </div>
    </div>
  );
}
