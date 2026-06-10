/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Activity, Paperclip, Clock, Calendar, CheckSquare, Sparkles, TrendingUp, AlertTriangle, ExternalLink, MessageSquare, ChevronRight } from 'lucide-react';
import { ExecutionTracker, ExecutionStatus } from '../types';

interface FiscalizacaoViewProps {
  trackers: ExecutionTracker[];
}

export default function FiscalizacaoView({ trackers }: FiscalizacaoViewProps) {
  const [selectedTrackerId, setSelectedTrackerId] = useState<string | null>(null);

  const getStatusColor = (status: ExecutionStatus) => {
    switch (status) {
      case 'Cumprida':
        return 'bg-emerald-50 text-emerald-700 border-emerald-250';
      case 'Em execução':
      case 'Em regulamentação':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Parcialmente cumprida':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Descumprida':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const selectedTracker = trackers.find(t => t.id === selectedTrackerId);

  return (
    <div className="space-y-8 fade-in" id="fiscal-hub">
      {/* HUB HOME LIST */}
      {!selectedTrackerId ? (
        <div className="space-y-6">
          <div className="border-b border-slate-200 pb-5">
            <div className="flex items-center space-x-2 text-indigo-700 font-mono text-xs font-bold uppercase tracking-wider">
              <Activity className="h-4 w-4" />
              <span>Controle Social e Auditoria Popular</span>
            </div>
            <h2 className="font-display text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              Fiscalização de Execução das Leis
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Não basta criar a norma: fiscalizar se o que foi aprovado está sendo executado e regulado pela Prefeitura Municipal.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {trackers.map((tracker) => (
              <div
                key={tracker.id}
                onClick={() => setSelectedTrackerId(tracker.id)}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs select-none hover:border-slate-350 cursor-pointer hover:shadow-md transition-all space-y-4"
                id={`fiscal-card-${tracker.id}`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-mono text-[9px] font-bold text-slate-400 uppercase">PRODUTO DE MERGE COMPILADO</span>
                  <span className={`px-2 py-0.5 border rounded text-[10px] font-mono font-bold uppercase ${getStatusColor(tracker.status)}`}>
                    {tracker.status}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-display font-extrabold text-base text-slate-900 leading-snug">
                    {tracker.title}
                  </h3>
                  <p className="text-slate-400 font-mono text-[10px] uppercase">
                    Ref: <b className="text-slate-600">{tracker.normReference}</b>
                  </p>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>Progresso global</span>
                    <span>{tracker.progressPercentage}%</span>
                  </div>
                  <div className="w-full h-2 rounded bg-slate-100 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 rounded transition-all duration-300"
                      style={{ width: `${tracker.progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* financial summaries */}
                <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-400 block">DOTAÇÃO ORÇAMENTÁRIA</span>
                    <span className="font-bold text-slate-800">{tracker.budgetAllocated}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">GASTO REALIZADO</span>
                    <span className="font-bold text-slate-800">{tracker.budgetSpent}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedTrackerId(tracker.id)}
                  className="w-full rounded-lg bg-slate-50 text-slate-700 py-1.5 font-semibold text-xs border border-slate-200 hover:bg-slate-100 text-center block"
                >
                  Ver Evidências e Diário de Obras
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* TRACKER DETAILED VIEW */
        selectedTracker && (
          <div className="space-y-6">
            <button
              onClick={() => setSelectedTrackerId(null)}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              id="fiscal-back"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
              <span>Voltar para todas as fiscalizações</span>
            </button>

            {/* Tracker Header */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-indigo-700 font-mono text-xs font-bold uppercase tracking-wider">
                    <Activity className="h-4 w-4" />
                    <span>Fiscalização Ativa da Sociedade Civil</span>
                  </div>
                  <h3 className="font-display font-extrabold text-xl md:text-2xl text-slate-900 leading-tight">
                    {selectedTracker.title}
                  </h3>
                </div>

                <span className={`px-2.5 py-1 text-center border rounded text-xs font-mono font-bold uppercase shrink-0 ${getStatusColor(selectedTracker.status)}`}>
                  {selectedTracker.status}
                </span>
              </div>

              {/* Progress and core metadata panel */}
              <div className="grid md:grid-cols-4 gap-4 items-center">
                <div className="md:col-span-2 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Etapa de Execução Física</span>
                    <span>{selectedTracker.progressPercentage}% concluído</span>
                  </div>
                  <div className="w-full h-3 rounded bg-slate-100 overflow-hidden">
                    <div className="bg-indigo-600 h-3" style={{ width: `${selectedTracker.progressPercentage}%` }} />
                  </div>
                </div>

                <div className="p-3 border rounded-xl bg-slate-50 text-[11px] font-mono leading-normal">
                  <span className="text-slate-400 block font-bold uppercase">Dispositivo Criado</span>
                  <span className="font-bold text-slate-700">{selectedTracker.normReference}</span>
                </div>

                <div className="p-3 border rounded-xl bg-slate-50 text-[11px] font-mono leading-normal">
                  <span className="text-slate-400 block font-bold uppercase">Órgão Executor Responsável</span>
                  <span className="font-bold text-slate-700 leading-snug">{selectedTracker.responsibleDepartment}</span>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Left Column: Updates timeline */}
              <div className="md:col-span-2 space-y-6">
                <h4 className="font-display font-bold text-slate-950 text-sm flex items-center space-x-1.5">
                  <Clock className="h-4.5 w-4.5 text-indigo-600" />
                  <span>Diário Oficial de Obras e Despachos ({selectedTracker.updates.length})</span>
                </h4>

                <div className="relative pl-5 border-l-2 border-slate-100 space-y-6">
                  {selectedTracker.updates.map((up) => (
                    <div key={up.id} className="relative">
                      {/* circle shape */}
                      <span className="absolute -left-[26px] top-1.5 h-3 w-3 rounded-full bg-slate-300 border-2 border-white" />

                      <div className="space-y-1.5 bg-white border border-slate-200/60 p-4.5 rounded-xl shadow-xs">
                        <div className="flex items-center justify-between flex-wrap gap-1 font-mono text-[10px]">
                          <span className="rounded bg-indigo-50 text-indigo-700 px-2 py-0.5 font-bold uppercase">
                            {up.category}
                          </span>
                          <span className="text-slate-400 uppercase">{up.date}</span>
                        </div>
                        <h5 className="font-display font-bold text-xs sm:text-sm text-slate-900">{up.title}</h5>
                        <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">{up.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Budgets and Evidences */}
              <div className="space-y-6">
                {/* Visual Evidences */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                  <h4 className="font-display font-bold text-slate-955 text-xs uppercase tracking-wider border-b border-slate-50 pb-2">
                    Anexos e Evidências
                  </h4>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Fotos registradas em cartório cívico ou contratos aditivos digitais que garantem a autenticidade jurídica.
                  </p>

                  <div className="space-y-2.5 pt-1">
                    {selectedTracker.evidence.map((ev, idx) => (
                      <a
                        key={idx}
                        href={ev.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-slate-150 p-2.5 flex items-center justify-between text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors w-full"
                      >
                        <div className="flex items-center space-x-2 text-left">
                          <Paperclip className="h-4 w-4 text-slate-400 shrink-0" />
                          <div>
                            <span className="font-bold text-slate-800 line-clamp-1">{ev.title}</span>
                            <span className="font-mono text-[9px] text-slate-400 block">{ev.date}</span>
                          </div>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-indigo-500 shrink-0 ml-1" />
                      </a>
                    ))}
                  </div>
                </div>

                {/* Citizens supervision */}
                <div className="rounded-2xl border border-slate-200 bg-indigo-50/20 p-5 space-y-3.5">
                  <h4 className="font-display font-bold text-indigo-950 text-xs uppercase">Canal de Denúncias</h4>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Identificou propaganda política com os fundos, obras paradas no Campo Grande ou descumprimento de prazos?
                  </p>
                  <button
                    onClick={() => alert("Simulação de abertura de boletim de descumprimento encaminhado à Controladoria e Ministério Público local.")}
                    className="w-full rounded-xl bg-slate-900 text-white font-semibold text-xs py-2 hover:bg-slate-800 text-center block"
                  >
                    Notificar Descumprimento
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
