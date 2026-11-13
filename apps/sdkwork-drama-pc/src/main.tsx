import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import { AppErrorBoundary } from './appbase/AppErrorBoundary';
import { describeRuntime, loadAppRuntimeEnvironment } from './appbase/runtime';
import { createAppRuntime } from './composition/runtimeServices';
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
  const runtimeEnv = await loadAppRuntimeEnvironment();
  const runtime = createAppRuntime();
  if (import.meta.env.DEV) {
    console.info(`[sdkwork] ${describeRuntime(runtimeEnv)}`);
  }

  createRoot(container).render(
    <StrictMode>
      <AppErrorBoundary>
        <App runtime={runtime} />
      </AppErrorBoundary>
    </StrictMode>,
  );
}

void bootstrap();
