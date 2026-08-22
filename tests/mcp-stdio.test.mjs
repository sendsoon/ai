import assert from 'node:assert/strict';
import test from 'node:test';
import { startMcpClient } from './helpers/mcp-stdio-client.mjs';

test('stdio MCP server initializes and exposes all public tools', async (t) => {
  const client = await startMcpClient({ cwd: process.cwd() });
  t.after(() => client.close());

  assert.equal(client.initialized.serverInfo.name, 'sendsoon');
  const result = await client.request('tools/list');
  assert.deepEqual(
    result.tools.map((tool) => tool.name).sort(),
    ['ip_lookup', 'markitdown_convert', 'send_email'],
  );
});

// Guards the artifact that npm actually ships: a single bundled file with @sendsoon/core
// inlined, resolving its version from ../package.json one directory up.
test('published bundle starts and exposes the same tools', async (t) => {
  const client = await startMcpClient({
    cwd: process.cwd(),
    entry: 'mcp/bin/sendsoon-mcp.mjs',
  });
  t.after(() => client.close());

  assert.equal(client.initialized.serverInfo.name, 'sendsoon');
  assert.match(client.initialized.serverInfo.version, /^\d+\.\d+\.\d+/);
  const result = await client.request('tools/list');
  assert.deepEqual(
    result.tools.map((tool) => tool.name).sort(),
    ['ip_lookup', 'markitdown_convert', 'send_email'],
  );
});
