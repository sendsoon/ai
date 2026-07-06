import {
  MAX_BODY_LENGTH,
  MAX_FROM_ALIAS_LENGTH,
  MAX_SUBJECT_LENGTH,
  SendSoonErrorCode,
  SendSoonClient,
  createError,
  failureResult,
  type SendResult,
} from '@sendsoon/core';
import * as z from 'zod/v4';

const emailSchema = z.string().email();

const sendEmailInputSchema = {
  to: z.string().describe('Recipient email address'),
  subject: z.string().describe('Email subject line'),
  body: z.string().describe('Email body (plain text or HTML)'),
  content_type: z
    .enum(['text/plain', 'text/html'])
    .optional()
    .describe('MIME content type for body (default: text/plain)'),
  from_alias: z
    .string()
    .max(MAX_FROM_ALIAS_LENGTH)
    .optional()
    .describe('Optional display name shown to recipients'),
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
};

export type SendEmailOutput = SendResult;

function validateSendEmailInput(input: SendEmailInput): SendResult | null {
  if (!emailSchema.safeParse(input.to).success) {
    return failureResult(createError(SendSoonErrorCode.INVALID_RECIPIENT));
  }

  if (!input.subject.trim()) {
    return failureResult(
      createError(
        SendSoonErrorCode.INVALID_INPUT,
        'Subject is required and cannot be empty.',
      ),
    );
  }

  if (input.subject.length > MAX_SUBJECT_LENGTH) {
    return failureResult(
      createError(
        SendSoonErrorCode.INVALID_INPUT,
        `Subject must be at most ${MAX_SUBJECT_LENGTH} characters.`,
      ),
    );
  }

  if (!input.body.trim()) {
    return failureResult(
      createError(
        SendSoonErrorCode.INVALID_INPUT,
        'Body is required and cannot be empty.',
      ),
    );
  }

  if (input.body.length > MAX_BODY_LENGTH) {
    return failureResult(createError(SendSoonErrorCode.PAYLOAD_TOO_LARGE));
  }

  return null;
}

function formatToolResult(result: SendResult) {
  const structuredContent = JSON.parse(JSON.stringify(result)) as Record<
    string,
    unknown
  >;
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    structuredContent,
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
      });

      return formatToolResult(result);
    };
  },
};
