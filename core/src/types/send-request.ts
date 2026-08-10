export type ContentType = 'text/plain' | 'text/html';

export interface SendRequest {
  to: string;
  subject: string;
  body: string;
  content_type?: ContentType;
  /** Stable key used to prevent duplicate delivery across caller retries. */
  idempotency_key?: string;
}

export const MAX_BODY_LENGTH = 512_000;
export const MAX_SUBJECT_LENGTH = 998;
