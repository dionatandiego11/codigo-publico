/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { getAdminContext, type AdminContext } from '../lib/api';

export type AdminContextStatus = 'idle' | 'loading' | 'ready' | 'denied' | 'error';

export function useAdminContext(isAuthenticated: boolean) {
  const [adminContext, setAdminContext] = useState<AdminContext | null>(null);
  const [status, setStatus] = useState<AdminContextStatus>(isAuthenticated ? 'loading' : 'idle');

  useEffect(() => {
    if (!isAuthenticated) {
      setAdminContext(null);
      setStatus('idle');
      return;
    }

    let isMounted = true;
    setStatus('loading');

    getAdminContext()
      .then(context => {
        if (!isMounted) return;
        setAdminContext(context);
        setStatus(context.levels.length > 0 ? 'ready' : 'denied');
      })
      .catch(error => {
        if (!isMounted) return;
        console.warn('Não foi possível carregar o contexto administrativo.', error);
        setAdminContext(null);
        setStatus('error');
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  return { adminContext, status };
}
