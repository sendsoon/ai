# Implementation Plan: send_email MCP Tool

**Branch**: `001-send-email` | **Date**: 2026-07-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-send-email/spec.md`

## Summary

实现 P0 基础能力 `send_email` MCP tool：TypeScript + `@modelcontextprotocol/sdk` v1.x，Zod v4 校验输入/输出，`core/` 层统一 HTTP client（超时 + 指数退避重试），`core/errors.ts` 错误码映射，配对 `skills/email-basics/SKILL.md`。Connect 层仅做参数校验、请求转发与响应转换，所有发送逻辑委托 `POST https://api.sendsoonai.com/v1/emails/send`。

## Technical Context

**Language/Version**: TypeScript 5.x（strict mode），Node.js ≥ 20（native `fetch`）

**Primary Dependencies**:
- `@modelcontextprotocol/sdk` ^1.29.0（McpServer + registerTool）
- `zod` v4（`import * as z from 'zod/v4'`，inputSchema / outputSchema）
- 无额外 HTTP 库（native `fetch` + `AbortController`）

**Storage**: N/A（无状态 adapter，不持久化邮件）

**Testing**: Vitest + fetch mock（或 `msw`）；不对 `api.sendsoonai.com` 发真实请求

**Target Platform**:
- 本地：stdio transport（Cursor / Claude Desktop 集成）
- 远程：`StreamableHTTPServerTransport`（`sendsoon_website` 联调，后续 M6）

**Project Type**: MCP server adapter monorepo（`mcp/` + `core/` + `skills/`）

**Performance Goals**: 单次 tool 调用 p95 响应 &lt; 10s（含 API 往返，见 SC-003）

**Constraints**:
- 请求 read 超时 30s，connect 超时 10s（`core/` 集中配置）
- 429/5xx/网络错误最多 3 次重试，指数退避（初始 500ms，上限 4s）
- 4xx（除 429）与本地校验错误不重试
- 禁止透传后端堆栈；禁止硬编码 API Key

**Scale/Scope**: 单 feature 1 个 MCP tool + 1 个 SKILL + `core/` 基础 client 骨架（供 002/003 复用）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Reference: `.specify/memory/constitution.md` (SendSoon Connect v1.0.0)

| Principle | Gate Question | Result |
|-----------|---------------|--------|
| I. Protocol Adaptation Only | Does this feature stay in the adapter layer? | ✅ PASS — 仅 tool 注册 + API 转发 |
| II. Resilient Network Calls | Are new/changed HTTP calls resilient? | ✅ PASS — `core/http.ts` 统一超时/重试 |
| III. Tool-Skill Pairing | Are tools and skills paired? | ✅ PASS — `skills/email-basics/SKILL.md` |
| IV. Backward-Compatible Evolution | Is compatibility preserved? | ✅ PASS — 首版 tool，schema 只增不改 |

**Post-design re-check**: Phase 1 contracts 与 data-model 未引入核心逻辑或破坏性 schema 变更。全部 PASS。

## Project Structure

### Documentation (this feature)

```text
specs/001-send-email/
├── spec.md
├── plan.md              # 本文件
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   ├── send_email-tool.schema.json
│   └── sendsoon-api-v1-emails-send.json
├── checklists/
│   └── requirements.md
└── tasks.md             # /tasks 命令产出（本 plan 不创建）
```

### Source Code (repository root)

```text
sendsoon-connect/
├── mcp/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                 # 入口：stdio / HTTP transport 切换
│       ├── server.ts                # McpServer 实例化 + tool 注册
│       └── tools/
│           └── send_email.ts        # send_email handler（薄层）
├── core/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── client.ts                # SendSoonClient.sendEmail()
│       ├── http.ts                  # fetch 封装：超时、重试、AbortController
│       ├── errors.ts                # 错误码枚举 + mapHttpError()
│       ├── config.ts                # 环境变量读取（SENDSOON_API_KEY, base URL）
│       └── types/
│           ├── send-request.ts
│           └── send-result.ts
├── skills/
│   └── email-basics/
│       ├── SKILL.md
│       └── examples/
│           ├── plain-text-send.md
│           └── html-send.md
└── tests/
    └── core/
        ├── client.test.ts
        └── errors.test.ts
```

**Structure Decision**: 遵循 `.cursor/rules/10-architecture.mdc` 三层分离。`mcp/` 仅 protocol 适配；`core/` 为 TS 首发共享 client（Python 后续对齐）；`skills/` 纯 Markdown。本 feature 建立 `core/` 骨架，供 002/003 扩展 `parseCase()`、`batchSend()` 等方法。

