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
    primary: 'bg-gradient-to-r from-brand-500 to-brand-400 text-white hover:shadow-glow hover:brightness-110 active:scale-[0.98]',
    secondary: 'bg-brand-400/10 dark:bg-brand-400/10 text-brand-500 dark:text-brand-400 border border-brand-400/30 dark:border-brand-400/30 hover:bg-brand-400/20 dark:hover:bg-brand-400/20',
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
