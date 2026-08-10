import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

export async function startMcpClient({ cwd, env = process.env } = {}) {
  const child = spawn(process.execPath, ['mcp/dist/index.js'], {
    cwd,
    env,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const pending = new Map();
  let nextId = 1;
  let stderr = '';

  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk) => {
    stderr += chunk;
  });

  const lines = createInterface({ input: child.stdout });
  lines.on('line', (line) => {
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      return;
    }
    if (message.id === undefined) return;
    const waiter = pending.get(message.id);
    if (!waiter) return;
    pending.delete(message.id);
    clearTimeout(waiter.timeout);
    if (message.error) waiter.reject(new Error(JSON.stringify(message.error)));
    else waiter.resolve(message.result);
  });

  child.on('exit', (code) => {
    for (const waiter of pending.values()) {
      clearTimeout(waiter.timeout);
      waiter.reject(new Error(`MCP server exited with code ${code}: ${stderr}`));
    }
    pending.clear();
  });

  function write(message) {
    child.stdin.write(`${JSON.stringify(message)}\n`);
  }

  function request(method, params = {}) {
    const id = nextId++;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`MCP request timed out: ${method}; stderr=${stderr}`));
      }, 60_000);
      pending.set(id, { resolve, reject, timeout });
      write({ jsonrpc: '2.0', id, method, params });
    });
  }

  const initialized = await request('initialize', {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'sendsoon-smoke-test', version: '1.0.0' },
  });
  write({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} });

  return {
    initialized,
    request,
    async close() {
      child.stdin.end();
      lines.close();
      if (!child.killed) child.kill();
    },
  };
}
