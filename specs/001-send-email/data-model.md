# Data Model: send_email

**Feature**: `specs/001-send-email`  
**Date**: 2026-07-06

Connect 层无持久化；以下为内存中流转的类型定义（TypeScript 实现位于 `core/src/types/`）。

## Entity Relationship

```text
SendRequest ──► SendSoonClient.sendEmail() ──► SendResult
                     │
                     ▼ (on failure)
                 SendSoonError
```

## SendRequest

一次单封邮件发送的输入，对应 MCP tool input 与 API request body。

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| `to` | string | Yes | RFC 5322 email（Zod `.email()`） | 无效 → `INVALID_RECIPIENT`，不调用 API |
| `subject` | string | Yes | `min(1)`, `max(998)` | 空 → `INVALID_INPUT` |
| `body` | string | Yes | `min(1)`, `max(512_000)` | 空 → `INVALID_INPUT`；超长 → `PAYLOAD_TOO_LARGE` |
| `content_type` | enum | No | `text/plain` \| `text/html` | 默认 `text/plain` |
| `from_alias` | string | No | `max(128)` | 省略时不发送该字段 |

### State transitions

无状态；请求一次性提交，无 draft/queued 状态在 Connect 层维护。

---

## SendResult

MCP tool 与 `SendSoonClient.sendEmail()` 的统一返回类型。

| Field | Type | When | Description |
|-------|------|------|-------------|
| `success` | boolean | Always | 发送是否成功 |
| `message_id` | string | `success === true` | 追踪 ID，非空 |
| `error` | SendSoonError | `success === false` | 结构化错误 |

### Success example

```json
{
  "success": true,
  "message_id": "msg_abc123"
}
```

### Failure example

```json
{
  "success": false,
  "error": {
    "code": "INVALID_RECIPIENT",
    "message": "Recipient email address is invalid. Provide a valid address such as name@example.com.",
    "retryable": false
  }
}
```

---

## SendSoonError

归一化错误结构，由 `core/errors.ts` 的 `mapHttpError()` / `mapValidationError()` 产生。

| Field | Type | Description |
|-------|------|-------------|
| `code` | SendSoonErrorCode | 稳定枚举，供 Agent 分支 |
| `message` | string | 用户友好说明，无堆栈 |
| `retryable` | boolean | 是否建议稍后重试 |

### SendSoonErrorCode (enum)

| Code | retryable | Typical source |
|------|-----------|----------------|
| `INVALID_INPUT` | false | 空 subject/body、Zod 校验 |
| `INVALID_RECIPIENT` | false | 邮箱格式无效 |
| `AUTH_ERROR` | false | 401/403、缺失 API Key |
| `PAYLOAD_TOO_LARGE` | false | 413 或本地 body 超长 |
| `RATE_LIMITED` | true | 429 |
| `SERVER_ERROR` | true | 5xx |
| `NETWORK_ERROR` | true | 超时、DNS、连接重置 |

---

## ApiSendEmailPayload

`core/client.ts` 发往私有 API 的请求体（字段名联调时可调整）。

| Field | Maps from | API field |
|-------|-----------|-----------|
| `to` | SendRequest.to | `to` |
| `subject` | SendRequest.subject | `subject` |
| `body` | SendRequest.body | `body` |
| `content_type` | SendRequest.content_type | `content_type` |
| `from_alias` | SendRequest.from_alias? | `from_alias`（omit if undefined） |

---

## ApiSendEmailResponse

私有 API 成功响应（假设）。

| Field | Type | Maps to |
|-------|------|---------|
| `message_id` | string? | SendResult.message_id |
| `id` | string? | SendResult.message_id（fallback） |
| `status` | string? | 忽略（Connect 不暴露调度状态） |

---

## OutboundEmail (external, not stored)

私有 API 侧实体；Connect 层不建模持久化，仅在文档中引用以便与 spec Key Entities 对齐。

- 生命周期：创建 → 排队 → 发送 → 送达/失败（全部由私有 API 管理）
- Connect 仅获得 `message_id` 作为外部引用
