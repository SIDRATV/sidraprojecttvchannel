import { NextRequest, NextResponse } from 'next/server';
import { fetchAndParseM3U, sortByName } from '@/services/m3uParser';

// Cache en mémoire pour les playlists M3U par pays
const m3uCache = new Map<string, { data: any[]; timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 heure

const IPTV_URLS: Record<string, string> = {
  'FR': 'https://iptv-org.github.io/iptv/countries/fr.m3u',
  'US': 'https://iptv-org.github.io/iptv/countries/us.m3u',
  'GB': 'https://iptv-org.github.io/iptv/countries/gb.m3u',
  'UK': 'https://iptv-org.github.io/iptv/countries/gb.m3u',
  'DE': 'https://iptv-org.github.io/iptv/countries/de.m3u',
  'ES': 'https://iptv-org.github.io/iptv/countries/es.m3u',
  'IT': 'https://iptv-org.github.io/iptv/countries/it.m3u',
  'PT': 'https://iptv-org.github.io/iptv/countries/pt.m3u',
  'NL': 'https://iptv-org.github.io/iptv/countries/nl.m3u',
  'BE': 'https://iptv-org.github.io/iptv/countries/be.m3u',
  'CH': 'https://iptv-org.github.io/iptv/countries/ch.m3u',
  'BR': 'https://iptv-org.github.io/iptv/countries/br.m3u',
  'IN': 'https://iptv-org.github.io/iptv/countries/in.m3u',
  'RU': 'https://iptv-org.github.io/iptv/countries/ru.m3u',
  'CN': 'https://iptv-org.github.io/iptv/countries/cn.m3u',
  'JP': 'https://iptv-org.github.io/iptv/countries/jp.m3u',
  'KR': 'https://iptv-org.github.io/iptv/countries/kr.m3u',
  'AU': 'https://iptv-org.github.io/iptv/countries/au.m3u',
};

async function getCachedChannels(country: string): Promise<any[]> {
  const countryCode = country.toUpperCase();
  const cacheKey = `channels_${countryCode}`;
  const now = Date.now();

  // Vérifier le cache
  const cached = m3uCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  // Récupérer l'URL
  const url = IPTV_URLS[countryCode];
  if (!url) {
    throw new Error(`Pays non supporté: ${country}. Pays supportés: ${Object.keys(IPTV_URLS).join(', ')}`);
  }

  // Récupérer et parser les chaînes
  let channels = await fetchAndParseM3U(url);
  channels = sortByName(channels);

  // Mettre en cache
  m3uCache.set(cacheKey, { data: channels, timestamp: now });

  return channels;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ country: string }> }
) {
  try {
    const { country } = await params;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const countryCode = country.toUpperCase();

    // Récupérer les chaînes du pays
    let channels = await getCachedChannels(countryCode);

    // Filtrer par catégorie
    if (category && category.trim()) {
      channels = channels.filter(ch =>
        ch.category?.toLowerCase().includes(category.toLowerCase())
      );
    }

    // Filtrer par recherche (debounce côté client)
    if (search && search.trim()) {
      channels = channels.filter(ch =>
        ch.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Appliquer limite
    channels = channels.slice(0, limit);

    return NextResponse.json({
      success: true,
      country: countryCode,
      count: channels.length,
      channels: channels.map(ch => ({
        name: ch.name,
        url: ch.url,
        country: ch.country || countryCode,
        category: ch.category,
        logo: ch.logo,
        groupTitle: ch.groupTitle,
      })),
      cached: m3uCache.has(`channels_${countryCode}`),
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Channels API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur lors de la récupération des chaînes',
        supportedCountries: Object.keys(IPTV_URLS)
      },
      { status: 400 }
    );
  }
}

// POST pour vider le cache si nécessaire (admin)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ country: string }> }
) {
  try {
    const { country } = await params;
    // Vérifier si c'est une demande de clear cache
    const { action } = await request.json().catch(() => ({}));

    if (action === 'clear-cache') {
      const countryCode = country.toUpperCase();
      const cacheKey = `channels_${countryCode}`;
      m3uCache.delete(cacheKey);
      return NextResponse.json({
        success: true,
        message: `Cache cleared for ${countryCode}`,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Action invalide' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Requête invalide' },
      { status: 400 }
    );
  }
}
