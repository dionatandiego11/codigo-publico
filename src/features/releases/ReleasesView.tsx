/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React from 'react';
import { History, FileText, Calendar, Building2, CheckCircle2, ChevronRight, ArrowUpRight, HelpCircle } from 'lucide-react';
import { Release } from '@/src/types';

interface ReleasesViewProps {
  releases: Release[];
  onSelectPR: (prId: string) => void;
}

export default function ReleasesView({ releases, onSelectPR }: ReleasesViewProps) {
  return (
    <div className="space-y-8 fade-in" id="releases-hub-manager">
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-2 text-indigo-700 font-mono text-xs font-bold uppercase tracking-wider">
          <History className="h-4 w-4" />
          <span>Histórico de Releases do Sistema</span>
        </div>
        <h2 className="font-display text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
          Releases Legislativas Consolidadas
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
          As versões oficiais periódicas compiladas após o rito formal de aprovação legislativa parlamentar.
        </p>
      </div>

      {/* Meta explanation */}
      <div className="rounded-2xl border border-slate-200 bg-slate-900 text-white p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="font-mono text-[9px] font-bold text-indigo-400 uppercase">O que é uma Release no Direito?</span>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
            Uma release legislativa consolida de forma integral o texto de uma norma após as emendas aprovadas do ano atual. Isso evita leis esparsas e confusas, garantindo que o cidadão consulte o "Kernel" na versão de produção vigente.
          </p>
        </div>
        <div className="rounded-lg bg-slate-800 p-2.5 font-mono text-[11px] text-indigo-300 border border-slate-700 text-center select-none">
          Active Main Branch: <span className="text-emerald-400 font-bold">lei-organica/v2026.0</span>
        </div>
      </div>

      {/* Grid List of compiled releases */}
      <div className="space-y-6">
        {releases.map((release) => (
          <div
            key={release.id}
            className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs space-y-6 hover:shadow-md transition-shadow"
            id={`release-block-${release.id.replace('.', '-')}`}
          >
            {/* overhead header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3.5 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2.5">
                  <span className="rounded-xl bg-slate-900 text-white font-mono font-bold text-xs px-3 py-1">
                    {release.id}
                  </span>
                  <span className="text-slate-400 font-mono text-xs">•</span>
                  <span className="text-slate-600 font-display font-bold text-sm">
                    {release.repositoryName}
                  </span>
                </div>
                <h3 className="font-display font-extrabold text-lg text-slate-900 mt-1.5">
                  {release.title}
                </h3>
              </div>

              <div className="flex flex-col items-stretch sm:items-end gap-1.5 shrink-0 text-slate-500 font-mono text-[11px]">
                <span className="flex items-center space-x-1 sm:justify-end">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Publicada em {release.date}</span>
                </span>
                <span className="flex items-center space-x-1 sm:justify-end text-[10px]">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  <span>Doc: {(release.officialDocumentUrl ?? 'Documento oficial pendente').split(' - ')[0]}</span>
                </span>
              </div>
            </div>

            {/* Changelog points */}
            <div className="space-y-3">
              <h4 className="font-display font-bold text-xs uppercase text-slate-400 tracking-wider">Changelog de Modificações (Alterações de Código)</h4>
              <ul className="space-y-2">
                {release.changelog.map((change, idx) => (
                  <li key={idx} className="flex items-start space-x-2.5 text-slate-700 text-xs sm:text-sm">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Merged branch pull requests */}
            <div className="rounded-xl bg-slate-50 border border-slate-150 p-4 space-y-2">
              <span className="font-mono text-[9px] font-extrabold text-slate-400 block uppercase">
                Pulls Requests (PRs Cívicos) Incorporados e Merged nesta versão:
              </span>
              <div className="flex flex-wrap gap-2 pt-1">
                {release.incorporatedPRIds.map((prId) => (
                  <button
                    key={prId}
                    onClick={() => onSelectPR(prId)}
                    className="inline-flex items-center space-x-1.5 rounded-lg border border-slate-205 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                  >
                    <span>{prId}</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </button>
                ))}
              </div>
            </div>

            {/* Promulgation details */}
            <div className="flex justify-between items-center flex-wrap pt-2 gap-2 text-[11px] text-slate-400 font-mono border-t border-slate-50 mt-1">
              <span className="flex items-center space-x-1">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                <span>Promulgação: {release.promulgatedBy}</span>
              </span>
              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold font-mono">
                COMPILADO FINAL_MASTER
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
