import React, { Component, ErrorInfo, ReactNode } from 'react';

const CACHE_BUST_KEY = 'pwa-cache-busted';
const RECOVERY_COUNT_KEY = 'pwa-recovery-count';
const MAX_RECOVERY_ATTEMPTS = 1;
const RECOVERY_COOLDOWN_MS = 10_000; // 10 seconds

async function nukeServiceWorkerAndCaches() {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
      }
    }
    const keys = await caches.keys();
    for (const key of keys) {
      await caches.delete(key);
    }
  } catch (_) {
    // Best-effort cleanup
  }
}

function shouldAttemptRecovery(): boolean {
  // Check max attempts first
  const countRaw = sessionStorage.getItem(RECOVERY_COUNT_KEY);
  const attempts = countRaw ? Number(countRaw) : 0;
  if (attempts >= MAX_RECOVERY_ATTEMPTS) return false;

  const raw = sessionStorage.getItem(CACHE_BUST_KEY);
  if (!raw) return true;
  const lastAttempt = Number(raw);
  if (isNaN(lastAttempt)) return false;
  return Date.now() - lastAttempt > RECOVERY_COOLDOWN_MS;
}

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  attemptingRecovery: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  _clearTimer: number | undefined;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, attemptingRecovery: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // WebSocket errors are non-fatal — the app works fine without realtime
    const msg = error?.message || '';
    // WebSocket errors are non-fatal
    if (msg.includes('WebSocket') || msg.includes('insecure')) {
      return { hasError: false, error: null, attemptingRecovery: false };
    }
    // Chunk/metadata errors: show manual reload, no auto-recovery loop
    if (msg.includes('Failed to fetch dynamically imported module')
        || msg.includes('Loading chunk')
        || msg.includes('metadata')) {
      return { hasError: true, error, attemptingRecovery: false };
    }
    const canRecover = shouldAttemptRecovery();
    return { hasError: true, error, attemptingRecovery: canRecover };
  }

  componentDidMount() {
    // Clear recovery flags only after children have had time to render/crash
    this._clearTimer = window.setTimeout(() => {
      sessionStorage.removeItem(CACHE_BUST_KEY);
      sessionStorage.removeItem(RECOVERY_COUNT_KEY);
    }, 5000);
  }

  componentWillUnmount() {
    if (this._clearTimer) clearTimeout(this._clearTimer);
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) console.error('ErrorBoundary caught:', error, errorInfo);

    // WebSocket errors are non-fatal — skip recovery entirely
    const msg = error?.message || '';
    if (msg.includes('WebSocket') || msg.includes('insecure')) {
      this.setState({ hasError: false, error: null, attemptingRecovery: false });
      return;
    }

    if (shouldAttemptRecovery()) {
      const countRaw = sessionStorage.getItem(RECOVERY_COUNT_KEY);
      const attempts = countRaw ? Number(countRaw) : 0;
      sessionStorage.setItem(RECOVERY_COUNT_KEY, String(attempts + 1));
      sessionStorage.setItem(CACHE_BUST_KEY, String(Date.now()));
      nukeServiceWorkerAndCaches().then(() => {
        window.location.reload();
      });
    }
  }

  handleReload = async () => {
    sessionStorage.removeItem(CACHE_BUST_KEY);
    sessionStorage.removeItem(RECOVERY_COUNT_KEY);
    await nukeServiceWorkerAndCaches();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.state.attemptingRecovery) {
        return (
          <div className="flex items-center justify-center min-h-screen bg-background p-6">
            <div className="text-center space-y-4 max-w-md">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Updating app…</p>
            </div>
          </div>
        );
      }

      return (
        <div className="flex items-center justify-center min-h-screen bg-background p-6">
          <div className="text-center space-y-4 max-w-md">
            <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
            <p className="text-muted-foreground">
              The page failed to load. This can happen after an update.
            </p>
            {this.state.error && (
              <details className="text-left text-xs text-muted-foreground bg-muted p-3 rounded-lg">
                <summary className="cursor-pointer font-medium">Error details</summary>
                <pre className="mt-2 whitespace-pre-wrap break-words">{this.state.error.message}</pre>
                <pre className="mt-1 whitespace-pre-wrap break-words opacity-60">{this.state.error.stack?.slice(0, 500)}</pre>
              </details>
            )}
            <button
              onClick={this.handleReload}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
