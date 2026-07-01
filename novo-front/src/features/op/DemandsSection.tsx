import {
  Building2,
  ChevronDown,
  Clock3,
  Heart,
  Link2,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  Send,
  X,
  Info,
} from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { CycleConfig, Demanda, Territorio, DemandEvent } from '../../shared/domain/types';

export function formatDemandEvent(event: DemandEvent) {
  switch (event.type) {
    case 'demand_created':
      return {
        title: 'Sugestão enviada para a comunidade 📝',
        description: 'A ideia foi registrada por um morador. Agora ela precisa de apoios para seguir adiante!',
      };

    case 'analysis_started':
      return {
        title: 'Estudo de viabilidade iniciado 🔍',
        description: 'Os técnicos da prefeitura estão analisando os custos e a viabilidade legal desta sugestão.',
      };

    case 'info_requested':
      return {
        title: 'Prefeitura solicitou mais detalhes 💡',
        description: event.payload?.reason || 'Para prosseguir com o estudo, a prefeitura pediu mais informações sobre esta sugestão.',
      };

    case 'territory_validated':
      return {
        title: 'Validada localmente pelo conselho de moradores ✅',
        description: 'Os representantes do bairro confirmaram que esta sugestão é necessária e correta para o território.',
      };

    case 'viability_approved':
      const scope = event.payload?.voting_scope === 'municipio' ? 'municipal' : 'territorial';
      return {
        title: 'Sinal verde! Pronta para votação 🚀',
        description: `A sugestão passou na análise técnica e orçamentária. Ela disputará a votação popular no escopo ${scope}.`,
      };

    case 'voting_opened':
      return {
        title: 'Votação popular aberta! 🗳️',
        description: 'Esta proposta está na cédula. Registre seu voto para que ela vire realidade!',
      };

    case 'viability_rejected':
      const cat = event.payload?.category ? `[Motivo: ${event.payload.category}] ` : '';
      return {
        title: 'Ideia arquivada nesta rodada 📁',
        description: `${cat}${event.payload?.reason || 'Esta sugestão não pôde seguir adiante devido a restrições técnicas ou financeiras.'}`,
      };

    case 'demand_approved':
      return {
        title: 'Aprovada pela comunidade! 🎉',
        description: 'A proposta obteve a votação necessária e o quórum mínimo. Agora a prefeitura fará o planejamento da obra!',
      };

    case 'demand_not_approved':
      return {
        title: 'Fica salva na memória cívica 🏛️',
        description: 'A proposta não reuniu votos suficientes desta vez. Ela fica guardada na memória para inspirar futuros ciclos.',
      };

    case 'comment_added':
      return {
        title: 'Novo comentário no debate público 💬',
        description: event.payload?.excerpt || 'Um vizinho deixou um comentário ou sugestão de melhoria.',
      };

    default:
      return {
        title: 'Atualização registrada 📌',
        description: 'Houve uma movimentação no andamento desta demanda.',
      };
  }
}

type DemandScope = 'territorial' | 'municipal';
type DemandFilter = 'todas' | 'maturacao' | 'analise' | 'decididas';

interface DemandsSectionProps {
  territorios: Territorio[];
  demandas: Demanda[];
  cycle: CycleConfig;
  userTerritoryId?: string;
  onAddDemanda: (titulo: string, descricao: string, territorioId: string, scope: DemandScope) => void;
  onApoiar: (demandaId: string) => void;
  onAddComentario: (demandaId: string, texto: string) => void;
  onForkDemanda: (demandaId: string, novoTitulo: string, novaDescricao: string) => void;
}

function demandStage(demanda: Demanda) {
  if (demanda.agrupadaEmId || demanda.status === 'Agrupada') return { label: 'Unida a outra sugestão', tone: 'slate' };
  if (demanda.admissibilidadeMarcar === 'inadmissivel') return { label: 'Não viável para este ciclo', tone: 'red' };
  if (demanda.statusExecucao || ['Em execução', 'Concluída'].includes(demanda.status || '')) return { label: 'Acompanhando Obra', tone: 'amber' };
  if (demanda.admissibilidadeMarcar === 'admissivel') return { label: 'Pronta para votação', tone: 'green' };
  if (demanda.passouPopular || ['Validada territorialmente', 'Apta para priorização'].includes(demanda.status || '')) return { label: 'Em análise pela prefeitura', tone: 'blue' };
  return { label: 'Coletando apoios', tone: 'purple' };
}

