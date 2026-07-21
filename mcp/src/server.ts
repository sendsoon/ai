import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SendSoonClient } from '@sendsoon/core';
import { createRequire } from 'node:module';
import { ipLookupToolDefinition } from './tools/ip_lookup.js';
import { markitdownConvertToolDefinition } from './tools/markitdown_convert.js';
import { sendEmailToolDefinition } from './tools/send_email.js';

export function createServer(client = new SendSoonClient()): McpServer {
  const packageJson = createRequire(import.meta.url)('../package.json') as {
    version: string;
  };
  const server = new McpServer({
    name: 'sendsoon-connect',
    version: packageJson.version,
  });

  server.registerTool(
    sendEmailToolDefinition.name,
    sendEmailToolDefinition.config,
    sendEmailToolDefinition.createHandler(client),
  );

  server.registerTool(
    ipLookupToolDefinition.name,
    ipLookupToolDefinition.config,
    ipLookupToolDefinition.createHandler(client),
  );

  server.registerTool(
    markitdownConvertToolDefinition.name,
    markitdownConvertToolDefinition.config,
    markitdownConvertToolDefinition.createHandler(client),
  );

  return server;
}
