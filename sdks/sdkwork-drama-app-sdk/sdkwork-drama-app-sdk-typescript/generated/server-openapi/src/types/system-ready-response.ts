export interface SystemReadyResponse {
  code: 0;
  data: { status: 'ready' | 'not_ready'; detail?: string; };
  traceId: string;
}