## Phase 0: Research Summary

详见 [research.md](./research.md)。关键决策：

| Topic | Decision |
|-------|----------|
| MCP SDK | `@modelcontextprotocol/sdk` ^1.29（v1 稳定线，不用 v2 beta） |
| Schema | Zod v4，`registerTool` inputSchema/outputSchema |
| HTTP | native fetch + AbortController；retry 在 `core/http.ts` |
| Auth | `Authorization: Bearer ${SENDSOON_API_KEY}` |
| Transport | stdio 默认；Streamable HTTP 为 website 联调预留 |
| message_id 缺失 | 使用 API 响应 `id` / `message_id` 字段；皆无则 `"pending"` + server-side warn log |

## Phase 1: Design Artifacts

| Artifact | Path | Purpose |
|----------|------|---------|
| Data model | [data-model.md](./data-model.md) | SendRequest / SendResult / SendSoonError |
| MCP contract | [contracts/send_email-tool.schema.json](./contracts/send_email-tool.schema.json) | Tool I/O JSON Schema |
| API contract | [contracts/sendsoon-api-v1-emails-send.json](./contracts/sendsoon-api-v1-emails-send.json) | 私有 API 请求/响应（假设契约，联调时可调整映射） |
| Validation guide | [quickstart.md](./quickstart.md) | 本地验证步骤 |

## Implementation Approach

### Layer responsibilities

```
Agent / sendsoon_website
        ↓ MCP call
mcp/tools/send_email.ts     ← Zod 校验、调用 core、包装 structuredContent
        ↓
core/client.sendEmail()     ← 业务无关 HTTP 调用
        ↓
core/http.request()         ← 超时、重试、auth header
        ↓
api.sendsoonai.com/v1/emails/send
```

### `send_email` tool handler 流程

1. Zod 解析输入（含 `.email()` 校验 `to`）
2. 空 `subject`/`body` → 本地 `INVALID_INPUT`（不请求 API）
3. 调用 `SendSoonClient.sendEmail(payload)`
4. 成功 → `{ success: true, message_id }` 作为 `structuredContent`
5. 失败 → `{ success: false, error: { code, message, retryable } }`（HTTP 200 tool result，不用 throw 堆栈）

### Error mapping (`core/errors.ts`)

| Source | `error.code` | `retryable` |
|--------|--------------|-------------|
| Zod / 本地邮箱无效 | `INVALID_RECIPIENT` 或 `INVALID_INPUT` | false |
| HTTP 400 | `INVALID_INPUT` | false |
| HTTP 401/403 | `AUTH_ERROR` | false |
| HTTP 413 / body too large | `PAYLOAD_TOO_LARGE` | false |
| HTTP 429 | `RATE_LIMITED` | true |
| HTTP 5xx | `SERVER_ERROR` | true |
| 网络超时 / fetch failed | `NETWORK_ERROR` | true |

### Retry policy (`core/http.ts`)

```typescript
const DEFAULT_CONFIG = {
  connectTimeoutMs: 10_000,
  readTimeoutMs: 30_000,
  maxRetries: 3,
  retryBaseDelayMs: 500,
  retryMaxDelayMs: 4_000,
  retryableStatuses: [429, 502, 503, 504],
};
```

- 写操作（POST send）：仅对 429 和网络/5xx 重试；**不对** 400/401/403 重试
- 退避：`delay = min(retryMaxDelayMs, retryBaseDelayMs * 2^attempt)`

### Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SENDSOON_API_KEY` | Yes（调用时） | — | Bearer token |
| `SENDSOON_API_BASE_URL` | No | `https://api.sendsoonai.com` | 测试/staging 覆盖 |

缺失 `SENDSOON_API_KEY` 时 tool 返回 `AUTH_ERROR`，server 进程仍可启动（便于 Inspector 调试 tool 列表）。

## Complexity Tracking

> 无 Constitution 违规，本表留空。

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| 私有 API 字段名与假设契约不一致 | `contracts/` 标注 assumed；plan 仅映射层调整，不改 tool schema |
| Python 双实现滞后 | spec 标注 TS 首发；tasks 中单列 Python follow-up |
| HTML 误发为 plain | SKILL 与 tool description 强调 `content_type: text/html` |

## Next Step

运行 `/tasks` 生成 `specs/001-send-email/tasks.md`，再 `/implement` 按任务逐项实现。
