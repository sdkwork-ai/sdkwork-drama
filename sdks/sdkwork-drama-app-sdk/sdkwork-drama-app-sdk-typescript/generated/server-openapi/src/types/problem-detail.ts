/** RFC 9457 problem+json with SDKWork platform extensions. */
export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail?: string | null;
  instance: string;
  /** Numeric SdkWorkResultCode. */
  code: number;
  traceId: string;
  operationId?: string | null;
  i18nKey?: string | null;
}
