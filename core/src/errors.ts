export const SendSoonErrorCode = {
  INVALID_INPUT: 'INVALID_INPUT',
  INVALID_RECIPIENT: 'INVALID_RECIPIENT',
  AUTH_ERROR: 'AUTH_ERROR',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER_ERROR: 'SERVER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

export type SendSoonErrorCode =
  (typeof SendSoonErrorCode)[keyof typeof SendSoonErrorCode];

export interface SendSoonError {
  code: SendSoonErrorCode;
  message: string;
  retryable: boolean;
}

const ERROR_MESSAGES: Record<SendSoonErrorCode, string> = {
  [SendSoonErrorCode.INVALID_INPUT]:
    'Invalid input. Check required fields (to, subject, body) and try again.',
  [SendSoonErrorCode.INVALID_RECIPIENT]:
    'Recipient email address is invalid. Provide a valid address such as name@example.com.',
  [SendSoonErrorCode.AUTH_ERROR]:
    'Authentication failed. Set SENDSOON_API_KEY in your environment and try again.',
  [SendSoonErrorCode.PAYLOAD_TOO_LARGE]:
    'Email body is too large. Reduce the content size and try again.',
  [SendSoonErrorCode.RATE_LIMITED]:
    'SendSoon API rate limit reached. Wait a moment and try again.',
  [SendSoonErrorCode.SERVER_ERROR]:
    'SendSoon service is temporarily unavailable. Try again later.',
  [SendSoonErrorCode.NETWORK_ERROR]:
    'Network error while contacting SendSoon API. Check connectivity and try again.',
};

const RETRYABLE_CODES = new Set<SendSoonErrorCode>([
  SendSoonErrorCode.RATE_LIMITED,
  SendSoonErrorCode.SERVER_ERROR,
  SendSoonErrorCode.NETWORK_ERROR,
]);

export function createError(
  code: SendSoonErrorCode,
  message?: string,
): SendSoonError {
  return {
    code,
    message: message ?? ERROR_MESSAGES[code],
    retryable: RETRYABLE_CODES.has(code),
  };
}

export function mapValidationError(
  code: SendSoonErrorCode,
  message?: string,
): SendSoonError {
  return createError(code, message);
}

function sanitizeApiMessage(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed) {
    return undefined;
  }

  const lower = trimmed.toLowerCase();
  if (
    lower.includes('stack') ||
    lower.includes('traceback') ||
    trimmed.includes(' at ') ||
    trimmed.includes('sql')
  ) {
    return undefined;
  }

  if (trimmed.length > 240) {
    return `${trimmed.slice(0, 237)}...`;
  }

  return trimmed;
}

function parseApiErrorMessage(body: string): string | undefined {
  try {
    const parsed = JSON.parse(body) as {
      message?: string;
      error?: string | { message?: string };
    };

    if (typeof parsed.message === 'string') {
      return sanitizeApiMessage(parsed.message);
    }

    if (typeof parsed.error === 'string') {
      return sanitizeApiMessage(parsed.error);
    }

    if (
      parsed.error &&
      typeof parsed.error === 'object' &&
      typeof parsed.error.message === 'string'
    ) {
      return sanitizeApiMessage(parsed.error.message);
    }
  } catch {
    return sanitizeApiMessage(body);
  }

  return undefined;
}

export function mapHttpError(status: number, body: string): SendSoonError {
  const apiMessage = parseApiErrorMessage(body);

  if (status === 400) {
    return createError(SendSoonErrorCode.INVALID_INPUT, apiMessage);
  }
  if (status === 401 || status === 403) {
    return createError(SendSoonErrorCode.AUTH_ERROR, apiMessage);
  }
  if (status === 413) {
    return createError(SendSoonErrorCode.PAYLOAD_TOO_LARGE, apiMessage);
  }
  if (status === 429) {
    return createError(SendSoonErrorCode.RATE_LIMITED, apiMessage);
  }
  if (status >= 500) {
    return createError(SendSoonErrorCode.SERVER_ERROR, apiMessage);
  }

  return createError(
    SendSoonErrorCode.INVALID_INPUT,
    apiMessage ?? ERROR_MESSAGES[SendSoonErrorCode.INVALID_INPUT],
  );
}

export function mapNetworkError(): SendSoonError {
  return createError(SendSoonErrorCode.NETWORK_ERROR);
}
