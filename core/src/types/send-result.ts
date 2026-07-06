import type { SendSoonError } from '../errors.js';

export interface SendResultSuccess {
  success: true;
  message_id: string;
}

export interface SendResultFailure {
  success: false;
  error: SendSoonError;
}

export type SendResult = SendResultSuccess | SendResultFailure;

export function successResult(messageId: string): SendResultSuccess {
  return { success: true, message_id: messageId };
}

export function failureResult(error: SendSoonError): SendResultFailure {
  return { success: false, error };
}
