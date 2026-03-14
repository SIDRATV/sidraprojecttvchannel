'use client';

import { useState, useEffect } from 'react';

interface BuildInfo {
  version: string;
  buildDate: string;
  buildTime: string;
}

export function useBuildInfo() {
  const [buildInfo, setBuildInfo] = useState<BuildInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBuildInfo = async () => {
      try {
        const response = await fetch('/build-info.json', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          setBuildInfo(data);
        }
      } catch (error) {
        console.error('Failed to fetch build info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBuildInfo();
  }, []);

  return { buildInfo, loading };
}
