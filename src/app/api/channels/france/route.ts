import { NextRequest, NextResponse } from 'next/server';
import { fetchAndParseM3U, sortByName, filterByCountry } from '@/services/m3uParser';

// Cache en mémoire pour les playlists M3U
const m3uCache = new Map<string, { data: any[]; timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 heure

const IPTV_URLS: Record<string, string> = {
  fr: 'https://iptv-org.github.io/iptv/countries/fr.m3u',
  us: 'https://iptv-org.github.io/iptv/countries/us.m3u',
  uk: 'https://iptv-org.github.io/iptv/countries/gb.m3u',
  de: 'https://iptv-org.github.io/iptv/countries/de.m3u',
  es: 'https://iptv-org.github.io/iptv/countries/es.m3u',
  it: 'https://iptv-org.github.io/iptv/countries/it.m3u',
  pt: 'https://iptv-org.github.io/iptv/countries/pt.m3u',
  nl: 'https://iptv-org.github.io/iptv/countries/nl.m3u',
  br: 'https://iptv-org.github.io/iptv/countries/br.m3u',
  in: 'https://iptv-org.github.io/iptv/countries/in.m3u',
};

async function getCachedChannels(country: string) {
  const cacheKey = `channels_${country.toLowerCase()}`;
  const now = Date.now();
  
  // Vérifier le cache
  const cached = m3uCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  // Récupérer et parser les chaînes
  const url = IPTV_URLS[country.toLowerCase()];
  if (!url) {
    throw new Error(`Unsupported country: ${country}`);
  }

  let channels = await fetchAndParseM3U(url);
  channels = sortByName(channels);

  // Mettre en cache
  m3uCache.set(cacheKey, { data: channels, timestamp: now });
  
  return channels;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Récupérer les chaînes (France par défaut)
    let channels = await getCachedChannels('fr');

    // Filtrer par catégorie
    if (category) {
      channels = channels.filter(ch => 
        ch.category?.toLowerCase().includes(category.toLowerCase())
      );
    }

    // Filtrer par recherche
    if (search) {
      channels = channels.filter(ch =>
        ch.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Appliquer limite
    channels = channels.slice(0, limit);

    return NextResponse.json({
      success: true,
      count: channels.length,
      channels: channels.map(ch => ({
        name: ch.name,
        url: ch.url,
        country: ch.country,
        category: ch.category,
        logo: ch.logo,
        groupTitle: ch.groupTitle,
      })),
    });
  } catch (error) {
    console.error('Channels API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch channels' },
      { status: 500 }
    );
  }
}
