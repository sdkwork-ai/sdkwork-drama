import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import { AppErrorBoundary } from './appbase/AppErrorBoundary';
import { describeRuntime, loadAppRuntimeEnvironment } from './appbase/runtime';
import './index.css';

function resolveContainer(): HTMLElement {
  const element = document.getElementById('root');
  if (element === null) {
    throw new Error('Application root element #root is missing.');
  }
  return element;
}

async function bootstrap(): Promise<void> {
  const container = resolveContainer();
  // Resolve and publish the browser runtime document before the first SDK call.
  const runtime = await loadAppRuntimeEnvironment();
  if (import.meta.env.DEV) {
    console.info(`[sdkwork] ${describeRuntime(runtime)}`);
  }

  createRoot(container).render(
    <StrictMode>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </StrictMode>,
  );
}

void bootstrap();
