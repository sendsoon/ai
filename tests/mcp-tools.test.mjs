import assert from 'node:assert/strict';
import test from 'node:test';
import { ipLookupToolDefinition } from '../mcp/dist/tools/ip_lookup.js';
import { markitdownConvertToolDefinition } from '../mcp/dist/tools/markitdown_convert.js';
import { sendEmailToolDefinition } from '../mcp/dist/tools/send_email.js';

const unusedClient = new Proxy({}, {
  get() {
    throw new Error('Client should not be called for invalid input');
  },
});

test('MCP validation failures are marked as tool errors', async () => {
  const email = await sendEmailToolDefinition.createHandler(unusedClient)({
    to: 'invalid', subject: 'Hello', body: 'World',
  });
  const ip = await ipLookupToolDefinition.createHandler(unusedClient)({ ip: '127.0.0.1' });
  const file = await markitdownConvertToolDefinition.createHandler(unusedClient)({
    filename: 'report.pdf', content_base64: 'not-base64!',
  });

  assert.equal(email.isError, true);
  assert.equal(ip.isError, true);
  assert.equal(file.isError, true);
});
