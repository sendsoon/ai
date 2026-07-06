export type ContentType = 'text/plain' | 'text/html';

export interface SendRequest {
  to: string;
  subject: string;
  body: string;
  content_type?: ContentType;
  from_alias?: string;
}

export const MAX_BODY_LENGTH = 512_000;
export const MAX_SUBJECT_LENGTH = 998;
export const MAX_FROM_ALIAS_LENGTH = 128;
