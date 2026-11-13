import { useCallback, useEffect, useState } from 'react';

import { resolveRuntimeApiBaseUrl, sessionTokenManager } from '../composition/sessionRuntime';
import { IamAccountStore } from './account-store';
import {
  createIamAccountService,
  type IamAccountSnapshot,
  type IamLoginOutcome,
  type IamPasswordLoginInput,
} from './iam-account';

type IamSelectionRequired = Extract<IamLoginOutcome, { status: 'selection-required' }>;
type IamAccountService = ReturnType<typeof createIamAccountService>;

export interface UseIamAccount {
  readonly snapshot: IamAccountSnapshot;
  readonly loading: boolean;
  readonly configured: boolean;
  readonly selection: IamSelectionRequired | null;
  readonly reload: () => Promise<void>;
  readonly login: (input: IamPasswordLoginInput) => Promise<IamLoginOutcome>;
  readonly selectOrganization: (organizationId: string) => Promise<IamLoginOutcome>;
  readonly signOut: () => Promise<void>;
}

const UNAVAILABLE: IamAccountSnapshot = {
  status: 'unavailable',
  reason: 'IAM runtime endpoint is not configured.',
};

const tenantId = (import.meta.env.VITE_SDKWORK_TENANT_ID ?? '').trim();
const organizationId = (import.meta.env.VITE_SDKWORK_ORGANIZATION_ID ?? '').trim();
const store = new IamAccountStore();

/**
 * Create the IAM service from the runtime base resolved after the browser
 * runtime document has been loaded. The service is app-owned composition; no
 * raw HTTP client is constructed in UI code.
 */
function createRuntimeService(): IamAccountService | null {
  const baseUrl = resolveRuntimeApiBaseUrl();
  if (baseUrl.length === 0) return null;
  return createIamAccountService({
    baseUrl,
    tokenManager: sessionTokenManager,
    ...(tenantId ? { tenantId } : {}),
    ...(organizationId ? { organizationId } : {}),
  });
}

export function useIamAccount(): UseIamAccount {
  const [service] = useState<IamAccountService | null>(createRuntimeService);
  const [snapshot, setSnapshot] = useState<IamAccountSnapshot>(
    service ? { status: 'anonymous' } : UNAVAILABLE,
  );
  const [loading, setLoading] = useState<boolean>(Boolean(service));
  const [selection, setSelection] = useState<IamSelectionRequired | null>(null);

  const reload = useCallback(async () => {
    if (!service) {
      setSnapshot(UNAVAILABLE);
      setLoading(false);
      return;
    }
    setLoading(true);
    const next = await service.load();
    setSnapshot(next);
    store.publish(next);
    setLoading(false);
  }, [service]);

  useEffect(() => {
    const unsubscribe = store.subscribe(setSnapshot);
    void reload();
    return unsubscribe;
  }, [reload]);

  const login = useCallback(async (input: IamPasswordLoginInput): Promise<IamLoginOutcome> => {
    if (!service) {
      return { status: 'unavailable', reason: 'IAM runtime endpoint is not configured.' };
    }
    setLoading(true);
    const outcome = await service.login(input);
    if (outcome.status === 'selection-required') {
      setSelection(outcome);
    } else {
      setSelection(null);
      setSnapshot(outcome);
      store.publish(outcome);
    }
    setLoading(false);
    return outcome;
  }, [service]);

  const selectOrganization = useCallback(async (organizationId: string): Promise<IamLoginOutcome> => {
    if (!service || !selection) {
      return { status: 'unavailable', reason: 'No IAM organization selection is pending.' };
    }
    setLoading(true);
    const outcome = await service.selectOrganization({
      continuationToken: selection.continuationToken,
      organizationId,
    });
    if (outcome.status !== 'selection-required') {
      setSelection(null);
      setSnapshot(outcome);
      store.publish(outcome);
    }
    setLoading(false);
    return outcome;
  }, [service, selection]);

  const signOut = useCallback(async () => {
    if (!service) return;
    await service.signOut();
    const next: IamAccountSnapshot = { status: 'anonymous' };
    setSelection(null);
    setSnapshot(next);
    store.publish(next);
  }, [service]);

  return {
    snapshot,
    loading,
    configured: Boolean(service),
    selection,
    reload,
    login,
    selectOrganization,
    signOut,
  };
}
