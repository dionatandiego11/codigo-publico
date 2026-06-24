/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import { getBudgetFilters, type BudgetFilterQuery } from '../lib/api';
import type { BudgetFilter } from '../types';

export type BudgetFiltersStatus = 'loading' | 'ready' | 'error';

export function useBudgetFilters(query: BudgetFilterQuery = {}) {
  const [filters, setFilters] = useState<BudgetFilter[]>([]);
  const [status, setStatus] = useState<BudgetFiltersStatus>('loading');
  const queryKey = useMemo(() => JSON.stringify(query), [query]);

  const refresh = async () => {
    setStatus('loading');
    try {
      const apiFilters = await getBudgetFilters(query);
      setFilters(apiFilters);
      setStatus('ready');
    } catch (error) {
      console.warn('Não foi possível carregar filtros do circuit breaker.', error);
      setFilters([]);
      setStatus('error');
    }
  };

  useEffect(() => {
    let isMounted = true;
    const parsed = JSON.parse(queryKey) as BudgetFilterQuery;

    setStatus('loading');
    getBudgetFilters(parsed)
      .then(apiFilters => {
        if (!isMounted) return;
        setFilters(apiFilters);
        setStatus('ready');
      })
      .catch(error => {
        if (!isMounted) return;
        console.warn('Não foi possível carregar filtros do circuit breaker.', error);
        setFilters([]);
        setStatus('error');
      });

    return () => {
      isMounted = false;
    };
  }, [queryKey]);

  return { filters, status, refresh };
}
