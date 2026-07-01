import { ArrowRight, Check, Clock3, FileText, MapPin, Vote, Sparkles } from 'lucide-react';
import type { Citizen } from '../../auth/AuthContext';
import type { AppView } from '../../app/navigation';
import type { CycleConfig, Demanda, Territorio } from '../../shared/domain/types';

interface CycleDashboardProps {
  cycle: CycleConfig;
  territorios: Territorio[];
  demandas: Demanda[];
  user: Citizen | null;
  onNavigate: (view: AppView) => void;
}

function isReady(demanda: Demanda) {
  return demanda.passouPopular && demanda.admissibilidadeMarcar !== 'inadmissivel';
}

export default function CycleDashboard({ cycle, territorios, demandas, user, onNavigate }: CycleDashboardProps) {
  const userTerritory = territorios.find(territorio => (
    territorio.id === user?.territoryId || territorio.nome === user?.territoryName
  ));
  const activeDemands = demandas.filter(demanda => demanda.admissibilidadeMarcar !== 'inadmissivel');
  const readyDemands = demandas.filter(isReady);
  const decidedDemands = demandas.filter(demanda => demanda.admissibilidadeMarcar && demanda.admissibilidadeMarcar !== 'pendente');

  const nextAction = cycle.faseAtual === 'votacao'
    ? {
        title: 'A votação popular está aberta! 🗳️',
        text: 'Entre com sua conta, confira as propostas do seu bairro e ajude a escolher as obras prioritárias.',
        button: 'Acessar cabine de votação',
        view: 'votacao' as AppView,
      }
    : {
        title: 'A escuta da comunidade está aberta! 📢',
        text: 'Identificou um problema ou tem uma sugestão de melhoria? Publique uma nova sugestão ou apoie ideias dos seus vizinhos.',
        button: 'Ver sugestões e participar',
        view: 'demandas' as AppView,
      };

  return (
    <div className="space-y-8" id="cycle-dashboard">
      {/* Hero Section com Gradiente Premium */}
      <section className="relative overflow-hidden border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 p-6 text-white shadow-xl sm:p-10 lg:grid lg:grid-cols-[1fr_360px] lg:gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
              <Sparkles className="h-3 w-3" /> Ciclo de OP Ativo
            </span>
            <span className="text-xs text-slate-300 font-medium">{cycle.nome}</span>
          </div>
          <h1 className="max-w-3xl font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl">
            Sua sugestão de hoje vira a obra pública de amanhã.
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-slate-300">
            O Orçamento Participativo permite que você proponha melhorias para seu bairro, apoie ideias de vizinhos e ajude a decidir a aplicação do orçamento municipal de forma 100% auditável.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-3 pt-2 text-sm text-slate-300">
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-400" />
              Bairro de referência: <strong className="text-white">{userTerritory?.nome || 'Todos os territórios'}</strong>
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-emerald-400" />
              Prazo para apoios: <strong className="text-white">{cycle.prazoDias} dias</strong>
            </span>
          </div>
        </div>

        <aside className="mt-8 border-l-4 border-amber-400 bg-amber-500/10 p-6 backdrop-blur-sm lg:mt-0 lg:border-l-4">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Etapa Atual</span>
          <h2 className="mt-2 text-xl font-bold text-white leading-tight">{nextAction.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{nextAction.text}</p>
          <button
            onClick={() => onNavigate(nextAction.view)}
            className="mt-6 flex w-full items-center justify-center gap-2 bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-900/30"
          >
            {nextAction.button}
            <ArrowRight className="h-4 w-4" />
          </button>
        </aside>
      </section>

      {/* Caminho das demandas em tom conversacional */}
      <section className="border border-slate-200 bg-white p-5 sm:p-6 shadow-sm" aria-label="Como funciona o ciclo">
        <h2 className="font-display text-lg sm:text-xl font-extrabold text-slate-900">Como funciona o ciclo? 🤝</h2>
        <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
          O Orçamento Participativo é um ciclo de cooperação simples: qualquer morador pode propor melhorias para o bairro. Se a sugestão receber apoios suficientes da comunidade, os técnicos da prefeitura realizam um estudo de viabilidade (custo e leis). As ideias aprovadas vão para votação popular e, quando priorizadas, você acompanha a execução física da obra.
        </p>
        
        {/* Fluxo visual simplificado de marcos */}
        <div className="mt-5 border-t border-slate-100 pt-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Jornada de uma proposta:</span>
          <div className="mt-2 flex flex-wrap items-center gap-y-2 gap-x-3 text-xs font-semibold text-slate-700">
            <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-sm">1. Enviar sugestão</span>
            <span className="text-slate-400">➔</span>
            <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-sm">2. Apoios vizinhos</span>
            <span className="text-slate-400">➔</span>
            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-sm">3. Estudo da prefeitura</span>
            <span className="text-slate-400">➔</span>
            <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-sm">4. Voto popular</span>
            <span className="text-slate-400">➔</span>
            <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-sm">5. Obra entregue</span>
          </div>
        </div>
      </section>


      {/* Cards de Métricas Conversacionais (Dispostos Horizontalmente no Mobile) */}
      <section className="grid grid-cols-3 gap-2 sm:gap-4">
        <button
          onClick={() => onNavigate('demandas')}
          className="group flex flex-col sm:flex-row items-center gap-1.5 sm:gap-4 border border-slate-200 bg-white p-3 sm:p-6 text-center sm:text-left transition-all hover:border-emerald-500 hover:shadow-md"
        >
          <span className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center bg-blue-50 text-blue-700 transition-colors group-hover:bg-blue-100">
            <FileText className="h-6 w-6" />
          </span>
          <div>
            <strong className="block text-xl sm:text-2xl font-extrabold text-slate-900">{activeDemands.length}</strong>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 leading-tight block">Sugestões ativas</span>
          </div>
        </button>

        <button
          onClick={() => onNavigate('votacao')}
          className="group flex flex-col sm:flex-row items-center gap-1.5 sm:gap-4 border border-slate-200 bg-white p-3 sm:p-6 text-center sm:text-left transition-all hover:border-emerald-500 hover:shadow-md"
        >
          <span className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center bg-purple-50 text-purple-700 transition-colors group-hover:bg-purple-100">
            <Vote className="h-6 w-6" />
          </span>
          <div>
            <strong className="block text-xl sm:text-2xl font-extrabold text-slate-900">{readyDemands.length}</strong>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 leading-tight block">Prontas para votar</span>
          </div>
        </button>

        <button
          onClick={() => onNavigate('resultados')}
          className="group flex flex-col sm:flex-row items-center gap-1.5 sm:gap-4 border border-slate-200 bg-white p-3 sm:p-6 text-center sm:text-left transition-all hover:border-emerald-500 hover:shadow-md"
        >
          <span className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center bg-amber-50 text-amber-700 transition-colors group-hover:bg-amber-100">
            <Check className="h-6 w-6" />
          </span>
          <div>
            <strong className="block text-xl sm:text-2xl font-extrabold text-slate-900">{decidedDemands.length}</strong>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 leading-tight block">Conquistas</span>
          </div>
        </button>
      </section>

    </div>
  );
}

