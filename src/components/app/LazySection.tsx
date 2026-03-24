'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface LazySectionProps {
  children: ReactNode;
  /** Skeleton shown before the section enters the viewport */
  fallback?: ReactNode;
  /** IntersectionObserver rootMargin – how early to trigger (default: 200px) */
  rootMargin?: string;
}

/**
 * Renders children only once the section scrolls into (or near) the viewport.
 * Prevents off-screen YouTube sections from making API calls on mount.
 */
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
        <div className="h-48 flex items-center justify-center">
          <div className="h-8 w-8 animate-pulse rounded-full bg-gray-800" />
        </div>
      )}
    </div>
  );
}
