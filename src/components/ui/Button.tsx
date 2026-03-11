'use client';

import React from 'react';
import Link from 'next/link';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2';

  const variants = {
    primary: 'bg-blue-600 dark:bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-700 shadow-lg shadow-blue-500/50',
    secondary: 'bg-blue-500/10 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30 dark:border-blue-500/30 hover:bg-blue-500/20 dark:hover:bg-blue-500/20',
    ghost: 'text-gray-700 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/5',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const buttonClass = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  const buttonElement = (
    <button
      className={buttonClass}
      {...props}
    >
      {children}
    </button>
  );

  if (href) {
    return (
      <Link href={href}>
        {buttonElement}
      </Link>
    );
  }

  return buttonElement;
}
