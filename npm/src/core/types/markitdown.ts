import type { SendSoonError } from '../errors.js';

export interface MarkitdownConvertRequest {
  filename: string;
  content_base64: string;
}

export const MAX_MARKITDOWN_FILE_BYTES = 10 * 1024 * 1024;

export interface MarkitdownConvertResultSuccess {
  success: true;
  filename: string;
  markdown: string;
}

export interface MarkitdownConvertResultFailure {
  success: false;
  error: SendSoonError;
}

export type MarkitdownConvertResult =
  | MarkitdownConvertResultSuccess
  | MarkitdownConvertResultFailure;

export function markitdownSuccessResult(
  filename: string,
  markdown: string,
): MarkitdownConvertResultSuccess {
  return { success: true, filename, markdown };
}

export function markitdownFailureResult(
  error: SendSoonError,
): MarkitdownConvertResultFailure {
  return { success: false, error };
}
