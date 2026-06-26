import { ArrowRight, CheckCircle, Clock, Landmark, MapPin, Shield, Vote } from 'lucide-react';
import type { Citizen } from '../../auth/AuthContext';
import type { AppView } from '../../app/navigation';
import { canAccessView, roleLabel } from '../../app/navigation';
import type { CycleConfig, Demanda, Territorio } from '../../shared/domain/types';

interface CycleDashboardProps {
  cycle: CycleConfig;
  territorios: Territorio[];
  demandas: Demanda[];
  user: Citizen | null;
  onNavigate: (view: AppView) => void;
}

const phaseLabels: Record<CycleConfig['faseAtual'], string> = {
  preparacao: 'Preparação',
  propostas: 'Demandas e apoio',
  votacao: 'Votação territorial',
  institucional: 'Matriz e Câmara',
  execucao: 'Execução e aprendizado',
};

const phaseOrder: Array<{ id: CycleConfig['faseAtual']; label: string }> = [
  { id: 'preparacao', label: 'Preparação' },
  { id: 'propostas', label: 'Demandas' },
  { id: 'votacao', label: 'Votação' },
  { id: 'institucional', label: 'Matriz' },
  { id: 'execucao', label: 'Execução' },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function CycleDashboard({
  cycle,
  territorios,
  demandas,
  user,
  onNavigate,
}: CycleDashboardProps) {
  const userTerritory = territorios.find(territorio => (
    territorio.id === user?.territoryId || territorio.nome === user?.territoryName
  ));
  const activeTerritory = userTerritory || territorios[0];
  const territoryDemands = activeTerritory
    ? demandas.filter(demanda => demanda.territorioId === activeTerritory.id)
    : demandas;
  const readyForVote = demandas.filter(demanda => (
    demanda.passouProtocolar &&
    demanda.passouPopular &&
    demanda.admissibilidadeMarcar !== 'inadmissivel' &&
    !demanda.divergente
  ));
  const executionItems = demandas.filter(demanda => demanda.admissibilidadeMarcar === 'admissivel' || demanda.statusExecucao);
  const currentPhaseIndex = phaseOrder.findIndex(phase => phase.id === cycle.faseAtual);
  const canOpenInstitutional = canAccessView('institucional', user?.role);

  const nextAction = (() => {
    if (!user) {
      return {
        label: 'Entrar para participar',
        detail: 'A leitura pública está aberta. Para demandar, apoiar e votar, entre com sua conta cidadã.',
        view: 'cidadao' as AppView,
      };
    }
    if (cycle.faseAtual === 'preparacao') {
      return {
        label: 'Acompanhar conselho',
        detail: 'A etapa de preparação organiza vínculo, inscrição e sorteio do conselho territorial.',
        view: 'sorteio' as AppView,
      };
    }
    if (cycle.faseAtual === 'propostas') {
      return {
        label: 'Abrir ou apoiar demanda',
        detail: 'A coleta está aberta: registre problemas, comente, apoie e proponha alternativas.',
        view: 'cidadao' as AppView,
      };
    }
    if (cycle.faseAtual === 'votacao') {
      return {
        label: 'Votar nas propostas aptas',
        detail: 'A votação territorial está aberta para propostas que passaram pelos portões da esteira.',
        view: 'votacao' as AppView,
      };
    }
    if (cycle.faseAtual === 'institucional') {
      return {
        label: canOpenInstitutional ? 'Ver matriz e decisões' : 'Acompanhar decisões públicas',
        detail: 'As prioridades entram na matriz e seguem para admissibilidade e institucionalização.',
        view: canOpenInstitutional ? 'institucional' as AppView : 'auditoria' as AppView,
      };
    }
    return {
      label: 'Fiscalizar execução',
      detail: 'Acompanhe obras, frustrações e efeitos no aprendizado do próximo ciclo.',
      view: 'execucao' as AppView,
    };
  })();

  return (
    <div className="space-y-8" id="cycle-dashboard">
      <section className="border-2 border-[#1A1A1B] bg-white p-6 shadow-[4px_4px_0px_0px_#1A1A1B]">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="border border-blue-300 bg-blue-50 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-blue-800">
                {phaseLabels[cycle.faseAtual]}
              </span>
              <span className="border border-slate-300 bg-slate-50 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-600">
                {roleLabel(user?.role)}
              </span>
            </div>

            <div>
              <h1 className="font-serif text-3xl font-black italic leading-tight text-slate-950">
                {cycle.nome}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                Acompanhe a esteira do Orçamento Participativo por território: demanda, apoio, votação, matriz, execução e aprendizado.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="border border-slate-300 bg-slate-50 p-3">
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-500">Meu território</span>
                <strong className="mt-1 block text-sm text-slate-950">{activeTerritory?.nome || 'Não definido'}</strong>
              </div>
              <div className="border border-slate-300 bg-slate-50 p-3">
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-500">Sub-envelope</span>
                <strong className="mt-1 block font-mono text-sm text-slate-950">{formatCurrency(activeTerritory?.totalOrcamento || 0)}</strong>
              </div>
              <div className="border border-slate-300 bg-slate-50 p-3">
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-500">Prazo de maturação</span>
                <strong className="mt-1 block font-mono text-sm text-slate-950">{cycle.prazoDias} dias</strong>
              </div>
            </div>
          </div>

          <div className="border-2 border-[#1A1A1B] bg-slate-900 p-5 text-white">
            <div className="mb-4 flex items-center gap-2 border-b border-slate-700 pb-3">
              <Clock className="h-4 w-4 text-amber-300" />
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider">Próximo passo</h2>
            </div>
            <p className="text-lg font-black text-amber-200">{nextAction.label}</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">{nextAction.detail}</p>
            <button
              onClick={() => onNavigate(nextAction.view)}
              className="mt-5 inline-flex items-center gap-2 border-2 border-white bg-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-950 transition-colors hover:bg-blue-500 hover:text-white"
            >
              Abrir etapa
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-5" aria-label="Esteira do OP">
        {phaseOrder.map((phase, index) => {
          const done = index < currentPhaseIndex;
          const active = index === currentPhaseIndex;
          return (
            <div
              key={phase.id}
              className={`border-2 p-4 ${
                active
                  ? 'border-[#1A1A1B] bg-blue-50 shadow-[3px_3px_0px_0px_#1A1A1B]'
                  : done
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-slate-300 bg-white'
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase text-slate-500">{String(index).padStart(2, '0')}</span>
                {done ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <span className="h-4 w-4 border border-slate-300 bg-white" />}
              </div>
              <p className="text-sm font-black text-slate-950">{phase.label}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                {active ? 'Agora' : done ? 'Concluída' : 'Aguardando'}
              </p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        <button
          onClick={() => onNavigate('cidadao')}
          className="border-2 border-[#1A1A1B] bg-white p-5 text-left shadow-[3px_3px_0px_0px_#1A1A1B] transition-transform hover:-translate-y-0.5"
        >
          <MapPin className="mb-4 h-5 w-5 text-blue-600" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">Demandas do território</span>
          <strong className="mt-2 block text-2xl text-slate-950">{territoryDemands.length}</strong>
          <span className="mt-1 block text-xs text-slate-500">abertas ou em maturação</span>
        </button>

        <button
          onClick={() => onNavigate('votacao')}
          className="border-2 border-[#1A1A1B] bg-white p-5 text-left shadow-[3px_3px_0px_0px_#1A1A1B] transition-transform hover:-translate-y-0.5"
        >
          <Vote className="mb-4 h-5 w-5 text-purple-600" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">Prontas para votação</span>
          <strong className="mt-2 block text-2xl text-slate-950">{readyForVote.length}</strong>
          <span className="mt-1 block text-xs text-slate-500">com dois portões atendidos</span>
        </button>

        <button
          onClick={() => canOpenInstitutional && onNavigate('institucional')}
          disabled={!canOpenInstitutional}
          className={`border-2 border-[#1A1A1B] bg-white p-5 text-left shadow-[3px_3px_0px_0px_#1A1A1B] transition-transform ${
            canOpenInstitutional ? 'hover:-translate-y-0.5' : 'cursor-not-allowed opacity-70'
          }`}
        >
          <Landmark className="mb-4 h-5 w-5 text-amber-600" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">Matriz e Câmara</span>
          <strong className="mt-2 block text-2xl text-slate-950">{demandas.filter(d => d.passouPopular).length}</strong>
          <span className="mt-1 block text-xs text-slate-500">itens com apoio popular</span>
        </button>

        <button
          onClick={() => onNavigate('execucao')}
          className="border-2 border-[#1A1A1B] bg-white p-5 text-left shadow-[3px_3px_0px_0px_#1A1A1B] transition-transform hover:-translate-y-0.5"
        >
          <Shield className="mb-4 h-5 w-5 text-emerald-600" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">Execução</span>
          <strong className="mt-2 block text-2xl text-slate-950">{executionItems.length}</strong>
          <span className="mt-1 block text-xs text-slate-500">itens em acompanhamento</span>
        </button>
      </section>
    </div>
  );
}
