import { Component, type ErrorInfo, type ReactNode } from 'react';

interface AppErrorBoundaryProps {
  readonly children: ReactNode;
}

interface AppErrorBoundaryState {
  readonly error: Error | null;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[sdkwork] uncaught shell error', error, errorInfo.componentStack);
  }

  override render(): ReactNode {
    const { error } = this.state;
    if (error === null) return this.props.children;

    return (
      <main className="scaffold-fatal" role="alert">
        <p className="scaffold-eyebrow">Application runtime</p>
        <h1>Something interrupted this surface.</h1>
        <p>
          The shell caught an unrecoverable render error. The failure is contained here so the
          application can recover without losing the rest of the workspace.
        </p>
        <pre>{error.message}</pre>
        <button type="button" className="scaffold-button" data-tone="primary" onClick={() => window.location.reload()}>
          Reload application
        </button>
      </main>
    );
  }
}
