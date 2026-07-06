import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SendSoonClient } from '@sendsoon/core';
import { sendEmailToolDefinition } from './tools/send_email.js';

export function createServer(client = new SendSoonClient()): McpServer {
  const server = new McpServer({
    name: 'sendsoon-connect',
    version: '1.0.0',
  });

  const handler = sendEmailToolDefinition.createHandler(client);

  server.registerTool(
    sendEmailToolDefinition.name,
    sendEmailToolDefinition.config,
    handler,
  );

  return server;
}
