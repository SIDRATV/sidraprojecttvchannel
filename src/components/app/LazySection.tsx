'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface LazySectionProps {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
}

export function LazySection({
  children,
  fallback,
  rootMargin = '200px',
}: LazySectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  if (visible) return <>{children}</>;

  return (
    <div ref={ref}>
      {fallback ?? (
        <div className="space-y-4">
          {/* Skeleton header */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 w-48 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
              <div className="h-3 w-64 rounded-lg bg-gray-100 dark:bg-gray-800/60 animate-pulse" />
            </div>
          </div>
          {/* Skeleton cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="aspect-[2/3] rounded-xl bg-gray-200 dark:bg-gray-800" />
                <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
