/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';

/**
 * Roteador mínimo sobre a History API: a URL do navegador é a fonte da
 * verdade, com suporte a botão voltar/avançar e links compartilháveis,
 * preservando o contrato `currentPath`/`setPath` já usado pelas views.
 */
export function useBrowserRouter() {
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const setPath = useCallback((path: string) => {
    if (path !== window.location.pathname) {
      window.history.pushState({}, '', path);
    }

    setCurrentPath(path);
    window.scrollTo({ top: 0 });
  }, []);

  return { currentPath, setPath };
}

/** Extrai o segmento de detalhe de rotas como `/prs/046` → `#046`. */
export function routeEntityId(currentPath: string, basePath: string): string | null {
  if (!currentPath.startsWith(`${basePath}/`)) return null;

  const segment = decodeURIComponent(currentPath.slice(basePath.length + 1)).trim();
  if (!segment) return null;

  return segment.startsWith('#') ? segment : `#${segment}`;
}

/** Converte um id público como `#046` no caminho `/prs/046`. */
export function entityPath(basePath: string, publicId: string): string {
  return `${basePath}/${encodeURIComponent(publicId.replace(/^#/, ''))}`;
}
