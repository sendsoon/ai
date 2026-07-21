import assert from 'node:assert/strict';
import test from 'node:test';
import { httpRequest } from '../core/dist/index.js';

test('POST requests are not retried by default', async () => {
  let calls = 0;
  const response = await httpRequest({
    method: 'POST',
    url: 'https://example.test/send',
    fetchImpl: async () => {
      calls += 1;
      return new Response('busy', { status: 503 });
    },
    sleepImpl: async () => {},
  });

  assert.equal(calls, 1);
  assert.equal(response.status, 503);
});

test('GET retries retryable statuses and honors Retry-After', async () => {
  let calls = 0;
  const delays = [];
  const response = await httpRequest({
    method: 'GET',
    url: 'https://example.test/lookup',
    maxRetries: 1,
    retryMaxDelayMs: 1_000,
    fetchImpl: async () => {
      calls += 1;
      return calls === 1
        ? new Response('limited', { status: 429, headers: { 'Retry-After': '0.01' } })
        : new Response('ok');
    },
    sleepImpl: async (delay) => delays.push(delay),
  });

  assert.equal(calls, 2);
  assert.deepEqual(delays, [10]);
  assert.equal(response.body, 'ok');
});

test('timeout remains active while reading the response body', async () => {
  const fetchImpl = async (_url, init) => ({
    status: 200,
    ok: true,
    headers: new Headers(),
    text: () => new Promise((_resolve, reject) => {
      init.signal.addEventListener('abort', () => {
        reject(new DOMException('The operation was aborted', 'AbortError'));
      });
    }),
  });

  await assert.rejects(
    httpRequest({
      method: 'POST',
      url: 'https://example.test/slow-body',
      timeoutMs: 10,
      fetchImpl,
    }),
    (error) => error?.name === 'AbortError',
  );
});
