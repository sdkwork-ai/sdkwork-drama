import { appApiPath } from './paths';
import type { ApiRequestOptions, HttpClient } from '../http/client';



export class SystemSystemReadyApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Readiness probe. */
  async retrieve(requestOptions?: ApiRequestOptions): Promise<{ status: 'ready' | 'not_ready'; detail?: string; }> {
    return this.client.request<{ status: 'ready' | 'not_ready'; detail?: string; }>(appApiPath(`/system/ready`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, skipAuth: true, sdkworkUnwrapKind: 'data' });
  }
}

export class SystemSystemHealthApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Liveness probe. */
  async retrieve(requestOptions?: ApiRequestOptions): Promise<{ status: 'ok'; }> {
    return this.client.request<{ status: 'ok'; }>(appApiPath(`/system/health`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, skipAuth: true, sdkworkUnwrapKind: 'data' });
  }
}

export class SystemApi {
  public readonly systemHealth: SystemSystemHealthApi;
  public readonly systemReady: SystemSystemReadyApi;

  constructor(client: HttpClient) {
    this.systemHealth = new SystemSystemHealthApi(client);
    this.systemReady = new SystemSystemReadyApi(client);
  }

}

export function createSystemApi(client: HttpClient): SystemApi {
  return new SystemApi(client);
}
