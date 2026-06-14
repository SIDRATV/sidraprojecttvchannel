/**
 * HLS Diagnostic System - Analyse détaillée des erreurs de flux vidéo
 */

export interface DiagnosticResult {
  errorType: ErrorType;
  errorCode: string;
  severity: 'fatal' | 'warning' | 'info';
  message: string;
  details: string;
  suggestion: string;
  timestamp: string;
  url?: string;
  statusCode?: number;
}

export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_URL = 'INVALID_URL',
  CORS_ERROR = 'CORS_ERROR',
  GEO_BLOCKED = 'GEO_BLOCKED',
  TIMEOUT = 'TIMEOUT',
  FORMAT_NOT_SUPPORTED = 'FORMAT_NOT_SUPPORTED',
  MANIFEST_PARSING_ERROR = 'MANIFEST_PARSING_ERROR',
  SEGMENT_LOADING_ERROR = 'SEGMENT_LOADING_ERROR',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Identifie le type d'erreur à partir des informations HLS.js
 */
export function identifyErrorType(
  event: any,
  url: string
): { type: ErrorType; statusCode?: number } {
  const error = event?.error;
  const response = event?.response;
  const statusCode = response?.code;

  // Erreurs HLS.js spécifiques
  if (error) {
    const errorDetails = error.details || '';
    const errorType = error.type || '';

    // Format non supporté
    if (
      errorDetails.includes('manifest') ||
      errorDetails.includes('level') ||
      errorDetails.includes('MANIFEST_INCOMPATIBLE_CODECS_ERROR')
    ) {
      return { type: ErrorType.FORMAT_NOT_SUPPORTED, statusCode };
    }

    // Erreur réseau
    if (
      errorType === 'networkError' ||
      errorDetails.includes('NetworkError') ||
      errorDetails.includes('Failed to fetch')
    ) {
      return { type: ErrorType.NETWORK_ERROR, statusCode };
    }

    // Timeout
    if (
      errorDetails.includes('timeout') ||
      errorDetails.includes('Timeout') ||
      errorDetails.includes('SEGMENT_PARSING_ERROR')
    ) {
      return { type: ErrorType.TIMEOUT, statusCode };
    }
  }

  // Erreurs HTTP
  if (statusCode) {
    // CORS error
    if (statusCode === 0 || statusCode === 401) {
      return { type: ErrorType.CORS_ERROR, statusCode };
    }

    // Géoblocage
    if (statusCode === 403) {
      return { type: ErrorType.GEO_BLOCKED, statusCode };
    }

    // URL invalide
    if (statusCode === 404) {
      return { type: ErrorType.INVALID_URL, statusCode };
    }

    // Erreur réseau
    if (statusCode >= 500) {
      return { type: ErrorType.NETWORK_ERROR, statusCode };
    }
  }

  // Vérifier l'URL
  if (!isValidURL(url)) {
    return { type: ErrorType.INVALID_URL };
  }

  return { type: ErrorType.UNKNOWN };
}

/**
 * Valide le format de l'URL
 */
function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return url.endsWith('.m3u8') || url.includes('playlist');
  } catch {
    return false;
  }
}

/**
 * Crée un diagnostic détaillé à partir d'une erreur
 */
