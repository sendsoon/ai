export interface HttpRequestOptions {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: string;
  readTimeoutMs?: number;
  maxRetries?: number;
  retryBaseDelayMs?: number;
  retryMaxDelayMs?: number;
}

export interface HttpResponse {
  status: number;
  body: string;
  ok: boolean;
}

const DEFAULT_READ_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_BASE_DELAY_MS = 500;
const DEFAULT_RETRY_MAX_DELAY_MS = 4_000;
const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);

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

export async function httpRequest(
  options: HttpRequestOptions,
): Promise<HttpResponse> {
  const readTimeoutMs = options.readTimeoutMs ?? DEFAULT_READ_TIMEOUT_MS;
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const retryBaseDelayMs =
    options.retryBaseDelayMs ?? DEFAULT_RETRY_BASE_DELAY_MS;
  const retryMaxDelayMs = options.retryMaxDelayMs ?? DEFAULT_RETRY_MAX_DELAY_MS;

  let lastNetworkError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), readTimeoutMs);

    try {
      const response = await fetch(options.url, {
        method: options.method,
        headers: options.headers,
        body: options.body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const body = await response.text();

      if (RETRYABLE_STATUSES.has(response.status) && attempt < maxRetries) {
        const delay = Math.min(
          retryMaxDelayMs,
          retryBaseDelayMs * 2 ** attempt,
        );
        await sleep(delay);
        continue;
      }

      return {
        status: response.status,
        body,
        ok: response.ok,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (!isRetryableNetworkError(error)) {
        throw error;
      }

      lastNetworkError =
        error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        const delay = Math.min(
          retryMaxDelayMs,
          retryBaseDelayMs * 2 ** attempt,
        );
        await sleep(delay);
        continue;
      }
    }
  }

  throw lastNetworkError ?? new Error('Network request failed');
}
