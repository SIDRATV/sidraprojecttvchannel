'use client';

import Image from 'next/image';
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
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="relative" style={{ width: pixelSize, height: pixelSize }}>
        <Image
          src="https://image2url.com/r2/default/images/1772288434807-f6ee6c1e-ae55-4647-8dc2-032b697c4bf9.png"
          alt="SDA Token Logo"
          fill
          className="object-contain rounded-full"
          priority
        />
      </div>
      {showLabel && <span className="font-semibold text-white">SDA</span>}
    </div>
  );
}

// Inline logo component (for use within text)
export function SDALogoInline({ size = 'sm', className }: Omit<SDALogoProps, 'showLabel'>) {
  const pixelSize = sizeMap[size];

  return (
    <div className={cn('inline-flex items-center', className)} style={{ width: pixelSize, height: pixelSize }}>
      <Image
        src="https://image2url.com/r2/default/images/1772288434807-f6ee6c1e-ae55-4647-8dc2-032b697c4bf9.png"
        alt="SDA Token Logo"
        width={pixelSize}
        height={pixelSize}
        className="object-contain rounded-full"
        priority
      />
    </div>
  );
}
