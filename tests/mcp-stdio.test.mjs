import assert from 'node:assert/strict';
import test from 'node:test';
import { startMcpClient } from './helpers/mcp-stdio-client.mjs';

test('stdio MCP server initializes and exposes all public tools', async (t) => {
  const client = await startMcpClient({ cwd: process.cwd() });
  t.after(() => client.close());

  assert.equal(client.initialized.serverInfo.name, 'sendsoon-connect');
  const result = await client.request('tools/list');
  assert.deepEqual(
    result.tools.map((tool) => tool.name).sort(),
    ['ip_lookup', 'markitdown_convert', 'send_email'],
  );
});
