/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { ApiError, requestJSON } from '../api/client';

export type ApiHealthStatus = 'checking' | 'online' | 'degraded' | 'offline';

const HEALTH_POLL_INTERVAL_MS = 60_000;

export function useApiHealth(): ApiHealthStatus {
  const [status, setStatus] = useState<ApiHealthStatus>('checking');

  useEffect(() => {
    let isMounted = true;

    async function checkHealth() {
      try {
        await requestJSON('/health');
        if (isMounted) setStatus('online');
      } catch (error) {
        if (!isMounted) return;
        setStatus(error instanceof ApiError ? 'degraded' : 'offline');
      }
    }

    checkHealth();
    const intervalId = window.setInterval(checkHealth, HEALTH_POLL_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  return status;
}
