import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { TranslationProvider } from './locales';
import { AlertCircle, RotateCcw, ChevronDown, ChevronUp, Terminal } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

class GlobalStudioErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Dragon Studio Error Boundary caught:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white dark:bg-[#070A12] text-[#F8FAFC] font-khmer flex items-center justify-center p-6 select-none">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0B111C] border border-slate-200 dark:border-[#203244] shadow-[0_20px_60px_rgba(0,0,0,0.8)] p-8 text-center flex flex-col items-center">
            {/* Dragon Error Icon */}
            <div className="w-16 h-16 rounded-2xl bg-[#EF4444]/15 border border-[#EF4444]/40 flex items-center justify-center mb-5 text-[#EF4444] shadow-[0_0_24px_rgba(239,68,68,0.3)]">
              <AlertCircle className="w-8 h-8" />
            </div>

            <h1 className="text-xl font-black text-white font-cinzel tracking-wider mb-2">
              DRAGON DABBER PRO
            </h1>
            <h2 className="text-sm font-bold text-[#EF4444] mb-2">
              មានបញ្ហាបច្ចេកទេសក្នុងការបង្ហាញផ្ទាំងស្ទូឌីយោ
            </h2>

            <p className="text-xs text-[#94A3B8] leading-relaxed mb-6">
              ស្ទូឌីយោបានការពារទិន្នន័យរបស់អ្នកដោយជោគជ័យ។ សូមចុច &quot;ដំណើរការស្ទូឌីយោឡើងវិញ&quot; ដើម្បីបន្តការងារ ឬពិនិត្យព័ត៌មានបច្ចេកទេស។
            </p>

            <div className="flex items-center gap-3 w-full justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#16D9FF] to-[#2563EB] text-[#070A12] font-black text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(22,217,255,0.3)] hover:brightness-110 active:scale-95 transition"
              >
                <RotateCcw className="w-4 h-4" />
                <span>ដំណើរការស្ទូឌីយោឡើងវិញ</span>
              </button>

              <button
                type="button"
                onClick={this.toggleDetails}
                className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#101925] border border-slate-200 dark:border-[#203244] text-xs font-bold text-[#94A3B8] hover:text-white hover:border-slate-200 dark:border-[#16D9FF]/40 transition flex items-center gap-1.5"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>បច្ចេកទេស</span>
                {this.state.showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {this.state.showDetails && (
              <div className="mt-5 w-full text-left p-3.5 rounded-xl bg-white dark:bg-[#070A12] border border-slate-200 dark:border-[#203244] text-[11px] font-mono text-[#EF4444] overflow-x-auto max-h-48 custom-scrollbar">
                <div className="font-bold mb-1">{this.state.error?.toString()}</div>
                <pre className="text-[#64748B] whitespace-pre-wrap">{this.state.errorInfo?.componentStack}</pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Global window unhandled error safeguard
window.addEventListener('error', (e) => {
  console.error('Dragon Studio global error:', e);
});

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found in document');
}

ReactDOM.createRoot(rootElement).render(
  <GlobalStudioErrorBoundary>
    <TranslationProvider>
      <App />
    </TranslationProvider>
  </GlobalStudioErrorBoundary>
);
