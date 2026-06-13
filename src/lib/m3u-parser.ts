/**
 * M3U Parser for IPTV playlists
 * Parses standard M3U format used by IPTV playlists
 */

export interface M3UChannel {
  name: string;
  url: string;
  country?: string;
  category?: string;
  logo?: string;
  epgId?: string;
}

/**
 * Parse M3U content and extract channels
 * @param content M3U file content as string
 * @returns Array of parsed channels
 */
export function parseM3U(content: string): M3UChannel[] {
  const lines = content.split('\n').map((line) => line.trim());
  const channels: M3UChannel[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Look for EXTINF lines (metadata)
    if (line.startsWith('#EXTINF:')) {
      // Extract metadata from EXTINF line
      // Format: #EXTINF:-1 tvg-id="..." tvg-name="..." tvg-logo="..." group-title="...", Channel Name
      const metadataMatch = line.match(/#EXTINF:.*?,(.*?)$/);
      const name = metadataMatch ? metadataMatch[1].trim() : '';

      // Extract attributes
      const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
      const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/);
      const groupTitleMatch = line.match(/group-title="([^"]*)"/);
      const countryMatch = line.match(/tvg-country="([^"]*)"/);

      // Get URL from next line
      const nextLine = lines[i + 1]?.trim();
      if (nextLine && !nextLine.startsWith('#') && nextLine) {
        const channel: M3UChannel = {
          name,
          url: nextLine,
          category: groupTitleMatch ? groupTitleMatch[1] : undefined,
          country: countryMatch ? countryMatch[1] : 'FR',
          logo: tvgLogoMatch ? tvgLogoMatch[1] : undefined,
          epgId: tvgIdMatch ? tvgIdMatch[1] : undefined,
        };

        if (channel.name && channel.url) {
          channels.push(channel);
        }

        i++; // Skip next line since we processed it
      }
    }
  }

  return channels;
}

/**
 * Fetch M3U playlist from URL and parse it
 * @param url URL to M3U playlist
 * @returns Array of parsed channels
 */
export async function fetchAndParseM3U(url: string): Promise<M3UChannel[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch M3U: ${response.statusText}`);
    }

    const content = await response.text();
    return parseM3U(content);
  } catch (error) {
    console.error('Error fetching/parsing M3U:', error);
    throw error;
  }
}
