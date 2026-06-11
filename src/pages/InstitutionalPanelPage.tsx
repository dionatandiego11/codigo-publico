/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { GitMerge, LoaderCircle } from 'lucide-react';
import { getPRTransitions, type PRTransitionInfo } from '../lib/api';
import { Badge, PageTitle, statusClass } from '../shared/ui';
import type { CivicPR, Issue, IssueStatus, PRStatus } from '../types';

const triageButtonClass = 'btn-secondary btn-sm';
const approveButtonClass = 'btn-success btn-sm';
const mergeButtonClass = 'btn-primary btn-sm';

export function InstitutionalPanel({
  issues,
  prs,
  isAuthenticated,
  onTriageIssue,
  onTriagePR
}: {
  issues: Issue[];
  prs: CivicPR[];
  isAuthenticated: boolean;
  onTriageIssue: (issueId: string, status: IssueStatus) => void;
  onTriagePR: (prId: string, status: PRStatus) => void;
}) {
  const pendingIssues = issues.filter(issue => !['Resolvida', 'Arquivada'].includes(issue.status));
  const activePRs = prs.filter(pr => !['Incorporado ao texto oficial', 'Rejeitado', 'Arquivado'].includes(pr.status));

  return (
    <div className="space-y-6 fade-in">
      <PageTitle
        eyebrow="Rito formal"
        title="Console institucional"
        subtitle="Triagem, status formal e merge ficam separados do clique popular. As ações de PR refletem a máquina de estados do backend."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass-panel p-5 rounded-[20px]">
          <h2 className="font-display text-lg font-bold text-white">Issues para triagem</h2>
          <div className="mt-4 space-y-3">
            {pendingIssues.map(issue => (
              <div key={issue.id} className="rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.02)] p-4">
                <Badge className={statusClass(issue.status)}>{issue.status}</Badge>
                <h3 className="mt-2 text-sm font-bold text-white">{issue.id} — {issue.title}</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => onTriageIssue(issue.id, 'Em análise técnica')} className={triageButtonClass}>Análise técnica</button>
                  <button onClick={() => onTriageIssue(issue.id, 'Resolvida')} className={approveButtonClass}>Resolver</button>
                  <button onClick={() => onTriageIssue(issue.id, 'Arquivada')} className={triageButtonClass}>Arquivar</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel p-5 rounded-[20px]">
          <h2 className="font-display text-lg font-bold text-white">PRs em rito</h2>
          <div className="mt-4 space-y-3">
            {activePRs.map(pr => (
              <PRTriageCard
                key={pr.id}
                pr={pr}
                isAuthenticated={isAuthenticated}
                onTriagePR={onTriagePR}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/**
 * Card de tramitação de um PR. Com sessão ativa, consulta a máquina de estados
 * do backend (GET /prs/{id}/transitions) e exibe apenas as transições que o
 * papel do ator pode disparar. Sem sessão ou com a API fora, recua para o
 * conjunto estático de ações (modo demonstração).
 */
function PRTriageCard({
  pr,
  isAuthenticated,
  onTriagePR
}: {
  pr: CivicPR;
  isAuthenticated: boolean;
  onTriagePR: (prId: string, status: PRStatus) => void;
}) {
  const [transitions, setTransitions] = useState<PRTransitionInfo[] | null>(null);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setTransitions(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    getPRTransitions(pr.id)
      .then(response => {
        if (isMounted) setTransitions(response.transitions);
      })
      .catch(error => {
        console.warn(`Não foi possível carregar transições do PR ${pr.id}; usando ações padrão.`, error);
        if (isMounted) setTransitions(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [pr.id, pr.status, isAuthenticated]);

  const canMerge = pr.status === 'Aprovado formalmente';

  return (
    <div className="rounded-xl border border-[var(--color-git-border2)] bg-[rgba(255,255,255,0.02)] p-4">
      <Badge className={statusClass(pr.status)}>{pr.status}</Badge>
      <h3 className="mt-2 text-sm font-bold text-white">{pr.id} — {pr.title}</h3>

      <div className="mt-3 flex flex-wrap gap-2">
        {isLoading && (
          <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-git-muted)]">
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            Consultando fluxo institucional…
          </span>
        )}

        {!isLoading && transitions !== null && (
          <>
            {transitions.length === 0 && !canMerge && (
              <span className="text-xs text-[var(--color-git-muted)]">
                Seu papel não possui transições disponíveis a partir deste estado.
              </span>
            )}
            {transitions.map(transition => (
              <button
                key={transition.key}
                onClick={() => onTriagePR(pr.id, transition.toStatus as PRStatus)}
                title={transition.description}
                className={transition.toStatus === 'Aprovado formalmente' ? approveButtonClass : triageButtonClass}
              >
                {transition.toStatus}
              </button>
            ))}
          </>
        )}

        {!isLoading && transitions === null && (
          <>
            <button onClick={() => onTriagePR(pr.id, 'Em revisão técnica')} className={triageButtonClass}>Revisão técnica</button>
            <button onClick={() => onTriagePR(pr.id, 'Pronto para votação')} className={triageButtonClass}>Pronto para voto</button>
            <button onClick={() => onTriagePR(pr.id, 'Aprovado formalmente')} className={approveButtonClass}>Aprovar formalmente</button>
          </>
        )}

        {!isLoading && canMerge && (
          <button
            onClick={() => onTriagePR(pr.id, 'Incorporado ao texto oficial')}
            title="Executa o merge institucional: aplica os diffs ao texto oficial e gera a release legislativa."
            className={mergeButtonClass}
          >
            <GitMerge className="h-3.5 w-3.5" />
            Merge institucional
          </button>
        )}
      </div>
    </div>
  );
}
