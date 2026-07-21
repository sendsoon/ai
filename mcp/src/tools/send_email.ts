import {
  MAX_FROM_ALIAS_LENGTH,
  MAX_SUBJECT_LENGTH,
  failureResult,
  validateSendRequest,
  type SendResult,
  type SendSoonClient,
} from '@sendsoon/core';
import * as z from 'zod/v4';

const sendEmailInputSchema = {
  to: z.string().trim().describe('Recipient email address'),
  subject: z.string().max(MAX_SUBJECT_LENGTH).describe('Email subject line'),
  body: z.string().describe('Email body (plain text or HTML; max 512,000 UTF-8 bytes)'),
  content_type: z
    .enum(['text/plain', 'text/html'])
    .optional()
    .describe('MIME content type for body (default: text/plain)'),
  from_alias: z
    .string()
    .max(MAX_FROM_ALIAS_LENGTH)
    .optional()
    .describe('Optional display name shown to recipients'),
  idempotency_key: z
    .string()
    .max(128)
    .regex(/^[A-Za-z0-9._:-]+$/)
    .optional()
    .describe('Optional stable key that prevents duplicate delivery when callers retry'),
};

const sendEmailOutputSchema = {
  success: z.boolean(),
  message_id: z.string().optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      retryable: z.boolean(),
    })
    .optional(),
};

export type SendEmailInput = {
  to: string;
  subject: string;
  body: string;
  content_type?: 'text/plain' | 'text/html';
  from_alias?: string;
  idempotency_key?: string;
};

export type SendEmailOutput = SendResult;

function validateSendEmailInput(input: SendEmailInput): SendResult | null {
  const error = validateSendRequest(input);
  return error ? failureResult(error) : null;
}

function formatToolResult(result: SendResult) {
  const structuredContent = JSON.parse(JSON.stringify(result)) as Record<
    string,
    unknown
  >;
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    structuredContent,
    isError: !result.success,
  };
}

export const sendEmailToolDefinition = {
  name: 'send_email' as const,
  config: {
    title: '发送邮件',
    description:
      'Send a single email via SendSoon API. Use for outreach, follow-ups, or test sends. Set content_type to text/html for HTML body. Optionally set from_alias for a custom sender display name.',
    inputSchema: sendEmailInputSchema,
    outputSchema: sendEmailOutputSchema,
  },
  createHandler(client: SendSoonClient) {
    return async (input: SendEmailInput) => {
      const validationError = validateSendEmailInput(input);
      if (validationError) {
        return formatToolResult(validationError);
      }

      const result = await client.sendEmail({
        to: input.to.trim(),
        subject: input.subject,
        body: input.body,
        content_type: input.content_type ?? 'text/plain',
        from_alias: input.from_alias,
        idempotency_key: input.idempotency_key,
      });

      return formatToolResult(result);
    };
  },
};
