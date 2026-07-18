---
name: markitdown
description: Convert a file (PDF, Office docs, images, audio, etc.) to Markdown text through the markitdown_convert MCP tool. Use when the user wants to 转Markdown, extract text from a document, convert a PDF/Word/Excel/PPT to markdown, or turn a file into plain text/markdown for further processing.
---

# File to Markdown — markitdown_convert

Convert a file to Markdown text through the `markitdown_convert` MCP tool. This skill covers single-file, in-memory conversion only (no batch, no persistent storage).

## When to use

- User says **转 Markdown**, **文件转文本**, **extract text from this PDF/Word/Excel**, or hands over a document and wants readable/searchable text out of it
- Preparing document content for summarization, RAG ingestion, or further LLM processing

## Prerequisites

- MCP server `sendsoon-connect` running with `markitdown_convert` registered
- Environment variable `SENDSOON_API_KEY` set (never commit real keys)
- The file's raw bytes, base64-encoded, available to pass as `content_base64` — decoded size must not exceed 10 MB

## Tool: `markitdown_convert`

### Parameters

| Parameter | Required | Description |
|-----------|----------|--------------|
| `filename` | Yes | File name including extension, e.g. `report.pdf`. The extension determines how the file is parsed. |
| `content_base64` | Yes | Base64-encoded raw file bytes. Decoded size must be ≤ 10 MB. |

### Supported extensions

`.pdf .pptx .docx .xlsx .xls .jpg .jpeg .png .gif .bmp .tiff .mp3 .wav .m4a .html .htm .csv .json .xml .zip .epub .txt .md`

Legacy binary `.doc` (pre-2007 Word) is **not** supported — ask the user to re-save as `.docx`.

### Example

```json
{
  "filename": "quarterly-report.pdf",
  "content_base64": "JVBERi0xLjQKJ..."
}
```

## Success response

```json
{
  "success": true,
  "filename": "quarterly-report.pdf",
  "markdown": "# Quarterly Report\n\n..."
}
```

## Error handling

Always inspect `success`. On failure, use `error.code` and `error.retryable`:

| `error.code` | Action |
|--------------|--------|
| `INVALID_INPUT` | `filename` unsupported extension, empty input, invalid base64, or empty conversion result (corrupted/unsupported file content) |
| `PAYLOAD_TOO_LARGE` | Decoded file exceeds 10 MB — shrink or split the file before converting |
| `AUTH_ERROR` | Verify `SENDSOON_API_KEY` is configured or hasn't been revoked |
| `RATE_LIMITED` | Wait and retry if `retryable` is true |
| `SERVER_ERROR` / `NETWORK_ERROR` | Retry later if `retryable` is true |

Do not retry automatically when `retryable` is false.

## Out of scope

- Batch/multi-file conversion → call the tool once per file
- Writing the converted markdown to disk → the tool returns text only, saving it is the caller's responsibility
