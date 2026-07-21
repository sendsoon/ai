import assert from 'node:assert/strict';
import test from 'node:test';
import { SendSoonClient, SendSoonErrorCode } from '../core/dist/index.js';

function response(status, body) {
  return { status, body, ok: status >= 200 && status < 300, headers: new Headers() };
}

test('sendEmail supplies an idempotency key and accepts a valid response', async () => {
  let requestOptions;
  const client = new SendSoonClient({
    apiKey: 'test-key',
    request: async (options) => {
      requestOptions = options;
      return response(200, '{"message_id":"msg_123"}');
    },
  });

  const result = await client.sendEmail({
    to: 'person@example.com',
    subject: 'Hello',
    body: 'World',
    idempotency_key: 'campaign-42',
  });

  assert.deepEqual(result, { success: true, message_id: 'msg_123' });
  assert.equal(requestOptions.headers['Idempotency-Key'], 'campaign-42');
});

test('valid JSON with a missing message ID is an invalid API response', async () => {
  const client = new SendSoonClient({
    apiKey: 'test-key',
    request: async () => response(200, '{}'),
  });
  const result = await client.sendEmail({
    to: 'person@example.com',
    subject: 'Hello',
    body: 'World',
  });

  assert.equal(result.success, false);
  assert.equal(result.error.code, SendSoonErrorCode.INVALID_RESPONSE);
});

test('AbortError is preserved as a timeout', async () => {
  const client = new SendSoonClient({
    apiKey: 'test-key',
    request: async () => {
      throw new DOMException('aborted', 'AbortError');
    },
  });
  const result = await client.ipLookup({ ip: '8.8.8.8' });
  assert.equal(result.success, false);
  assert.equal(result.error.code, SendSoonErrorCode.TIMEOUT);
});
