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
    emailRecipient: 'person@example.com',
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
  assert.equal(requestOptions.headers.Authorization, 'Bearer test-key');
  assert.equal(requestOptions.url, 'https://www.sendsoonai.com/api/send-test-email');
  assert.deepEqual(JSON.parse(requestOptions.body), {
    to: 'person@example.com',
    subject: 'Hello',
    htmlContent: '<pre style="white-space:pre-wrap;font-family:inherit">World</pre>',
  });
});

test('sendEmail accepts the public endpoint response without a message ID', async () => {
  let requestOptions;
  const client = new SendSoonClient({
    emailRecipient: 'person@example.com',
    request: async (options) => {
      requestOptions = options;
      return response(200, '{"success":true,"remaining":2}');
    },
  });

  const result = await client.sendEmail({
    to: 'person@example.com',
    subject: 'Hello',
    body: '<strong>World</strong>',
    content_type: 'text/html',
  });

  assert.deepEqual(result, { success: true, remaining: 2 });
  assert.equal(requestOptions.headers.Authorization, undefined);
  assert.equal(JSON.parse(requestOptions.body).htmlContent, '<strong>World</strong>');
});

test('sendEmail requires a configured matching recipient allowlist', async () => {
  const missing = new SendSoonClient({
    request: async () => assert.fail('request must not be called'),
  });
  const mismatch = new SendSoonClient({
    emailRecipient: 'allowed@example.com',
    request: async () => assert.fail('request must not be called'),
  });

  const missingResult = await missing.sendEmail({
    to: 'person@example.com', subject: 'Hello', body: 'World',
  });
  const mismatchResult = await mismatch.sendEmail({
    to: 'person@example.com', subject: 'Hello', body: 'World',
  });

  assert.equal(missingResult.error.code, SendSoonErrorCode.INVALID_CONFIG);
  assert.equal(mismatchResult.error.code, SendSoonErrorCode.INVALID_RECIPIENT);
});

test('ipLookup sends an optional API key to the public endpoint', async () => {
  let requestOptions;
  const client = new SendSoonClient({
    apiKey: 'test-key',
    request: async (options) => {
      requestOptions = options;
      return response(200, JSON.stringify({
        success: true,
        ip: '8.8.8.8',
        ip2region: {
          country: 'United States', countryCode: 'US', region: 'California',
          city: '', postalCode: '', timezone: '', latitude: null, longitude: null,
        },
        network: { isp: 'Google LLC', asn: '', organization: 'Google LLC' },
        source: 'local',
      }));
    },
  });

  const result = await client.ipLookup({ ip: '8.8.8.8' });
  assert.equal(result.success, true);
  assert.equal(requestOptions.url, 'https://www.sendsoonai.com/api/ip/lookup?ip=8.8.8.8');
  assert.equal(requestOptions.headers.Authorization, 'Bearer test-key');
});

test('markitdownConvert uploads multipart data and accepts a Markdown attachment', async () => {
  let requestOptions;
  const client = new SendSoonClient({
    apiKey: 'test-key',
    request: async (options) => {
      requestOptions = options;
      return {
        ...response(200, '# Converted'),
        headers: new Headers({
          'Content-Type': 'text/markdown',
          'Content-Disposition': "attachment; filename*=UTF-8''sample.md",
        }),
      };
    },
  });

  const result = await client.markitdownConvert({
    filename: 'sample.txt',
    content_base64: Buffer.from('hello').toString('base64'),
  });

  assert.deepEqual(result, {
    success: true,
    filename: 'sample.md',
    markdown: '# Converted',
  });
  assert.equal(requestOptions.url, 'https://www.sendsoonai.com/api/markitdown/convert');
  assert.equal(requestOptions.headers.Authorization, 'Bearer test-key');
  assert.ok(requestOptions.body instanceof FormData);
  assert.equal(requestOptions.headers['Content-Type'], undefined);
  assert.equal(await requestOptions.body.get('file').text(), 'hello');
});

test('valid JSON with a missing message ID is an invalid API response', async () => {
  const client = new SendSoonClient({
    apiKey: 'test-key',
    emailRecipient: 'person@example.com',
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