export function createDiagnostic(
  event: any,
  url: string
): DiagnosticResult {
  const { type, statusCode } = identifyErrorType(event, url);
  const timestamp = new Date().toISOString();

  const diagnosticMap: Record<ErrorType, DiagnosticResult> = {
    [ErrorType.NETWORK_ERROR]: {
      errorType: ErrorType.NETWORK_ERROR,
      errorCode: `NET_${statusCode || '000'}`,
      severity: 'fatal',
      message: '❌ Erreur réseau - Le flux est inaccessible',
      details: `Le serveur n'est pas accessible. Code HTTP: ${
        statusCode || 'Unknown'
      }. Vérifiez votre connexion Internet et que l'URL est correcte.`,
      suggestion:
        '1. Vérifiez votre connexion Internet\n2. Attendez quelques secondes et réessayez\n3. Vérifiez que l\'URL du flux est valide',
      timestamp,
      url,
      statusCode,
    },

    [ErrorType.INVALID_URL]: {
      errorType: ErrorType.INVALID_URL,
      errorCode: 'INVALID_URL_001',
      severity: 'fatal',
      message: '❌ URL invalide - Format non reconnu',
      details: `L'URL fournie n'est pas une URL HLS valide. Une URL HLS doit se terminer par ".m3u8" ou contenir "playlist".\nURL fournie: ${url}`,
      suggestion:
        '1. Vérifiez que l\'URL se termine par ".m3u8"\n2. Vérifiez que l\'URL est complète et correcte\n3. Vérifiez que l\'URL n\'a pas d\'espaces',
      timestamp,
      url,
    },

    [ErrorType.CORS_ERROR]: {
      errorType: ErrorType.CORS_ERROR,
      errorCode: `CORS_${statusCode || '000'}`,
      severity: 'fatal',
      message: '❌ Erreur CORS - Le serveur refuse la requête',
      details: `Le serveur a refusé l'accès au flux pour des raisons de sécurité (CORS - Cross-Origin Resource Sharing). Code HTTP: ${
        statusCode || '0 (Unauthorized)'
      }.`,
      suggestion:
        '1. Le serveur du flux doit autoriser les requêtes cross-origin\n2. Contactez l\'administrateur du service de streaming\n3. Vérifiez les en-têtes CORS du serveur',
      timestamp,
      url,
      statusCode,
    },

    [ErrorType.GEO_BLOCKED]: {
      errorType: ErrorType.GEO_BLOCKED,
      errorCode: 'GEO_403',
      severity: 'warning',
      message: '⛔ Contenu géobloqu\u00e9 - Acc\u00e8s refus\u00e9 depuis votre localisation',
      details:
        'Le flux vidéo est restreint géographiquement et n\'est pas disponible dans votre région. Code HTTP: 403 Forbidden.',
      suggestion:
        '1. Ce contenu n\'est pas disponible dans votre région\n2. Vérifiez les conditions d\'accès du service\n3. Utilisez un VPN si c\'est autorisé par le service',
      timestamp,
      url,
      statusCode: 403,
    },

    [ErrorType.TIMEOUT]: {
      errorType: ErrorType.TIMEOUT,
      errorCode: 'TIMEOUT_001',
      severity: 'warning',
      message: '⏱️ Timeout - Le flux prend trop de temps à charger',
      details:
        'La connexion au serveur a expiré. Le serveur met trop de temps à répondre ou les segments vidéo prennent trop de temps à charger.',
      suggestion:
        '1. Vérifiez votre vitesse Internet\n2. Attendez quelques secondes et réessayez\n3. Essayez une résolution inférieure si possible\n4. Vérifiez l\'état du serveur',
      timestamp,
      url,
      statusCode,
    },

    [ErrorType.FORMAT_NOT_SUPPORTED]: {
      errorType: ErrorType.FORMAT_NOT_SUPPORTED,
      errorCode: 'FORMAT_001',
      severity: 'fatal',
      message: '📦 Format non supporté - Codec incompatible',
      details:
        'Les codecs vidéo/audio utilisés dans le flux ne sont pas supportés par votre navigateur. Le flux utilise des codecs non compatibles.',
      suggestion:
        '1. Mettez à jour votre navigateur\n2. Utilisez un navigateur moderne (Chrome, Firefox, Safari)\n3. Contactez le fournisseur du flux pour utiliser des codecs standards (H.264, AAC)',
      timestamp,
      url,
    },

    [ErrorType.MANIFEST_PARSING_ERROR]: {
      errorType: ErrorType.MANIFEST_PARSING_ERROR,
      errorCode: 'MANIFEST_001',
      severity: 'fatal',
      message: '📋 Erreur de parsing du manifeste HLS',
      details:
        'Le fichier de manifeste HLS (.m3u8) est invalide ou mal formé. Le parser HLS.js ne peut pas l\'interpréter correctement.',
      suggestion:
        '1. Vérifiez que l\'URL pointe bien vers un fichier .m3u8\n2. Vérifiez que le fichier .m3u8 est valide\n3. Validez le manifeste sur https://hlsdemux.github.io/\n4. Contactez le fournisseur du flux',
      timestamp,
      url,
    },

    [ErrorType.SEGMENT_LOADING_ERROR]: {
      errorType: ErrorType.SEGMENT_LOADING_ERROR,
      errorCode: 'SEGMENT_001',
      severity: 'warning',
      message: '🎬 Erreur de chargement d\'un segment vidéo',
      details:
        'Un segment vidéo n\'a pas pu être chargé. Cela peut être temporaire ou indiquer un problème avec le flux.',
      suggestion:
        '1. Attendez quelques secondes et réessayez\n2. Vérifiez votre connexion Internet\n3. Réactualisez la page\n4. Le lecteur va peut-être continuer automatiquement',
      timestamp,
      url,
    },

    [ErrorType.UNKNOWN]: {
      errorType: ErrorType.UNKNOWN,
      errorCode: 'UNKNOWN_001',
      severity: 'warning',
      message: '❓ Erreur inconnue',
      details: `Une erreur inconnue s\'est produite lors du chargement du flux. Les informations disponibles: ${JSON.stringify(
        event,
        null,
        2
      )}`,
      suggestion:
        '1. Vérifiez la console du navigateur pour plus de détails\n2. Réactualisez la page\n3. Essayez dans un autre navigateur\n4. Contactez le support technique',
      timestamp,
      url,
    },
  };

  return diagnosticMap[type];
}

/**
 * Enregistre le diagnostic dans la console
 */
export function logDiagnostic(diagnostic: DiagnosticResult): void {
  const severityStyles = {
    fatal: 'color: #ff4444; font-weight: bold;',
    warning: 'color: #ffaa00; font-weight: bold;',
    info: 'color: #4488ff; font-weight: bold;',
  };

  console.group(
    `%c[HLS DIAGNOSTIC] ${diagnostic.errorType}`,
    severityStyles[diagnostic.severity]
  );

  console.log(`%c📌 Message:`, 'color: #ffffff; font-weight: bold;');
  console.log(diagnostic.message);

  console.log(`%c📋 Détails:`, 'color: #ffffff; font-weight: bold;');
  console.log(diagnostic.details);

  console.log(`%c💡 Suggestions:`, 'color: #90EE90; font-weight: bold;');
  console.log(diagnostic.suggestion);

  console.log(`%c🔗 URL:`, 'color: #87CEEB; font-weight: bold;');
  console.log(diagnostic.url);

  if (diagnostic.statusCode) {
    console.log(`%c📊 Code HTTP:`, 'color: #FFB6C1; font-weight: bold;');
    console.log(diagnostic.statusCode);
  }

  console.log(`%c⏰ Timestamp:`, 'color: #CCCCCC; font-weight: bold;');
  console.log(diagnostic.timestamp);

  console.groupEnd();
}

/**
 * Crée un message utilisateur lisible
 */
export function getUserFriendlyMessage(diagnostic: DiagnosticResult): string {
  return `${diagnostic.message}\n\n${diagnostic.details}\n\n📝 Suggestions:\n${diagnostic.suggestion}`;
}