const toneClasses: Record<string, string> = {
  slate: 'bg-slate-100 text-slate-700',
  red: 'bg-red-100 text-red-800',
  amber: 'bg-amber-100 text-amber-800',
  green: 'bg-emerald-100 text-emerald-800',
  blue: 'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
};

export default function DemandsSection({
  territorios,
  demandas,
  cycle,
  userTerritoryId,
  onAddDemanda,
  onApoiar,
  onAddComentario,
  onForkDemanda,
}: DemandsSectionProps) {
  const initialTerritory = territorios.find(t => t.id === userTerritoryId)?.id || territorios[0]?.id || '';
  const [selectedTerritoryId, setSelectedTerritoryId] = useState(initialTerritory);
  const [filter, setFilter] = useState<DemandFilter>('todas');
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [scope, setScope] = useState<DemandScope>('territorial');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [relatedId, setRelatedId] = useState<string | null>(null);
  const [relatedTitle, setRelatedTitle] = useState('');
  const [relatedDescription, setRelatedDescription] = useState('');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [demandTabs, setDemandTabs] = useState<Record<string, 'timeline' | 'comments'>>({});

  useEffect(() => {
    if (!territorios.some(t => t.id === selectedTerritoryId)) {
      setSelectedTerritoryId(territorios[0]?.id || '');
    }
  }, [selectedTerritoryId, territorios]);

  const visibleDemands = useMemo(() => demandas.filter(demanda => {
    const isMunicipal = demanda.escopoVotacao === 'municipal';
    const inTerritory = selectedTerritoryId === 'todos' || demanda.territorioId === selectedTerritoryId || isMunicipal;
    const textMatches = `${demanda.titulo} ${demanda.descricao}`.toLowerCase().includes(query.trim().toLowerCase());
    const stage = demandStage(demanda).label;
    const filterMatches = filter === 'todas'
      || (filter === 'maturacao' && stage === 'Em maturação')
      || (filter === 'analise' && ['Em análise', 'Apta para votação'].includes(stage))
      || (filter === 'decididas' && ['Não aprovada', 'Em acompanhamento'].includes(stage));
    return inTerritory && textMatches && filterMatches;
  }), [demandas, filter, query, selectedTerritoryId]);

  const territoryName = (id: string) => territorios.find(t => t.id === id)?.nome || 'Território não informado';

  const submitDemand = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !description.trim() || !selectedTerritoryId) return;
    const objectTerritory = selectedTerritoryId === 'todos' ? territorios[0]?.id : selectedTerritoryId;
    if (!objectTerritory) return;
    onAddDemanda(title.trim(), description.trim(), objectTerritory, scope);
    setTitle('');
    setDescription('');
    setScope('territorial');
    setShowForm(false);
  };

  const submitRelated = (event: FormEvent, demandId: string) => {
    event.preventDefault();
    if (!relatedTitle.trim() || !relatedDescription.trim()) return;
    onForkDemanda(demandId, relatedTitle.trim(), relatedDescription.trim());
    setRelatedId(null);
    setRelatedTitle('');
    setRelatedDescription('');
  };

  const submitComment = (demandId: string) => {
    const text = commentInputs[demandId]?.trim();
    if (!text) return;
    onAddComentario(demandId, text);
    setCommentInputs(current => ({ ...current, [demandId]: '' }));
  };

  return (
    <div className="space-y-6" id="demands-section">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-sm font-semibold text-emerald-700">Escuta contínua</span>
          <h1 className="mt-1 font-display text-2xl font-bold text-slate-950">Demandas públicas</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Problemas e necessidades enviados pela população. Demandas parecidas podem ser relacionadas ou agrupadas sem perder seu histórico.
          </p>
        </div>
        {userTerritoryId ? (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 animate-fade-in"
          >
            <Plus className="h-4 w-4" />
            Criar demanda
          </button>
        ) : (
          <div className="flex max-w-md items-start gap-2.5 border border-amber-200 bg-amber-50/70 p-3 text-amber-900 rounded text-left">
            <Info className="h-4.5 w-4.5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-xs font-bold text-amber-900">Abertura de demandas bloqueada</strong>
              <p className="mt-0.5 text-[11px] text-amber-800 leading-normal">
                Exige-se vínculo territorial homologado (morador, trabalhador ou estudante). Vá para <a href="/usuario" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/usuario'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="underline font-bold text-emerald-800 hover:text-emerald-950">Minha Área</a> para se identificar ou solicitar vínculo.
              </p>
            </div>
          </div>
        )}
      </header>

      {showForm && (
        <section className="border border-emerald-300 bg-white p-5 sm:p-6" aria-label="Nova demanda">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-950">Compartilhe sua sugestão</h2>
              <p className="mt-1 text-sm text-slate-500">Descreva o que o bairro precisa para que a comunidade possa apoiar.</p>
            </div>
            <button onClick={() => setShowForm(false)} className="grid h-9 w-9 place-items-center border border-slate-300 text-slate-500 hover:bg-slate-100" title="Fechar">
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={submitDemand} className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                O que o seu bairro está precisando?
                <input
                  value={title}
                  onChange={event => setTitle(event.target.value)}
                  placeholder="Ex.: Iluminação na Praça Central ou Asfalto na Rua X"
                  className="mt-1.5 w-full border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  required
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Explique melhor a sua ideia
                <textarea
                  value={description}
                  onChange={event => setDescription(event.target.value)}
                  placeholder="Conte para seus vizinhos o local exato, qual o problema hoje e de que forma essa melhoria vai ajudar o dia a dia da comunidade."
                  rows={5}
                  className="mt-1.5 w-full resize-none border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  required
                />
              </label>
            </div>

            <div className="space-y-4">
              <fieldset>
                <legend className="mb-2 text-sm font-semibold text-slate-700">Quem será beneficiado por essa melhoria?</legend>
                <div className="grid grid-cols-2 border border-slate-300 p-1">
                  <button
                    type="button"
                    onClick={() => setScope('territorial')}
                    className={`flex min-h-12 items-center justify-center gap-2 px-3 text-sm font-medium ${scope === 'territorial' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    <MapPin className="h-4 w-4" />Apenas nosso bairro
                  </button>
                  <button
                    type="button"
                    onClick={() => setScope('municipal')}
                    className={`flex min-h-12 items-center justify-center gap-2 px-3 text-sm font-medium ${scope === 'municipal' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    <Building2 className="h-4 w-4" />Toda a cidade
                  </button>
                </div>
              </fieldset>

              <label className="block text-sm font-medium text-slate-700">
                {scope === 'territorial' ? 'Território afetado' : 'Local de referência'}
                <select
                  value={selectedTerritoryId === 'todos' ? territorios[0]?.id : selectedTerritoryId}
                  onChange={event => setSelectedTerritoryId(event.target.value)}
                  className="mt-1.5 w-full border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
                >
                  {territorios.map(territorio => <option key={territorio.id} value={territorio.id}>{territorio.nome}</option>)}
                </select>
              </label>

              <div className="border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-950">
                <strong className="block">Votação desta demanda</strong>
                <span className="mt-1 block leading-5 text-blue-800">
                  {scope === 'municipal'
                    ? 'Poderá ser votada por moradores de todo o município.'
                    : `Será votada por moradores de ${territoryName(selectedTerritoryId === 'todos' ? territorios[0]?.id || '' : selectedTerritoryId)}.`}
                </span>
              </div>

              <button type="submit" className="w-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800">
                Publicar demanda
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="border border-slate-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-[220px_1fr_auto]">
          <select
            value={selectedTerritoryId}
            onChange={event => setSelectedTerritoryId(event.target.value)}
            className="h-10 border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-600"
            aria-label="Filtrar por território"
          >
            <option value="todos">Todos os territórios</option>
            {territorios.map(territorio => <option key={territorio.id} value={territorio.id}>{territorio.nome}</option>)}
          </select>
          <label className="relative block">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Buscar demandas"
              className="h-10 w-full border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-emerald-600"
            />
          </label>
          <div className="flex overflow-x-auto border border-slate-300 p-1">
            {([
              ['todas', 'Ver todas'],
              ['maturacao', 'Apoio popular'],
              ['analise', 'Em estudo técnico'],
              ['decididas', 'Votação e Obras'],
            ] as Array<[DemandFilter, string]>).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`h-8 shrink-0 px-3 text-xs font-semibold ${filter === value ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <strong className="text-slate-800">{visibleDemands.length} demandas encontradas</strong>
          <span className="text-slate-500">Maturação: {cycle.prazoDias} dias</span>
        </div>

        {visibleDemands.length === 0 ? (
          <div className="border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <FileTextIcon />
            <p className="mt-3 text-sm font-semibold text-slate-800">Nenhuma demanda encontrada</p>
            <p className="mt-1 text-sm text-slate-500">Altere os filtros ou crie uma nova demanda.</p>
          </div>
        ) : visibleDemands.map(demanda => {
          const stage = demandStage(demanda);
          const expanded = expandedId === demanda.id;
          const progress = Math.min(100, Math.round((demanda.apoiosCount / Math.max(1, demanda.apoiosNecessarios)) * 100));
          const votingPlace = demanda.escopoVotacao === 'municipal' ? 'Todo o município' : territoryName(demanda.territorioId);

          return (
            <article key={demanda.id} className="border border-slate-200 bg-white">
              <div className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-1 text-xs font-semibold ${toneClasses[stage.tone]}`}>{stage.label}</span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                        {demanda.escopoVotacao === 'municipal' ? <Building2 className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                        Votação: {votingPlace}
                      </span>
                      <span className="text-xs text-slate-400">Criada em {demanda.dataCriacao}</span>
                    </div>
                    {demanda.forkId && (
                      <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-blue-700">
                        <Link2 className="h-3.5 w-3.5" />Proposta relacionada a {demanda.parentTitulo}
                      </p>
                    )}
                    <h2 className="text-lg font-bold leading-6 text-slate-950">{demanda.titulo}</h2>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{demanda.descricao}</p>
                  </div>

                  <div className="w-full shrink-0 border-t border-slate-100 pt-4 lg:w-60 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-600">Apoio da comunidade</span>
                      <strong className="text-slate-900">{demanda.apoiosCount} de {demanda.apoiosNecessarios}</strong>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden bg-slate-200"><div className="h-full bg-emerald-600" style={{ width: `${progress}%` }} /></div>
                    <button
                      onClick={() => onApoiar(demanda.id)}
                      className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 border border-slate-300 text-sm font-semibold text-slate-700 hover:border-emerald-600 hover:text-emerald-700"
                    >
                      <Heart className="h-4 w-4" />
                      {demanda.passouPopular ? 'Apoiar também' : 'Apoiar demanda'}
                    </button>
                  </div>
                </div>

                {demanda.admissibilidadeMarcar === 'inadmissivel' && demanda.justificativaInadmissibilidade && (
                  <div className="mt-4 border-l-4 border-red-500 bg-red-50 p-4">
                    <strong className="text-sm text-red-900">Justificativa da decisão</strong>
                    <p className="mt-1 text-sm leading-5 text-red-800">{demanda.justificativaInadmissibilidade}</p>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                  <button onClick={() => setExpandedId(expanded ? null : demanda.id)} className="inline-flex h-9 items-center gap-2 px-3 text-sm font-medium text-slate-600 hover:bg-slate-100">
                    <MessageCircle className="h-4 w-4" />
                    Histórico e debate ({demanda.comentarios.length})
                    <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                  </button>
                  <button
                    onClick={() => {
                      setRelatedId(relatedId === demanda.id ? null : demanda.id);
                      setRelatedTitle(`Alternativa para: ${demanda.titulo}`);
                    }}
                    className="inline-flex h-9 items-center gap-2 px-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
                  >
                    <Link2 className="h-4 w-4" />
                    Sugerir proposta relacionada
                  </button>
                </div>
              </div>

              {expanded && (
                <div className="border-t border-slate-200 bg-slate-50 p-5">
                  <div className="mb-4 flex border-b border-slate-200">
                    <button
                      onClick={() => setDemandTabs(curr => ({ ...curr, [demanda.id]: 'timeline' }))}
                      className={`pb-2 pr-4 text-sm font-semibold border-b-2 outline-none ${
                        (demandTabs[demanda.id] || 'timeline') === 'timeline'
                          ? 'border-emerald-600 text-emerald-700'
                          : 'border-transparent text-slate-500'
                      }`}
                    >
                      Histórico e Timeline
                    </button>
                    <button
                      onClick={() => setDemandTabs(curr => ({ ...curr, [demanda.id]: 'comments' }))}
                      className={`pb-2 px-4 text-sm font-semibold border-b-2 outline-none ${
                        demandTabs[demanda.id] === 'comments'
                          ? 'border-emerald-600 text-emerald-700'
                          : 'border-transparent text-slate-500'
                      }`}
                    >
                      Debate Público ({demanda.comentarios.length})
                    </button>
                  </div>

                  {(demandTabs[demanda.id] || 'timeline') === 'timeline' ? (
                    <div className="py-2">
                      {(() => {
                        const publicEvents = (demanda.events || [])
                          .filter(e => e.visibility === 'public' && !['support_added', 'vote_cast'].includes(e.type));
                        if (publicEvents.length === 0) {
                          return <p className="text-sm text-slate-500 py-3">Nenhum evento institucional registrado nesta demanda.</p>;
                        }
                        return (
                          <div className="relative border-l-2 border-slate-200 pl-4 ml-2 mt-2 space-y-5">
                            {publicEvents.map(event => {
                              const formatted = formatDemandEvent(event);
                              let bulletColor = 'bg-slate-400';
                              if (event.type === 'viability_approved' || event.type === 'demand_approved') bulletColor = 'bg-emerald-600';
                              if (event.type === 'viability_rejected' || event.type === 'demand_not_approved') bulletColor = 'bg-red-600';
                              if (event.type === 'analysis_started') bulletColor = 'bg-blue-600';
                              if (event.type === 'voting_opened') bulletColor = 'bg-purple-600';
                              return (
                                <div key={event.id} className="relative">
                                  <div className={`absolute -left-[23px] top-1.5 h-3 w-3 rounded-full border-2 border-white ${bulletColor}`} />
                                  <div className="flex flex-col">
                                    <strong className="text-sm text-slate-900">{formatted.title}</strong>
                                    <span className="text-xs text-slate-400 mt-0.5">
                                      {new Date(event.createdAt).toLocaleDateString()}
                                    </span>
                                    <p className="text-sm text-slate-600 mt-1">{formatted.description}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {demanda.comentarios.map(comment => (
                        <div key={comment.id} className="border border-slate-200 bg-white p-3 text-sm">
                          <div className="flex justify-between gap-3 text-xs text-slate-500"><strong className="text-slate-700">{comment.autor}</strong><span>{comment.data}</span></div>
                          <p className="mt-1.5 leading-5 text-slate-600">{comment.texto}</p>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <input
                          value={commentInputs[demanda.id] || ''}
                          onChange={event => setCommentInputs(current => ({ ...current, [demanda.id]: event.target.value }))}
                          onKeyDown={event => event.key === 'Enter' && submitComment(demanda.id)}
                          placeholder="Escreva um comentário"
                          className="h-10 min-w-0 flex-1 border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-600"
                        />
                        <button onClick={() => submitComment(demanda.id)} className="grid h-10 w-10 place-items-center bg-slate-900 text-white hover:bg-emerald-800" title="Enviar comentário"><Send className="h-4 w-4" /></button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {relatedId === demanda.id && (
                <form onSubmit={event => submitRelated(event, demanda.id)} className="grid gap-3 border-t border-blue-200 bg-blue-50 p-5 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-blue-950">Título da proposta relacionada</label>
                    <input value={relatedTitle} onChange={event => setRelatedTitle(event.target.value)} className="mt-1.5 h-10 w-full border border-blue-300 bg-white px-3 text-sm outline-none focus:border-blue-600" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-blue-950">O que muda nesta proposta?</label>
                    <textarea value={relatedDescription} onChange={event => setRelatedDescription(event.target.value)} rows={2} className="mt-1.5 w-full resize-none border border-blue-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600" required />
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <button type="submit" className="bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">Publicar proposta relacionada</button>
                  </div>
                </form>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function FileTextIcon() {
  return <Clock3 className="mx-auto h-8 w-8 text-slate-300" />;
}
