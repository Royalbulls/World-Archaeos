'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#f5f2ed] p-4">
          <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-rose-100">
            <h2 className="text-2xl font-serif font-bold text-rose-600 mb-4">System Anomaly Detected</h2>
            <p className="text-[#1a1a1a]/70 mb-6 font-sans">
              An unexpected error has occurred in the digital archaeological suite.
            </p>
            <div className="bg-rose-50 p-4 rounded-lg mb-6 overflow-auto max-h-40">
              <code className="text-xs text-rose-700 font-mono">
                {this.state.error?.message || 'Unknown error'}
              </code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-[#1a1a1a] text-white rounded-xl font-medium hover:bg-black transition-colors"
            >
              Reboot System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
