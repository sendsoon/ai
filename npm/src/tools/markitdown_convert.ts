import {
  validateMarkitdownRequest,
  markitdownFailureResult,
  type MarkitdownConvertResult,
  type SendSoonClient,
} from '../core/index.js';
import * as z from 'zod/v4';
import { formatToolResult } from './format.js';

const markitdownConvertInputSchema = {
  filename: z
    .string().trim().min(1)
    .describe('File name including extension, e.g. report.pdf'),
  content_base64: z
    .string().trim().min(1)
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
      const request = {
        filename: input.filename.trim(),
        content_base64: input.content_base64.trim(),
      };
      const validationError = validateMarkitdownRequest(request);
      if (validationError) {
        return formatToolResult(markitdownFailureResult(validationError));
      }

      const result = await client.markitdownConvert(request);
      return formatToolResult(result);
    };
  },
};
