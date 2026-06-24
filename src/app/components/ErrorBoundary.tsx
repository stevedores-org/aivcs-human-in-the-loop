import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in AIVCS human-in-the-loop UI:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-[#0d1117] text-[#c9d1d9] p-6">
          <div className="max-w-md w-full bg-[#161b22] border border-[#30363d] rounded-lg p-6 shadow-2xl flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 text-red-500">
              <AlertTriangle size={24} />
            </div>
            
            <h1 className="text-lg font-bold text-[#e6edf3] mb-2">Something went wrong</h1>
            
            <p className="text-sm text-[#8b949e] mb-4">
              An unexpected error occurred in the AIVCS supervisor interface.
            </p>

            <div className="w-full text-left bg-black/40 border border-[#30363d] rounded p-3 mb-6 overflow-x-auto max-h-40">
              <code className="text-xs text-red-400 font-mono block whitespace-pre">
                {this.state.error?.stack || this.state.error?.message || "Unknown Error"}
              </code>
            </div>

            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/95 transition-all text-sm font-semibold"
            >
              <RefreshCw size={14} />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
