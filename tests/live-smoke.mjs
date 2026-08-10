import assert from 'node:assert/strict';
import { startMcpClient } from './helpers/mcp-stdio-client.mjs';

const emailTo = process.env.SENDSOON_LIVE_EMAIL_TO?.trim();
const client = await startMcpClient({
  cwd: process.cwd(),
  env: {
    ...process.env,
    ...(emailTo ? { SENDSOON_EMAIL_RECIPIENT: emailTo } : {}),
  },
});

try {
  const tools = await client.request('tools/list');
  assert.deepEqual(
    tools.tools.map((tool) => tool.name).sort(),
    ['ip_lookup', 'markitdown_convert', 'send_email'],
  );

  const ip = await client.request('tools/call', {
    name: 'ip_lookup',
    arguments: { ip: '8.8.8.8' },
  });
  assert.equal(ip.structuredContent.success, true);

  const marker = 'SendSoon MCP synthetic MarkItDown smoke test.';
  const converted = await client.request('tools/call', {
    name: 'markitdown_convert',
    arguments: {
      filename: 'sendsoon-mcp-smoke.txt',
      content_base64: Buffer.from(marker).toString('base64'),
    },
  });
  assert.equal(converted.structuredContent.success, true);
  assert.match(converted.structuredContent.markdown, /SendSoon MCP synthetic/i);

  let email = { skipped: true };
  if (emailTo) {
    email = await client.request('tools/call', {
      name: 'send_email',
      arguments: {
        to: emailTo,
        subject: 'SendSoon MCP 端到端连通性测试 2026-08-10',
        body: '这是一封通过本地 stdio MCP 服务发送的端到端连通性测试邮件。',
        content_type: 'text/plain',
        idempotency_key: 'sendsoon-mcp-live-smoke-2026-08-10',
      },
    });
    assert.equal(email.structuredContent.success, true);
  }

  console.log(JSON.stringify({
    tools: tools.tools.map((tool) => tool.name),
    ip: ip.structuredContent,
    markitdown: converted.structuredContent,
    email: email.structuredContent ?? email,
  }, null, 2));
} finally {
  await client.close();
}
