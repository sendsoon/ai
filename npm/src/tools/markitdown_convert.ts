import {
  loadMarkitdownFileFromPath,
  markitdownFailureResult,
  type MarkitdownConvertResult,
  type SendSoonClient,
} from '../core/index.js';
import * as z from 'zod/v4';
import { formatToolResult } from './format.js';

const markitdownConvertInputSchema = {
  file_path: z
    .string()
    .trim()
    .min(1)
    .describe('Local path to the file to convert. The file name is detected automatically.'),
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
  file_path: string;
};

export type MarkitdownConvertOutput = MarkitdownConvertResult;

export const markitdownConvertToolDefinition = {
  name: 'markitdown_convert' as const,
  config: {
    title: 'File to Markdown',
    description:
      'Convert a local document to Markdown via SendSoon. Supported: pdf, docx, pptx, xlsx, xls, txt, md, html, htm. Images (png, jpg, etc.) and direct URLs are not supported. Provide file_path; the file name is detected automatically (max 10 MB).',
    inputSchema: markitdownConvertInputSchema,
    outputSchema: markitdownConvertOutputSchema,
  },
  createHandler(client: SendSoonClient) {
    return async (input: MarkitdownConvertInput) => {
      const loaded = await loadMarkitdownFileFromPath(input.file_path);
      if ('error' in loaded) {
        return formatToolResult(markitdownFailureResult(loaded.error));
      }

      const result = await client.markitdownConvert(loaded.request);
      return formatToolResult(result);
    };
  },
};
