import {
  MAX_MARKITDOWN_FILE_BYTES,
  SendSoonClient,
  SendSoonErrorCode,
  createError,
  markitdownFailureResult,
  type MarkitdownConvertResult,
} from '@sendsoon/core';
import * as z from 'zod/v4';

const markitdownConvertInputSchema = {
  filename: z
    .string()
    .describe('File name including extension, e.g. report.pdf'),
  content_base64: z
    .string()
    .describe('Base64-encoded file content (max 10 MB decoded)'),
};

const markitdownConvertOutputSchema = {
  success: z.boolean(),
  filename: z.string().optional(),
  markdown: z.string().optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      retryable: z.boolean(),
    })
    .optional(),
};

export type MarkitdownConvertInput = {
  filename: string;
  content_base64: string;
};

export type MarkitdownConvertOutput = MarkitdownConvertResult;

function estimateDecodedByteLength(base64: string): number {
  const trimmed = base64.trim();
  const padding = trimmed.endsWith('==') ? 2 : trimmed.endsWith('=') ? 1 : 0;
  return Math.floor((trimmed.length * 3) / 4) - padding;
}

function validateMarkitdownConvertInput(
  input: MarkitdownConvertInput,
): MarkitdownConvertResult | null {
  if (!input.filename.trim()) {
    return markitdownFailureResult(
      createError(
        SendSoonErrorCode.INVALID_INPUT,
        'filename is required and cannot be empty.',
      ),
    );
  }

  if (!input.content_base64.trim()) {
    return markitdownFailureResult(
      createError(
        SendSoonErrorCode.INVALID_INPUT,
        'content_base64 is required and cannot be empty.',
      ),
    );
  }

  if (estimateDecodedByteLength(input.content_base64) > MAX_MARKITDOWN_FILE_BYTES) {
    return markitdownFailureResult(createError(SendSoonErrorCode.PAYLOAD_TOO_LARGE));
  }

  return null;
}

function formatToolResult(result: MarkitdownConvertResult) {
  const structuredContent = JSON.parse(JSON.stringify(result)) as Record<
    string,
    unknown
  >;
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    structuredContent,
  };
}

export const markitdownConvertToolDefinition = {
  name: 'markitdown_convert' as const,
  config: {
    title: '文件转 Markdown',
    description:
      'Convert a file (pdf, docx, pptx, xlsx, images, audio, csv, json, html, zip, epub, txt, etc.) to Markdown text via SendSoon API. Provide the raw file bytes as base64 (max 10 MB decoded).',
    inputSchema: markitdownConvertInputSchema,
    outputSchema: markitdownConvertOutputSchema,
  },
  createHandler(client: SendSoonClient) {
    return async (input: MarkitdownConvertInput) => {
      const validationError = validateMarkitdownConvertInput(input);
      if (validationError) {
        return formatToolResult(validationError);
      }

      const result = await client.markitdownConvert({
        filename: input.filename.trim(),
        content_base64: input.content_base64,
      });

      return formatToolResult(result);
    };
  },
};
