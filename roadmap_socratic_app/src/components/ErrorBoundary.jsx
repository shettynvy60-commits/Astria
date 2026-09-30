import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#04070F] text-slate-100 flex items-center justify-center p-6">
          <div className="glass-panel-elevated p-8 rounded-3xl max-w-lg w-full border border-rose-500/40 text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-950/80 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Something went wrong</h2>
              <p className="text-xs text-slate-400 mt-1">
                The application encountered an unexpected runtime error.
              </p>
            </div>
            {this.state.error && (
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-rose-300 text-left max-h-48 overflow-y-auto whitespace-pre-wrap">
                {this.state.error.toString()}
              </pre>
            )}
            <button
              type="button"
              onClick={this.handleReload}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-lg glow-brand flex items-center gap-2 mx-auto transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
