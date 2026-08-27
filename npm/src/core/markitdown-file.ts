import { readFile, stat } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { SendSoonErrorCode, createError, type SendSoonError } from './errors.js';
import {
  MAX_MARKITDOWN_FILE_BYTES,
  type MarkitdownConvertRequest,
} from './types/markitdown.js';
import { validateMarkitdownFilename } from './validation.js';

type LoadResult =
  | { request: MarkitdownConvertRequest }
  | { error: SendSoonError };

export async function loadMarkitdownFileFromPath(filePath: string): Promise<LoadResult> {
  const trimmed = filePath.trim();
  if (!trimmed) {
    return {
      error: createError(
        SendSoonErrorCode.INVALID_INPUT,
        'file_path is required and cannot be empty.',
      ),
    };
  }

  let resolved: string;
  try {
    resolved = resolve(trimmed);
  } catch {
    return {
      error: createError(
        SendSoonErrorCode.INVALID_INPUT,
        'file_path must be a valid local file path.',
      ),
    };
  }

  let fileStat: Awaited<ReturnType<typeof stat>>;
  try {
    fileStat = await stat(resolved);
  } catch {
    return {
      error: createError(
        SendSoonErrorCode.INVALID_INPUT,
        'file_path does not exist or is not readable.',
      ),
    };
  }

  if (!fileStat.isFile()) {
    return {
      error: createError(
        SendSoonErrorCode.INVALID_INPUT,
        'file_path must point to a file.',
      ),
    };
  }

  if (fileStat.size === 0) {
    return {
      error: createError(SendSoonErrorCode.INVALID_INPUT, 'The file cannot be empty.'),
    };
  }

  if (fileStat.size > MAX_MARKITDOWN_FILE_BYTES) {
    return { error: createError(SendSoonErrorCode.PAYLOAD_TOO_LARGE) };
  }

  const filename = basename(resolved);
  const filenameError = validateMarkitdownFilename(filename);
  if (filenameError) {
    return { error: filenameError };
  }

  const content = await readFile(resolved);
  return {
    request: {
      filename,
      content_base64: content.toString('base64'),
    },
  };
}
