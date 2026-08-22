# Research: send_email MCP Tool

**Feature**: `specs/001-send-email`  
**Date**: 2026-07-06

## 1. MCP TypeScript SDK 版本

**Decision**: 使用 `@modelcontextprotocol/sdk` ^1.29.0（v1 稳定线）

**Rationale**:
- 项目规则（`.cursor/rules/30-typescript-mcp.mdc`）明确锁定 v1.x
- v2 beta 包结构拆分（`@modelcontextprotocol/server` 等），API 不稳定，不符合 Constitution IV 向后兼容原则
- v1 提供 `McpServer.registerTool` + Zod schema 集成，满足本 feature 需求

**Alternatives considered**:
- v2 beta：功能更新但规范未定稿，拒绝
- 低层 `Server` API：更灵活但样板代码多，P0 不需要

---

## 2. 参数校验库

**Decision**: Zod v4（`import * as z from 'zod/v4'`）

**Rationale**:
- MCP SDK v1 原生支持 Zod inputSchema/outputSchema
- `.email()` 内置 RFC 级邮箱校验，满足 FR-003
- outputSchema 强制 structuredContent 形状，便于 Agent 解析

**Alternatives considered**:
- JSON Schema 手写：与 SDK 集成度低
- Valibot：团队无既有约定，且 rules 已指定 Zod

---

## 3. HTTP Client 策略

**Decision**: native `fetch` + `AbortController`，封装于 `core/http.ts`

**Rationale**:
- Node 20+ 内置 fetch，无额外依赖
- Constitution II 要求超时/重试集中定义
- 10–30s 超时与 3 次指数退避符合 `.cursor/rules/30-typescript-mcp.mdc`

**Alternatives considered**:
- `axios`：多依赖，retry 需插件
- `undici`：Node fetch 已足够

**Retry 细节**:
- POST `/v1/emails/send` 为写操作；假设 API **非幂等**，仅对 429、5xx、网络错误重试
- 若私有 API 后续提供 `Idempotency-Key` header，可在 003-batch-outreach 引入，本 feature 不实现

---

## 4. 认证方式

**Decision**: `Authorization: Bearer ${SENDSOON_API_KEY}`

**Rationale**:
- 行业常见 Bearer 模式；环境变量名与 spec 一致
- 不在代码/日志中 echo key

**Alternatives considered**:
- `X-API-Key` header：若私有 API 最终要求此格式，仅改 `core/config.ts` 映射，tool schema 不变

**Open item**: 联调时确认私有 API 实际 header 名称；当前按 Bearer 实现。

---

## 5. MCP Transport

**Decision**: 双模式，默认 stdio；预留 Streamable HTTP

**Rationale**:
- Cursor / Claude Desktop 本地集成 → stdio
- `sendsoon_website` 远程联调 → Streamable HTTP（`.cursor/rules/30-typescript-mcp.mdc`）
- SSE 不用于新代码

**Implementation note**: `mcp/src/index.ts` 通过 `TRANSPORT=stdio|http` 环境变量切换；P0 implement 阶段至少交付 stdio。

---

## 6. message_id 缺失处理

**Decision**: 优先级 `response.message_id` → `response.id` → 字面量 `"pending"`

**Rationale**:
- 满足 FR-004「非空 message_id」
- `"pending"` 表示 API 已接受但未返回 ID，便于追踪；同时 `console.warn` 一次（不含 PII）

**Alternatives considered**:
- 失败当 API 无 ID：对运营体验差，拒绝

---

## 7. 错误响应形态

**Decision**: Tool 始终返回 HTTP 200 的 MCP result；用 `success: false` + `error` 对象表示失败

**Rationale**:
- Agent 友好：structuredContent 始终可解析
- 避免 MCP layer throw 导致堆栈泄露
- 与 spec 输出 schema 一致

**Alternatives considered**:
- `throw new McpError`：部分 client 展示不友好，且难保证无 stack 泄露

---

## 8. 测试策略

**Decision**: Vitest + mock `global.fetch` in `core/client.test.ts`

**Rationale**:
- 隔离外部 API；符合 guardrails
- 覆盖错误映射表与重试逻辑

**Alternatives considered**:
- `msw`：更强大但 P0 单 endpoint 手写 mock 足够

---

## 9. 私有 API 契约（假设）

**Decision**: 采用 [sendsoon-api-v1-emails-send.json](./contracts/sendsoon-api-v1-emails-send.json) 作为 implement 前假设；联调差异只改 `core/client.ts` 映射

**Rationale**:
- spec Assumptions 已说明 API 可能并行交付
- adapter 层应容忍字段名微调

**Request body (assumed)**:
```json
{
  "to": "user@example.com",
  "subject": "Hello",
  "body": "Plain text",
  "content_type": "text/plain",
  "from_alias": "SendSoon Outreach"
}
```

**Success response (assumed)**:
```json
{
  "message_id": "msg_abc123",
  "status": "queued"
}
```
