import { CalendarDays, Check, Coins, MapPinned, Settings, Users, Building, ShieldCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { CycleConfig, Territorio } from '../../shared/domain/types';
import UserManagementTab from './admin/UserManagementTab';
import TerritoryManagementTab from './admin/TerritoryManagementTab';

interface MaintainerSectionProps {
  cycle: CycleConfig;
  territorios: Territorio[];
  onUpdateRegimento: (updatedCycle: Partial<CycleConfig>) => void;
  onReloadData?: () => void;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
}

export default function MaintainerSection({ cycle, territorios, onUpdateRegimento, onReloadData }: MaintainerSectionProps) {
  const [activeTab, setActiveTab] = useState<'cycle' | 'territories' | 'users'>('cycle');
  
  const [phase, setPhase] = useState(cycle.faseAtual);
  const [supportThreshold, setSupportThreshold] = useState(cycle.limiarApoioPercentual);
  const [maturationDays, setMaturationDays] = useState(cycle.prazoDias);
  const [equalBudget, setEqualBudget] = useState(cycle.pisoIgualBase);
  const [needBudget, setNeedBudget] = useState(cycle.parcelaCarenciaTotal);
  const [saved, setSaved] = useState(false);

  const totalBudget = equalBudget * Math.max(1, territorios.length) + needBudget;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onUpdateRegimento({
      faseAtual: phase,
      limiarApoioPercentual: supportThreshold,
      prazoDias: maturationDays,
      pisoIgualBase: equalBudget,
      parcelaCarenciaTotal: needBudget,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 pb-20" id="administration-section">
      <header>
        <span className="text-sm font-semibold text-slate-600">Área do administrador global</span>
        <h1 className="mt-1 font-display text-2xl font-bold text-slate-950">Gerenciamento Macro</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Controle total sobre o ciclo orçamentário, gestão de territórios ativos e gerenciamento de perfis de acesso dos cidadãos.
        </p>
      </header>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('cycle')}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center gap-2 ${
              activeTab === 'cycle'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            Ciclo e Regimento
          </button>
          <button
            onClick={() => setActiveTab('territories')}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center gap-2 ${
              activeTab === 'territories'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            <Building className="h-4 w-4" />
            Territórios
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center gap-2 ${
              activeTab === 'users'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            <Users className="h-4 w-4" />
            Usuários e Gestão
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'cycle' && (
          <div className="grid items-start gap-6 lg:grid-cols-[420px_1fr]">
            <form onSubmit={submit} className="border border-slate-200 bg-white p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-2 border-b border-slate-200 pb-4">
                <Settings className="h-5 w-5 text-slate-600" />
                <h2 className="font-display text-lg font-bold text-slate-950">Regras ativas</h2>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700">
                  Etapa atual
                  <select value={phase} onChange={event => setPhase(event.target.value as CycleConfig['faseAtual'])} className="mt-1.5 h-11 w-full border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-600">
                    <option value="preparacao">Preparação</option>
                    <option value="propostas">Escuta e maturação</option>
                    <option value="votacao">Votação</option>
                    <option value="institucional">Publicação do resultado</option>
                    <option value="execucao">Execução e memória</option>
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm font-medium text-slate-700">
                    Apoio mínimo
                    <select value={supportThreshold} onChange={event => setSupportThreshold(Number(event.target.value))} className="mt-1.5 h-11 w-full border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-600">
                      <option value={0.01}>1%</option>
                      <option value={0.02}>2%</option>
                      <option value={0.03}>3%</option>
                      <option value={0.05}>5%</option>
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Maturação
                    <div className="relative mt-1.5">
                      <input type="number" min={7} max={120} value={maturationDays} onChange={event => setMaturationDays(Number(event.target.value))} className="h-11 w-full border border-slate-300 px-3 pr-12 text-sm outline-none focus:border-emerald-600" />
                      <span className="absolute right-3 top-3 text-xs text-slate-500">dias</span>
                    </div>
                  </label>
                </div>

                <div className="mt-4 border-t border-slate-200 pt-4">
                  <div className="mb-4 flex items-center gap-2">
                    <Coins className="h-5 w-5 text-slate-600" />
                    <h3 className="font-display font-semibold text-slate-900">Distribuição Orçamentária</h3>
                  </div>

                  <label className="block text-sm font-medium text-slate-700">
                    Valor base por território
                    <input type="number" min={0} step={10000} value={equalBudget / 100} onChange={event => setEqualBudget(Number(event.target.value) * 100)} className="mt-1.5 h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600" />
                  </label>

                  <label className="mt-3 block text-sm font-medium text-slate-700">
                    Fundo adicional por necessidade
                    <input type="number" min={0} step={10000} value={needBudget / 100} onChange={event => setNeedBudget(Number(event.target.value) * 100)} className="mt-1.5 h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600" />
                  </label>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                <span className={`text-sm text-emerald-600 transition-opacity ${saved ? 'opacity-100' : 'opacity-0'}`}>
                  Regras atualizadas!
                </span>
                <button type="submit" className="flex h-11 items-center justify-center gap-2 bg-emerald-700 px-5 text-sm font-bold text-white transition-colors hover:bg-emerald-800">
                  <Check className="h-4 w-4" />
                  Aplicar mudanças
                </button>
              </div>
            </form>

            <div className="space-y-4">
              <div className="border border-slate-200 bg-slate-50 p-5 sm:p-6">
                <h3 className="flex items-center gap-2 font-display text-lg font-bold text-slate-950">
                  <CalendarDays className="h-5 w-5 text-slate-500" />
                  Projeção do Ciclo
                </h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <dt className="text-slate-600">Orçamento Base Declarado</dt>
                    <dd className="font-medium text-slate-900">{formatCurrency(totalBudget / 100)}</dd>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <dt className="text-slate-600">Piso Fixo ({territorios.length} territórios)</dt>
                    <dd className="font-medium text-slate-900">{formatCurrency((equalBudget * Math.max(1, territorios.length)) / 100)}</dd>
                  </div>
                  <div className="flex justify-between pb-2">
                    <dt className="text-slate-600">Variável (Índice de Carência)</dt>
                    <dd className="font-medium text-slate-900">{formatCurrency(needBudget / 100)}</dd>
                  </div>
                </dl>
              </div>

              <div className="border border-slate-200 bg-white p-5">
                <h3 className="mb-4 flex items-center gap-2 font-display font-semibold text-slate-900">
                  <MapPinned className="h-5 w-5 text-slate-500" />
                  Divisão Projetada
                </h3>
                <div className="space-y-3">
                  {territorios.map(t => (
                    <div key={t.id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">{t.nome}</span>
                      <span className="font-medium text-slate-900">{formatCurrency((t.orcamentoPrevisto || 0) / 100)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && <UserManagementTab />}
        
        {activeTab === 'territories' && (
          <TerritoryManagementTab
            territorios={territorios}
            onTerritoriesChange={() => {
              if (onReloadData) onReloadData();
            }}
          />
        )}
      </div>
    </div>
  );
}
