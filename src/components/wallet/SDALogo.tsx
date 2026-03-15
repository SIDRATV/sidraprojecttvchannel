'use client';

import { cn } from '@/lib/utils';

interface SDALogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

const sizeMap = {
  sm: 16,
  md: 24,
  lg: 32,
};

export function SDALogo({ size = 'md', className, showLabel = false }: SDALogoProps) {
  const pixelSize = sizeMap[size];

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <img
        src="/images/sda-logo.png"
        alt="SDA Token Logo"
        width={pixelSize}
        height={pixelSize}
        className="object-contain rounded-full inline-block"
        style={{ width: `${pixelSize}px`, height: `${pixelSize}px` }}
      />
      {showLabel && <span className="font-semibold text-white">SDA</span>}
    </span>
  );
}

// Inline logo component (for use within text)
export function SDALogoInline({ size = 'sm', className }: Omit<SDALogoProps, 'showLabel'>) {
  const pixelSize = sizeMap[size];

  return (
    <span className={cn('inline-flex items-center', className)}>
      <img
        src="/images/sda-logo.png"
        alt="SDA Token Logo"
        width={pixelSize}
        height={pixelSize}
        className="object-contain rounded-full inline-block"
        style={{ width: `${pixelSize}px`, height: `${pixelSize}px` }}
      />
    </span>
  );
}
