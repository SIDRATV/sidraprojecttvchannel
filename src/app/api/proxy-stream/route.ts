/**
 * CORS Proxy pour les flux vidéo
 * Contourne les restrictions CORS en proxyfiant les requêtes
 */

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return new Response('URL parameter required', { status: 400 });
  }

  try {
    // Valider l'URL
    const urlObj = new URL(url);
    
    // Ne proxifier que les URLs HTTPS ou HTTP
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return new Response('Invalid protocol', { status: 400 });
    }

    // Récupérer le flux
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://sidraprojecttvchannel-drab.vercel.app',
      },
      redirect: 'follow',
    });

    // Créer une nouvelle réponse avec les headers CORS
    const data = await response.arrayBuffer();
    
    return new Response(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
        'Content-Length': String(data.byteLength),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Range',
        'Access-Control-Expose-Headers': 'Content-Type, Content-Length, Content-Range',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('[Proxy Stream Error]:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to proxy stream',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range',
    },
  });
}
