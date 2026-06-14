'use client';

/**
 * Hook pour gérer les URLs avec problèmes CORS
 * Détecte les erreurs CORS et utilise le proxy en fallback
 */

export function useCorsAwareUrl(originalUrl: string): {
  url: string;
  isProxied: boolean;
  tryProxyFallback: () => string;
} {
  const proxiedUrl = `/api/proxy-stream?url=${encodeURIComponent(originalUrl)}`;

  return {
    url: originalUrl,
    isProxied: false,
    tryProxyFallback: () => proxiedUrl,
  };
}

/**
 * Detecte si une erreur est liée à CORS
 */
export function isCorsError(error: any): boolean {
  const errorStr = String(error).toLowerCase();
  return (
    errorStr.includes('cors') ||
    errorStr.includes('access-control') ||
    errorStr.includes('cross-origin')
  );
}

/**
 * Detecte si une erreur est liée au réseau
 */
export function isNetworkError(error: any): boolean {
  const errorStr = String(error).toLowerCase();
  return (
    errorStr.includes('network') ||
    errorStr.includes('failed') ||
    errorStr.includes('timeout') ||
    errorStr.includes('err_')
  );
}

/**
 * Detecte si une erreur est liée au format
 */
export function isFormatError(error: any): boolean {
  const errorStr = String(error).toLowerCase();
  return (
    errorStr.includes('unsupported') ||
    errorStr.includes('format') ||
    errorStr.includes('mime') ||
    errorStr.includes('codec')
  );
}
