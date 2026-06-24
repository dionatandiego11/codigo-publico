import React, { useState } from 'react';
import { Shield, Users, Landmark, Settings, CheckSquare, Layers } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from './LoginModal';
import { CycleConfig } from '../types';

interface HeaderProps {
  activeView: string;
  setActiveView: (view: string) => void;
  cycle: CycleConfig;
  territoryCount: number;
}

export default function Header({ activeView, setActiveView, cycle, territoryCount }: HeaderProps) {
  const { isAuthenticated, logout, user } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const navItems = [
    { id: 'cidadao', label: 'Portal do Cidadão', icon: Users, num: '01', color: 'border-l-4 border-[#3B82F6]' },
    { id: 'sorteio', label: 'Sorteio do Conselho', icon: Layers, num: '02', color: 'border-l-4 border-[#A855F7]' },
    { id: 'institucional', label: 'Câmara (Admissibilidade)', icon: Landmark, num: '03', color: 'border-l-4 border-[#F59E0B]' },
    { id: 'execucao', label: 'Rastreador de Obras', icon: CheckSquare, num: '04', color: 'border-l-4 border-[#10B981]' },
    { id: 'gestor', label: 'Gestor (Regimento)', icon: Settings, num: '05', color: 'border-l-4 border-[#EF4444]' },
    { id: 'auditoria', label: 'Cadeia de Auditoria', icon: Shield, num: '06', color: 'border-l-4 border-[#64748B]' },
  ];

  // Calculate dynamic total budget
  const totalBudget = cycle.pisoIgualBase * Math.max(1, territoryCount) + cycle.parcelaCarenciaTotal;

  return (
    <div className="sticky top-0 z-40 bg-[#F8F9FA]" id="main-header-container">
      {/* Top Black Header */}
      <header className="h-16 bg-[#1A1A1B] text-white flex items-center justify-between px-6 border-b-2 border-[#1A1A1B]" id="main-header">
        <div className="flex items-center gap-4">
          <div className="bg-[#3B82F6] px-3 py-1 font-mono text-sm font-bold skew-x-[-12deg] tracking-wide">
            CÓDIGO PÚBLICO
          </div>
          <div className="h-4 w-px bg-white/20 hidden sm:block"></div>
          <span className="text-xs font-mono font-semibold tracking-tight uppercase hidden sm:block text-slate-300">
            Brumadinho • {cycle.nome}
          </span>
        </div>
        
        <div className="flex gap-6 items-center">
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Envelope Orçamentário</span>
            <span className="font-mono text-xs sm:text-sm font-semibold text-[#3B82F6]">
              R$ {totalBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-300 font-mono hidden sm:block">Olá, {user?.fullName || 'Cidadão'}</span>
              <button onClick={logout} className="text-xs text-red-400 hover:text-red-300 font-mono underline">Sair</button>
              <div className="h-8 w-8 rounded-full border border-white/20 flex items-center justify-center font-mono text-xs italic bg-emerald-800 text-emerald-200">
                {user?.fullName?.substring(0, 2).toUpperCase() || 'C'}
              </div>
            </div>
          ) : (
            <button onClick={() => setIsLoginModalOpen(true)} className="bg-[#3B82F6] hover:bg-blue-600 text-white text-xs font-bold font-mono px-3 py-1 border-2 border-transparent hover:border-white transition-colors">
              ENTRAR
            </button>
          )}
        </div>
      </header>
      
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />

      {/* High Density Tab Navigation Bar */}
      <div className="bg-white border-b-2 border-[#1A1A1B] shadow-sm overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-2 py-2" aria-label="Tabs" id="nav-tabs">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  id={`tab-${item.id}`}
                  onClick={() => setActiveView(item.id)}
                  className={`flex items-center space-x-2.5 py-1.5 px-3.5 border transition-all whitespace-nowrap text-xs font-bold ${
                    isActive
                      ? 'bg-[#1A1A1B] text-white border-[#1A1A1B]'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <span className={`font-mono text-[10px] ${isActive ? 'text-blue-400' : 'text-slate-400'}`}>
                    {item.num}
                  </span>
                  <Icon className="h-3.5 w-3.5" />
                  <span className="tracking-tight">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
