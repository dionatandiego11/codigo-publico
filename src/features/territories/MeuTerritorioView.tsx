/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MapPin, AlertCircle, GitPullRequest, Vote, Activity, Users, Globe, ExternalLink, Compass } from 'lucide-react';
import { CivicPR, Issue, Territory } from '@/src/types';

interface MeuTerritorioViewProps {
  territories: Territory[];
  issues: Issue[];
  prs: CivicPR[];
  onSelectIssue: (id: string) => void;
  onSelectPR: (id: string) => void;
}

export default function MeuTerritorioView({ territories, issues, prs, onSelectIssue, onSelectPR }: MeuTerritorioViewProps) {
  const [selectedTerritoryId, setSelectedTerritoryId] = useState<string>('campo-grande');

  const selectedTerritory = territories.find(t => t.id === selectedTerritoryId) || territories[0];

  // Filters issues and PRs based on the selected territory
  const localIssues = selectedTerritory ? issues.filter(issue => issue.territory === selectedTerritory.name) : [];
  const localPRs = selectedTerritory
    ? prs.filter(pr => pr.affectedArticles.includes(selectedTerritory.name) || pr.citizenSummary.includes(selectedTerritory.name))
    : [];

  return (
    <div className="space-y-8 fade-in" id="territory-dashboard">
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-2 text-indigo-700 font-mono text-xs font-bold uppercase tracking-wider">
          <MapPin className="h-4 w-4" />
          <span>Localização Geográfica e Coesão Social</span>
        </div>
        <h2 className="font-display text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
          Meu Território
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
          Focalize sua participação. Veja as discussões normativas e as necessidades de infraestrutura que afetam diretamente seu bairro.
        </p>
      </div>

      {/* Territory selector pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1.5 scrollbar-thin">
        {territories.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTerritoryId(t.id)}
            className={`rounded-full px-4.5 py-2 text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${
              selectedTerritoryId === t.id
                ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                : 'bg-white border-slate-250 text-slate-600 hover:border-slate-350 hover:bg-slate-50'
            }`}
          >
            {t.name} ({t.zone})
          </button>
        ))}
      </div>

      {/* Main stats indicators of territory */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Issues do Bairro', value: selectedTerritory?.activeIssuesCount ?? 0, icon: AlertCircle, color: 'text-amber-600 bg-amber-50' },
          { label: 'PRs com Impacto Regional', value: selectedTerritory?.linkedPRsCount ?? 0, icon: GitPullRequest, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Votações Locais Ativas', value: selectedTerritory?.activeVotingsCount ?? 0, icon: Vote, color: 'text-purple-600 bg-purple-50' },
          { label: 'Projetos em Execução', value: selectedTerritory?.executionProjectsCount ?? 0, icon: Activity, color: 'text-emerald-300 bg-emerald-50/50' },
          { label: 'Cidadãos Residentes Ativos', value: selectedTerritory?.activeCitizensCount ?? 0, icon: Users, color: 'text-slate-600 bg-slate-50' },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="rounded-2xl border border-slate-205 bg-white p-5 text-center shadow-xs">
              <div className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full ${stat.color} mb-2`}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <p className="font-display font-extrabold text-slate-900 text-xl leading-tight">{stat.value}</p>
              <p className="font-mono text-[9px] uppercase font-bold tracking-wider text-slate-400 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </section>

      {/* Double column contents list */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column: Local Issues list */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-display font-bold text-slate-900 text-sm flex items-center space-x-1.5">
              <AlertCircle className="h-4.5 w-4.5 text-amber-500" />
              <span>Issues no Bairro ({localIssues.length})</span>
            </h3>
            <span className="font-mono text-[10px] text-slate-400 font-bold uppercase">Categorizados por proximidade</span>
          </div>

          <div className="space-y-3.5">
            {localIssues.length > 0 ? (
              localIssues.map((issue) => (
                <div
                  key={issue.id}
                  onClick={() => onSelectIssue(issue.id)}
                  className="rounded-xl border border-slate-150 bg-white p-4.5 cursor-pointer shadow-xs hover:border-indigo-300 hover:shadow-md transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-indigo-700">{issue.id}</span>
                    <span className="rounded bg-slate-50 border px-1.5 py-0.5 font-mono text-[8px] font-bold text-slate-500 uppercase">
                      {issue.status}
                    </span>
                  </div>

                  <h4 className="font-display font-bold text-xs sm:text-sm text-slate-900 leading-normal line-clamp-1">{issue.title}</h4>
                  <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">{issue.description}</p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono border-t border-slate-50 pt-2.5">
                    <span>Autor: {issue.authorName}</span>
                    <span>Apoios: {issue.upvotes}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-400 space-y-2">
                <Compass className="mx-auto h-8 w-8 text-slate-350" />
                <p className="text-xs">Não constam issues localizadas abertas nesta região do município.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Local PR impact list */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-display font-bold text-slate-900 text-sm flex items-center space-x-1.5">
              <GitPullRequest className="h-4.5 w-4.5 text-indigo-500" />
              <span>PRs Legis. com Impacto Direto ({localPRs.length})</span>
            </h3>
            <span className="font-mono text-[10px] text-slate-400 font-bold uppercase">Modulações territoriais</span>
          </div>

          <div className="space-y-3.5">
            {localPRs.length > 0 ? (
              localPRs.map((pr) => (
                <div
                  key={pr.id}
                  onClick={() => onSelectPR(pr.id)}
                  className="rounded-xl border border-slate-150 bg-white p-4.5 cursor-pointer shadow-xs hover:border-indigo-300 hover:shadow-md transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-emerald-700">{pr.id}</span>
                    <span className="rounded bg-indigo-50 text-indigo-700 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase">
                      {pr.status}
                    </span>
                  </div>

                  <h4 className="font-display font-bold text-xs sm:text-sm text-slate-900 leading-normal line-clamp-1">{pr.title}</h4>
                  <p className="text-slate-500 text-xs line-clamp-2">{pr.citizenSummary}</p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono border-t border-slate-50 pt-2.5">
                    <span>Proponente: {pr.authorName}</span>
                    <span>Analisar PR -&gt;</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-400 space-y-2">
                <Globe className="mx-auto h-8 w-8 text-slate-350" />
                <p className="text-xs">Não constam projetos de emenda focados no zoneamento desta gleba de terra.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
