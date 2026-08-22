import type { SendSoonError } from '../errors.js';

export interface SendResultSuccess {
  success: true;
  /** Present when the upstream provider returns a delivery identifier. */
  message_id?: string;
  /** Remaining free test sends reported by the public SendSoon endpoint. */
  remaining?: number;
}

export interface SendResultFailure {
  success: false;
  error: SendSoonError;
}

export type SendResult = SendResultSuccess | SendResultFailure;

export function successResult(
  messageId?: string,
  remaining?: number,
): SendResultSuccess {
  return {
    success: true,
    ...(messageId ? { message_id: messageId } : {}),
    ...(remaining !== undefined ? { remaining } : {}),
  };
}

export function failureResult(error: SendSoonError): SendResultFailure {
  return { success: false, error };
}
