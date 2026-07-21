export interface HttpRequestOptions {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: string;
  /** Timeout for the complete response, including reading the body. */
  timeoutMs?: number;
  /** Number of retries after the initial attempt. */
  maxRetries?: number;
  retryBaseDelayMs?: number;
  retryMaxDelayMs?: number;
  fetchImpl?: typeof fetch;
  sleepImpl?: (ms: number) => Promise<void>;
  random?: () => number;
}

export interface HttpResponse {
  status: number;
  body: string;
  ok: boolean;
  headers: Headers;
}

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_BASE_DELAY_MS = 500;
const DEFAULT_RETRY_MAX_DELAY_MS = 4_000;
const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);
const IDEMPOTENT_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE']);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return true;
  }

  const name = error.name;
  return (
    name === 'AbortError' ||
    name === 'TypeError' ||
    error.message.toLowerCase().includes('fetch')
  );
}

function retryAfterDelayMs(headers: Headers, now = Date.now()): number | null {
  const value = headers.get('retry-after')?.trim();
  if (!value) {
    return null;
  }

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1_000;
  }

  const date = Date.parse(value);
  return Number.isNaN(date) ? null : Math.max(0, date - now);
}

function exponentialDelayMs(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  random: () => number,
): number {
  const capped = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
  return Math.floor(capped * (0.5 + random() * 0.5));
}

export async function httpRequest(
  options: HttpRequestOptions,
): Promise<HttpResponse> {
  const method = options.method.toUpperCase();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries =
    options.maxRetries ??
    (IDEMPOTENT_METHODS.has(method) ? DEFAULT_MAX_RETRIES : 0);
  const retryBaseDelayMs =
    options.retryBaseDelayMs ?? DEFAULT_RETRY_BASE_DELAY_MS;
  const retryMaxDelayMs = options.retryMaxDelayMs ?? DEFAULT_RETRY_MAX_DELAY_MS;
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleepImpl = options.sleepImpl ?? sleep;
  const random = options.random ?? Math.random;

  let lastNetworkError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(options.url, {
        method,
        headers: options.headers,
        body: options.body,
        signal: controller.signal,
      });

      const body = await response.text();
      clearTimeout(timeoutId);

      if (RETRYABLE_STATUSES.has(response.status) && attempt < maxRetries) {
        const delay =
          retryAfterDelayMs(response.headers) ??
          exponentialDelayMs(
            attempt,
            retryBaseDelayMs,
            retryMaxDelayMs,
            random,
          );
        await sleepImpl(Math.min(retryMaxDelayMs, delay));
        continue;
      }

      return {
        status: response.status,
        body,
        ok: response.ok,
        headers: response.headers,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (!isRetryableNetworkError(error)) {
        throw error;
      }

      lastNetworkError =
        error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        const delay = exponentialDelayMs(
          attempt,
          retryBaseDelayMs,
          retryMaxDelayMs,
          random,
        );
        await sleepImpl(delay);
        continue;
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastNetworkError ?? new Error('Network request failed');
}
