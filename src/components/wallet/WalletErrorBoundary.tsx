'use client';

import React from 'react';

interface WalletErrorBoundaryProps {
  title: string;
  children: React.ReactNode;
}

interface WalletErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class WalletErrorBoundary extends React.Component<
  WalletErrorBoundaryProps,
  WalletErrorBoundaryState
> {
  constructor(props: WalletErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error: Error): WalletErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unknown component error',
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[WalletErrorBoundary] ${this.props.title}`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          <p className="font-semibold">{this.props.title} indisponible</p>
          <p className="mt-1 text-red-100/90">{this.state.errorMessage}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
