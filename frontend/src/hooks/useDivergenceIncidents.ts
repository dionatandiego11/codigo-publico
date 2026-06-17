/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { getDivergenceIncidents } from '../lib/api';
import type { OPDivergenceIncident } from '../types';

export type DivergenceIncidentsStatus = 'loading' | 'ready' | 'error';

export function useDivergenceIncidents() {
  const [incidents, setIncidents] = useState<OPDivergenceIncident[]>([]);
  const [status, setStatus] = useState<DivergenceIncidentsStatus>('loading');

  const refresh = async () => {
    setStatus('loading');
    try {
      const apiIncidents = await getDivergenceIncidents();
      setIncidents(apiIncidents);
      setStatus('ready');
    } catch (error) {
      console.warn('Não foi possível carregar incidentes de divergência.', error);
      setIncidents([]);
      setStatus('error');
    }
  };

  useEffect(() => {
    let isMounted = true;

    getDivergenceIncidents()
      .then(apiIncidents => {
        if (!isMounted) return;
        setIncidents(apiIncidents);
        setStatus('ready');
      })
      .catch(error => {
        if (!isMounted) return;
        console.warn('Não foi possível carregar incidentes de divergência.', error);
        setIncidents([]);
        setStatus('error');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { incidents, status, refresh };
}
