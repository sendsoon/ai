# Quickstart: send_email 验证指南

**Feature**: `specs/001-send-email`  
**Purpose**: 实现完成后端到端验证本 feature 是否满足 spec 与 Constitution

## Prerequisites

- Node.js ≥ 20
- 有效 `SENDSOON_API_KEY`（staging 或 production）
- 本仓库已实现 `/implement` 产出（`mcp/`、`core/`、`skills/email-basics/`）

## 1. 环境配置

```bash
export SENDSOON_API_KEY="YOUR_API_KEY"
export SENDSOON_API_BASE_URL="https://api.sendsoonai.com"   # 可选，staging 可覆盖
```

勿将真实 Key 写入仓库或提交到 git。

## 2. 安装与构建

```bash
cd mcp
npm install
npm run build
```

## 3. 单元测试（mock，无真实 API 调用）

```bash
npm test -- --filter core
```

**Expected**:
- 邮箱校验失败 → `INVALID_RECIPIENT`
- mock 429 → 重试后 `RATE_LIMITED`
- mock 5xx → `SERVER_ERROR`, `retryable: true`
- mock 200 → `success: true`, 非空 `message_id`

## 4. MCP Inspector 本地调试

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

在 Inspector 中选择 `send_email` tool，提交：

```json
{
  "to": "your-test-inbox@example.com",
  "subject": "SendSoon Connect P0 Test",
  "body": "Hello from send_email quickstart.",
  "content_type": "text/plain"
}
```

**Expected**: `structuredContent.success === true`，含 `message_id`。

## 5. HTML 发送验证

```json
{
  "to": "your-test-inbox@example.com",
  "subject": "HTML Test",
  "body": "<p>Hello <strong>World</strong></p>",
  "content_type": "text/html",
  "from_alias": "SendSoon Outreach"
}
```

**Expected**: 收件箱收到 HTML 格式邮件；`from_alias` 已转发（展示取决于私有 API）。

## 6. 错误场景验证

| Scenario | Input | Expected `error.code` | `retryable` |
|----------|-------|----------------------|-------------|
| 无效邮箱 | `"to": "not-an-email"` | `INVALID_RECIPIENT` | false |
| 空主题 | `"subject": ""` | `INVALID_INPUT` | false |
| 无 API Key | unset `SENDSOON_API_KEY` | `AUTH_ERROR` | false |

确认 `error.message` 不含 `stack`、`at `、SQL 或内部路径。

## 7. SKILL 文档验证

1. 打开 `skills/email-basics/SKILL.md`
2. 确认 frontmatter 含 `name`、`description`
3. 确认触发词包含「发邮件」「send email」
4. 确认 `examples/` 下至少 2 个示例，无真实凭证

**Expected**: 仅阅读 SKILL 即可在 Inspector 完成一次测试发送。

## 8. sendsoon_website 联调（M2 验收）

1. website 配置 MCP server 连接（stdio 子进程或 Streamable HTTP）
2. 运营后台触发单封发送 UI
3. 确认返回 `message_id` 与 UI 成功态一致

详见 spec **SC-005**。

## 9. Constitution 快速核对

- [ ] `core/` 含超时/重试，非 tool 内裸 fetch
- [ ] 无 Postal/SMTP/验证算法代码
- [ ] `skills/email-basics/SKILL.md` 与 tool 同 PR
- [ ] 失败响应无堆栈泄露

## References

- [spec.md](./spec.md)
- [data-model.md](./data-model.md)
- [contracts/send_email-tool.schema.json](./contracts/send_email-tool.schema.json)
- [plan.md](./plan.md)
