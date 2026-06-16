/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { getCurrentOPCycle } from '../lib/api';
import type { OPCycle } from '../types';

export type OPCycleLoadStatus = 'loading' | 'ready' | 'empty' | 'fallback';

export function useOPCycle() {
  const [currentCycle, setCurrentCycle] = useState<OPCycle | undefined>();
  const [status, setStatus] = useState<OPCycleLoadStatus>('loading');

  useEffect(() => {
    let isMounted = true;

    getCurrentOPCycle()
      .then(cycle => {
        if (!isMounted) return;
        setCurrentCycle(cycle);
        setStatus(cycle ? 'ready' : 'empty');
      })
      .catch(error => {
        if (!isMounted) return;
        console.warn('Não foi possível carregar o ciclo atual do OP.', error);
        setStatus('fallback');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { currentCycle, status };
}
