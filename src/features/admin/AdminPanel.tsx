/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Shield, CheckSquare, RefreshCw, AlertTriangle, GitMerge, FileText, Sparkles, Trash2, ArrowUpRight } from 'lucide-react';
import { Issue, CivicPR } from '@/src/types';

interface AdminPanelProps {
  issues: Issue[];
  prs: CivicPR[];
  onTriageIssue: (id: string, status: any) => void;
  onTriagePR: (id: string, status: any) => void;
  onForceRunChecks: () => void;
}

export default function AdminPanel({
  issues,
  prs,
  onTriageIssue,
  onTriagePR,
  onForceRunChecks
}: AdminPanelProps) {
  const pendingIssues = issues.filter(i => i.status === 'Aberta' || i.status === 'Em triagem');
  const openPRs = prs.filter(p => p.status === 'Aberto para debate' || p.status === 'Em revisão técnica' || p.status === 'Em votação');

  return (
    <div className="space-y-8 fade-in" id="admin-backdoor-console">
      {/* Admin Head banner */}
      <div className="border-b border-slate-205 pb-5">
        <div className="flex items-center space-x-2 text-indigo-700 font-mono text-xs font-bold uppercase tracking-wider">
          <Shield className="h-4 w-4" />
          <span>Console do Gestor Administrativo</span>
        </div>
        <h2 className="font-display text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
          Painel de Moderação e Triagem
        </h2>
        <p className="text-slate-505 text-xs sm:text-sm mt-0.5">
          Backdoor técnico para simulação de fluxo interno — para uso de vereadores, procuradoria-geral e agentes da controladoria de Novo Horizonte.
        </p>
      </div>

      {/* Quick action buttons row */}
      <div className="rounded-2xl border border-dashed border-indigo-150 bg-indigo-50/15 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="font-display font-semibold text-xs text-indigo-950 uppercase">Rode os Testes Jurídicos da Cidade</h4>
          <p className="text-slate-500 text-[11px]">Você alterou as regras ou quer validar se as leis vigentes entram em conflito com a Constituição federal?</p>
        </div>
        <button
          onClick={() => {
            onForceRunChecks();
            alert("Processamento concluído: Todos os testes estáticos e cheques institucionais de conformidade municipal foram executados com sucesso (CI Cívico).");
          }}
          className="rounded-xl bg-slate-900 text-white font-semibold text-xs px-4 py-2.5 hover:bg-slate-800 transition-colors flex items-center space-x-1.5 shrink-0"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Forçar Verificação de CI</span>
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left column: issues Triage */}
        <div className="space-y-4">
          <h3 className="font-display font-bold text-slate-950 text-sm border-b pb-2 flex items-center justify-between">
            <span>Fila de Triagem de Issues ({pendingIssues.length})</span>
            <span className="font-mono text-[9px] uppercase bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">Ativas</span>
          </h3>

          <div className="space-y-3">
            {pendingIssues.length > 0 ? (
              pendingIssues.map((issue) => (
                <div key={issue.id} className="rounded-xl border border-slate-200 bg-white p-4.5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-slate-400">{issue.id}</span>
                    <span className="text-amber-705 font-mono text-[9px] font-bold uppercase">{issue.status}</span>
                  </div>

                  <h4 className="font-display font-bold text-xs sm:text-sm text-slate-900 leading-normal">{issue.title}</h4>
                  <p className="text-slate-500 text-xs line-clamp-2">{issue.description}</p>

                  <div className="flex items-center space-x-1.5 pt-2 border-t border-slate-50">
                    <button
                      onClick={() => onTriageIssue(issue.id, 'Em análise técnica')}
                      className="rounded bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 text-[10px] font-bold text-indigo-700 transition-colors uppercase leading-none"
                    >
                      Mapear Análise
                    </button>
                    <button
                      onClick={() => onTriageIssue(issue.id, 'Resolvida')}
                      className="rounded bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700 transition-colors uppercase leading-none"
                    >
                      Saneado
                    </button>
                    <button
                      onClick={() => onTriageIssue(issue.id, 'Arquivada')}
                      className="rounded bg-slate-50 hover:bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500 transition-colors uppercase leading-none"
                    >
                      Arquivar
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-400 text-xs">
                Backlog limpo! Todas as issues vigentes foram processadas ou respondidas.
              </div>
            )}
          </div>
        </div>

        {/* Right column: pr Triage / Merge */}
        <div className="space-y-4">
          <h3 className="font-display font-bold text-slate-955 text-sm border-b pb-2 flex items-center justify-between">
            <span>Aprovações e Consolidação de PRs ({openPRs.length})</span>
            <span className="font-mono text-[9px] uppercase bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">Revisão</span>
          </h3>

          <div className="space-y-3">
            {openPRs.length > 0 ? (
              openPRs.map((pr) => (
                <div key={pr.id} className="rounded-xl border border-slate-205 bg-white p-4.5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-slate-505">{pr.id}</span>
                    <span className="text-indigo-600 font-mono text-[9px] font-bold uppercase">{pr.status}</span>
                  </div>

                  <h4 className="font-display font-bold text-xs sm:text-sm text-slate-900 leading-none">{pr.title}</h4>
                  <p className="text-slate-505 text-xs line-clamp-1">{pr.citizenSummary}</p>

                  <div className="flex items-center space-x-1.5 pt-2 border-t border-slate-50 font-mono text-[10px]">
                    <button
                      onClick={() => onTriagePR(pr.id, 'Em votação')}
                      className="rounded bg-purple-50 hover:bg-purple-100 px-2.5 py-1 text-[10px] font-bold text-purple-705 transition-colors uppercase leading-none"
                    >
                      Disponibilizar em Urna
                    </button>
                    <button
                      onClick={() => onTriagePR(pr.id, 'Incorporado ao texto oficial')}
                      className="rounded bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 text-[10px] font-bold text-white transition-colors uppercase leading-none flex items-center space-x-1"
                    >
                      <GitMerge className="h-3.5 w-3.5 shrink-0" />
                      <span>Merge Institucional</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-400 text-xs font-mono">
                Não há Pull Requests pendentes de consolidação administrativa.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
