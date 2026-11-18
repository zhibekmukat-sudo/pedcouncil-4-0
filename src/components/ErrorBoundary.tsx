import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'Непредвиденная ошибка приложения',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      let friendlyMsg = this.state.errorMessage;
      try {
        const parsed = JSON.parse(this.state.errorMessage);
        if (parsed && parsed.error) {
          friendlyMsg = `${parsed.error} (${parsed.operationType} → ${parsed.path ?? ''})`;
        }
      } catch {
        // plain string message
      }

      return (
        <div className="min-h-screen bg-[#f4f7fb] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-slate-200 rounded-2xl p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-[#0b1f3a] mb-2">
              Ошибка подключения к серверу / Серверге қосылу қатесі
            </h1>
            <p className="text-sm text-slate-600 mb-6 break-words">{friendlyMsg}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0b1f3a] text-white text-sm font-semibold hover:bg-[#14335c] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Обновить страницу / Бетті жаңарту</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
