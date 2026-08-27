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

- MCP server `sendsoon` running with `markitdown_convert` registered
- No API key or registration is required by the current public endpoint
- A local file path readable by the MCP server process; decoded size must not exceed 10 MB

## Tool: `markitdown_convert`

### Parameters

| Parameter | Required | Description |
|-----------|----------|--------------|
| `file_path` | Yes | Local path to the file to convert. The file name is detected automatically from the path. |

### Supported extensions

`.pdf .pptx .docx .xlsx .xls .jpg .jpeg .png .gif .bmp .tiff .mp3 .wav .m4a .html .htm .csv .json .xml .zip .epub .txt .md`

Legacy binary `.doc` (pre-2007 Word) is **not** supported — ask the user to re-save as `.docx`.

### Example

```json
{
  "file_path": "/path/to/quarterly-report.pdf"
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
| `INVALID_INPUT` | Unsupported extension, missing file, empty input, or empty conversion result (corrupted/unsupported file content) |
| `PAYLOAD_TOO_LARGE` | Decoded file exceeds 10 MB — shrink or split the file before converting |
| `AUTH_ERROR` | The configured upstream deployment rejected authentication |
| `RATE_LIMITED` | Wait and retry if `retryable` is true |
| `SERVER_ERROR` / `NETWORK_ERROR` | Retry later if `retryable` is true |
| `TIMEOUT` / `INVALID_RESPONSE` | Retry later if `retryable` is true |
| `INVALID_CONFIG` | Fix `SENDSOON_API_BASE_URL`; use HTTPS except for localhost |

Do not retry automatically when `retryable` is false.

## Out of scope

- Batch/multi-file conversion → call the tool once per file
- Writing the converted markdown to disk → the tool returns text only, saving it is the caller's responsibility
