import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

/** Top-level error boundary — catches render errors in any component. */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  override componentDidCatch(error: Error, info: { componentStack?: string }) {
    // eslint-disable-next-line no-console
    console.error("[EpicDB] render error:", error, info);
  }

  reset = () => this.setState({ hasError: false, message: "" });

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="text-3xl">😵</div>
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="max-w-md text-sm text-[var(--color-text-muted)] mono">
            {this.state.message}
          </p>
          <button onClick={this.reset} className="btn-primary">
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
