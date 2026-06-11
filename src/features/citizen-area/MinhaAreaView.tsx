/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User, AlertCircle, GitPullRequest, Vote, Key, Eye, HelpCircle, ShieldAlert, CheckCircle, Clock, LogIn } from 'lucide-react';
import { CitizenDashboardData, Territory } from '@/src/types';

interface MinhaAreaViewProps {
  userProfile: CitizenDashboardData;
  territories: Territory[];
  isAuthenticated?: boolean;
  onRequestLogin?: () => void;
  onSelectIssue: (id: string) => void;
  onSelectPR: (id: string) => void;
  votacoes: { id: string; title: string }[];
}

export default function MinhaAreaView({
  userProfile,
  territories,
  isAuthenticated = true,
  onRequestLogin,
  onSelectIssue,
  onSelectPR,
  votacoes
}: MinhaAreaViewProps) {
  const userTerritory =
    territories.find(t => t.id === userProfile.territoryId)?.name ||
    userProfile.territoryName ||
    'Não informado';
  const initials = userProfile.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-8 fade-in" id="personal-dashboard">
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-2 text-indigo-700 font-mono text-xs font-bold uppercase tracking-wider">
          <User className="h-4 w-4" />
          <span>Portal do Cidadão Residente</span>
        </div>
        <h2 className="font-display text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
          Minha Democracia
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
          Revise suas participações, acompanhe suas demandas abertas e consulte seus comprovantes criptográficos de voto.
        </p>
      </div>

      {/* Demo-mode banner when there is no authenticated session */}
      {!isAuthenticated && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start space-x-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-display font-bold text-amber-900 text-sm">Você está vendo dados de demonstração</p>
              <p className="text-amber-800 text-xs mt-0.5">
                Entre com seu CPF para carregar suas issues, apoios e comprovantes de votação reais.
              </p>
            </div>
          </div>
          {onRequestLogin && (
            <button
              onClick={onRequestLogin}
              className="shrink-0 inline-flex items-center space-x-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition-colors"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Entrar na plataforma</span>
            </button>
          )}
        </div>
      )}

      {/* Profile summary card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs grid md:grid-cols-3 gap-6 items-center">
        <div className="md:col-span-2 flex items-center space-x-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-white font-bold text-xl uppercase shadow-sm shrink-0">
            {initials || 'CP'}
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-extrabold text-base md:text-lg text-slate-900 leading-none">
              {userProfile.name}
            </h3>
            <p className="font-mono text-xs text-indigo-600 font-bold">{userProfile.citizenId}</p>
            <div className="flex items-center space-x-3 text-xs text-slate-500 pt-0.5">
              <span><b>Território:</b> {userTerritory}</span>
              <span>•</span>
              <span><b>Registrado em:</b> {userProfile.registeredAt}</span>
            </div>
          </div>
        </div>

        {/* Security badge */}
        <div className="rounded-xl border border-dashed border-emerald-250 bg-emerald-50/15 p-4 flex items-start space-x-2.5">
          <Key className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-display font-bold text-xs text-emerald-950">Assinatura Certificada</h4>
            <p className="text-slate-500 text-[10px] leading-normal mt-0.5">
              Identidade integrada à Infraestrutura de Chaves Públicas GOV.BR. Seus votos e apoios possuem presunção legal de veracidade.
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column: My opened Issues */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-display font-bold text-slate-900 text-sm flex items-center space-x-1.5">
              <AlertCircle className="h-4.5 w-4.5 text-amber-500" />
              <span>Minhas Issues Abertas ({userProfile.createdIssues.length})</span>
            </h3>
          </div>

          <div className="space-y-3">
            {userProfile.createdIssues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => onSelectIssue(issue.id)}
                className="rounded-xl border border-slate-150 bg-white p-4 cursor-pointer shadow-xs hover:border-slate-300 transition-all flex items-center justify-between"
              >
                <div>
                  <span className="font-mono text-[10px] font-bold text-slate-400 block">{issue.id}</span>
                  <span className="font-display font-semibold text-xs sm:text-sm text-slate-800 line-clamp-1">{issue.title}</span>
                </div>
                <span className="rounded bg-amber-50 text-amber-700 px-2 py-0.5 text-[9px] font-mono font-bold uppercase shrink-0">
                  {issue.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Encrypted Voting receipts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-display font-bold text-slate-900 text-sm flex items-center space-x-1.5">
              <Vote className="h-4.5 w-4.5 text-indigo-500" />
              <span>Comprovantes de Votação ({userProfile.votedList.length})</span>
            </h3>
          </div>

          <div className="space-y-3">
            {userProfile.votedList.length > 0 ? (
              userProfile.votedList.map((voteReceipt) => {
                const votingObj = votacoes.find(v => v.id === voteReceipt.id);
                return (
                  <div key={voteReceipt.id} className="rounded-xl border border-slate-205 bg-white p-4 space-y-3.5 shadow-xs font-mono text-[11px] leading-relaxed relative">
                    <div className="flex items-start justify-between border-b border-slate-50 pb-2">
                      <div className="space-y-0.5 text-left">
                        <span className="text-slate-400 block font-bold text-[9px] uppercase">Tema de Consulta</span>
                        <span className="font-sans font-bold text-slate-800 text-xs line-clamp-1">{votingObj?.title || 'PR Cívico'}</span>
                      </div>
                      <span className="rounded bg-emerald-50 text-emerald-700 px-1.5 py-0.5 font-bold uppercase shrink-0 text-[10px] flex items-center space-x-1">
                        <CheckCircle className="h-3 w-3 shrink-0" />
                        <span>Assinado</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                      <div>
                        <span>CÓDIGO COMPROVANTE:</span>
                        <span className="block font-bold text-slate-800 select-all">{voteReceipt.receipt}</span>
                      </div>
                      <div>
                        <span>HASH MUNICÍPIO:</span>
                        <span className="block font-bold text-slate-800 select-all">{voteReceipt.txHash.slice(0, 10)}...</span>
                      </div>
                    </div>

                    <div className="text-[9px] text-slate-400 border-t border-slate-50 pt-2 flex items-center space-x-1 justify-end">
                      <Clock className="h-3 w-3 text-slate-300" />
                      <span>Processado com conformidade LGPD</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-400 text-xs">
                Você ainda não votou em nenhuma consulta popular ativa neste turno.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
