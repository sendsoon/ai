import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SendSoonErrorCode,
  decodedBase64ByteLength,
  validateBaseUrl,
  validateMarkitdownRequest,
  validatePublicIp,
  validateSendRequest,
} from '../core/dist/index.js';

test('public IP validation rejects non-public ranges', () => {
  for (const ip of ['127.0.0.1', '10.1.2.3', '192.0.2.1', '::1', 'fc00::1', '2001:db8::1']) {
    assert.equal(validatePublicIp(ip)?.code, SendSoonErrorCode.INVALID_INPUT, ip);
  }
  assert.equal(validatePublicIp('8.8.8.8'), null);
  assert.equal(validatePublicIp('2606:4700:4700::1111'), null);
});

test('MarkItDown validation checks extension, Base64, empty files, and decoded size', () => {
  assert.equal(validateMarkitdownRequest({ filename: 'a.exe', content_base64: 'YQ==' })?.code, SendSoonErrorCode.INVALID_INPUT);
  assert.equal(validateMarkitdownRequest({ filename: 'a.pdf', content_base64: 'not base64!' })?.code, SendSoonErrorCode.INVALID_INPUT);
  assert.equal(validateMarkitdownRequest({ filename: 'a.pdf', content_base64: '' })?.code, SendSoonErrorCode.INVALID_INPUT);
  assert.equal(validateMarkitdownRequest({ filename: 'a.PDF', content_base64: 'YQ==' }), null);
  assert.equal(validateMarkitdownRequest({ filename: '../a.pdf', content_base64: 'YQ==' })?.code, SendSoonErrorCode.INVALID_INPUT);
  assert.equal(decodedBase64ByteLength('YQ=='), 1);
});

test('email body limit is measured in UTF-8 bytes', () => {
  const result = validateSendRequest({
    to: 'person@example.com',
    subject: 'hello',
    body: '界'.repeat(200_000),
  });
  assert.equal(result?.code, SendSoonErrorCode.PAYLOAD_TOO_LARGE);
});

test('email validation rejects malformed local and domain parts', () => {
  assert.equal(validateSendRequest({ to: 'a..b@example.com', subject: 'hello', body: 'world' })?.code, SendSoonErrorCode.INVALID_RECIPIENT);
  assert.equal(validateSendRequest({ to: 'a@example_domain.com', subject: 'hello', body: 'world' })?.code, SendSoonErrorCode.INVALID_RECIPIENT);
});

test('base URL requires HTTPS except on localhost', () => {
  assert.equal(validateBaseUrl('https://api.example.com'), null);
  assert.equal(validateBaseUrl('http://localhost:3000'), null);
  assert.equal(validateBaseUrl('http://api.example.com')?.code, SendSoonErrorCode.INVALID_CONFIG);
  assert.equal(validateBaseUrl('https://key@example.com')?.code, SendSoonErrorCode.INVALID_CONFIG);
});
