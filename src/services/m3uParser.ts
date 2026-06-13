/**
 * M3U Parser Service - Parses IPTV M3U playlist format
 * Supports standard M3U format with EXTINF headers
 */

export interface ParsedChannel {
  name: string;
  url: string;
  country: string;
  category: string;
  logo?: string;
  groupTitle?: string;
}

export async function fetchAndParseM3U(url: string): Promise<ParsedChannel[]> {
  try {
    const response = await fetch(url, { 
      headers: { 'User-Agent': 'Sidra-TV-Channel/1.0' },
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch M3U: ${response.statusText}`);
    }
    
    const content = await response.text();
    return parseM3U(content);
  } catch (error) {
    console.error('M3U fetch error:', error);
    throw error;
  }
}

/**
 * Parse M3U content
 * Format:
 * #EXTM3U
 * #EXTINF:-1 tvg-id="channel.id" tvg-name="Channel Name" tvg-logo="logo.png" group-title="Category",Display Name
 * stream_url
 */
export function parseM3U(content: string): ParsedChannel[] {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);
  const channels: ParsedChannel[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Look for EXTINF line (channel metadata)
    if (line.startsWith('#EXTINF:')) {
      const extinf = line.substring('#EXTINF:'.length);
      
      // Parse attributes from EXTINF
      const attributes = parseExtinfAttributes(extinf);
      
      // Next line is the stream URL
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        
        // Skip if next line is another comment
        if (!nextLine.startsWith('#')) {
          const channel: ParsedChannel = {
            name: attributes.name || 'Unknown',
            url: nextLine,
            country: extractCountry(attributes.tvgId || ''),
            category: attributes.groupTitle || 'Autres',
            logo: attributes.tvgLogo,
            groupTitle: attributes.groupTitle,
          };
          
          channels.push(channel);
          i++; // Skip the URL line since we already processed it
        }
      }
    }
  }
  
  return channels;
}

interface ExtinfAttributes {
  tvgId?: string;
  tvgName?: string;
  tvgLogo?: string;
  groupTitle?: string;
  name: string;
}

/**
 * Parse EXTINF line attributes
 * Format: duration tvg-id="id" tvg-name="name" tvg-logo="logo" group-title="group",Display Name
 */
function parseExtinfAttributes(extinf: string): ExtinfAttributes {
  const attributes: ExtinfAttributes = { name: '' };
  
  // Split by comma to separate attributes from display name
  const parts = extinf.split(',');
  const displayName = parts[parts.length - 1]?.trim() || 'Unknown';
  attributes.name = displayName;
  
  // Parse attribute section (everything before last comma)
  const attrSection = parts.slice(0, -1).join(',');
  
  // tvg-id="..."
  const tvgIdMatch = attrSection.match(/tvg-id="([^"]*)"/);
  if (tvgIdMatch) attributes.tvgId = tvgIdMatch[1];
  
  // tvg-name="..."
  const tvgNameMatch = attrSection.match(/tvg-name="([^"]*)"/);
  if (tvgNameMatch) attributes.tvgName = tvgNameMatch[1];
  
  // tvg-logo="..."
  const tvgLogoMatch = attrSection.match(/tvg-logo="([^"]*)"/);
  if (tvgLogoMatch) attributes.tvgLogo = tvgLogoMatch[1];
  
  // group-title="..."
  const groupTitleMatch = attrSection.match(/group-title="([^"]*)"/);
  if (groupTitleMatch) attributes.groupTitle = groupTitleMatch[1];
  
  return attributes;
}

/**
 * Extract country code from tvg-id
 * Example: fr.france24 -> FR
 */
function extractCountry(tvgId: string): string {
  if (!tvgId) return 'FR';
  
  const countryCode = tvgId.split('.')[0]?.toUpperCase();
  return countryCode || 'FR';
}

/**
 * Filter channels by category
 */
export function filterByCategory(channels: ParsedChannel[], category: string): ParsedChannel[] {
  return channels.filter(ch => ch.category?.toLowerCase() === category.toLowerCase());
}

/**
 * Filter channels by country
 */
export function filterByCountry(channels: ParsedChannel[], country: string): ParsedChannel[] {
  return channels.filter(ch => ch.country === country.toUpperCase());
}

/**
 * Sort channels by name
 */
export function sortByName(channels: ParsedChannel[]): ParsedChannel[] {
  return [...channels].sort((a, b) => a.name.localeCompare(b.name));
}
