import { Component, ErrorInfo, ReactNode } from 'react';
import { clearCorruptedLocalData } from '../utils/storageCleanup';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  handleRepair = (): void => {
    clearCorruptedLocalData();
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl mb-6 inline-block">
            <svg className="w-10 h-10 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="font-extrabold text-lg text-slate-800 dark:text-zinc-100 mb-2">
            {this.props.fallbackTitle || 'حدث خطأ أثناء تحميل الصفحة'}
          </h3>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6 max-w-md">
            {this.props.fallbackMessage || 'قد يكون بسبب بيانات محلية قديمة أو غير متوافقة'}
          </p>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <button
              onClick={this.handleRetry}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              إعادة تحميل الصفحة
            </button>
            <button
              onClick={this.handleRepair}
              className="px-6 py-3 border border-rose-300 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl transition-all cursor-pointer bg-white dark:bg-transparent"
            >
              إصلاح البيانات المحلية
            </button>
          </div>
          {this.state.error && (
            <details className="mt-6 max-w-md w-full text-left">
              <summary className="text-[10px] text-slate-400 dark:text-zinc-600 cursor-pointer font-mono">
                تفاصيل الخطأ
              </summary>
              <pre className="mt-2 text-[10px] text-rose-500 bg-slate-100 dark:bg-zinc-950 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-auto max-h-32 font-mono">
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
