# Feature Specification: send_email MCP Tool

**Feature Directory**: `specs/001-send-email`

**Priority**: P0（基础能力）

**Created**: 2026-07-06

**Status**: Draft

**Consumers**: `sendsoon/sendsoon_website` 运营后台、外部 Cursor / Claude Code Agent

**Input**: 实现 MCP tool `send_email`，供单封邮件发送与测试触达；调用私有 API `POST https://api.sendsoonai.com/v1/emails/send`；配对 `skills/email-basics/SKILL.md`。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 运营单次红人触达 (Priority: P1)

作为运营人员，我在 `sendsoon_website` 或通过 Agent 指定收件人、主题、正文，发送一封邮件，以完成单次红人触达或商务跟进。

**Why this priority**: 单封发送是 P0 最小可用能力，也是后续批量触达（P2）的前置依赖；网站联调必须先跑通此路径。

**Independent Test**: 使用有效 API 凭证，调用 `send_email` 传入合法 `to`、`subject`、`body`，应返回 `success: true` 与非空 `message_id`；收件箱可收到邮件（或由 staging 环境 mock 确认）。

**Acceptance Scenarios**:

1. **Given** 已配置有效 SendSoon API 凭证，**When** 运营提交收件人 `influencer@example.com`、主题与纯文本正文，**Then** 返回发送成功及 `message_id`，无后端堆栈信息暴露给调用方。
2. **Given** 已配置有效凭证，**When** 正文为 HTML 且指定 `content_type: text/html`，**Then** 邮件以 HTML 格式送达，返回成功状态。
3. **Given** 已配置有效凭证，**When** 可选参数 `from_alias` 为 `"SendSoon Outreach"`，**Then** 发件人显示名反映该别名（具体展示规则由私有 API 决定，Connect 层正确转发参数即可）。

---

### User Story 2 - Agent 测试发送与错误恢复 (Priority: P2)

作为使用 Cursor Agent 的开发者或运营，我想在测试环境快速发一封验证邮件，并在参数错误或 API 故障时获得可操作的错误提示，以便修正输入或稍后重试。

**Why this priority**: Agent 自动化依赖结构化错误；模糊报错会导致反复无效重试。

**Independent Test**: 分别触发无效邮箱、缺失必填字段、模拟 429/5xx 响应，验证返回的 `error.code` 与 `error.message` 对用户友好且不含原始堆栈。

**Acceptance Scenarios**:

1. **Given** 收件人邮箱格式无效，**When** 调用 `send_email`，**Then** 返回 `success: false`，`error.code` 为参数类错误（如 `INVALID_RECIPIENT`），`error.message` 说明如何修正。
2. **Given** 私有 API 返回 429 限流，**When** Connect 层重试耗尽，**Then** 返回 `success: false`，`error.code` 为 `RATE_LIMITED`，提示稍后重试。
3. **Given** 私有 API 返回 5xx，**When** 请求失败，**Then** 返回 `success: false`，`error.code` 为 `SERVER_ERROR`，不透传后端原始堆栈或内部路径。

---

### User Story 3 - 可选发件人别名 (Priority: P3)

作为运营人员，我希望在单次触达中自定义发件人显示名，使邮件更贴近品牌或活动名称。

**Why this priority**: 提升触达体验，但不阻塞最小发送链路。

**Independent Test**: 省略 `from_alias` 时发送仍成功；提供 `from_alias` 时参数被正确转发。

**Acceptance Scenarios**:

1. **Given** 未提供 `from_alias`，**When** 发送邮件，**Then** 使用账户/API 默认发件人配置，发送成功。
2. **Given** 提供合法 `from_alias` 字符串，**When** 发送邮件，**Then** 请求体包含该字段且发送成功。

---

### Edge Cases

- 收件人为空、非 RFC 5322 邮箱格式、或明显占位符（如 `test@test`）→ 本地校验拒绝，不发起 API 请求。
- `subject` 或 `body` 为空字符串 → 返回参数错误，提示必填。
- `body` 超长（超出 API 限制）→ 返回 `PAYLOAD_TOO_LARGE` 或 API 映射的等价错误码。
- 网络超时或 DNS 失败 → 经有限重试后返回 `NETWORK_ERROR`，Agent 可建议检查网络或稍后重试。
- API Key 缺失或无效（401/403）→ 返回 `AUTH_ERROR`，提示检查环境变量配置，不在响应中 echo 密钥。
- 并发多次调用 → 每次独立返回结果；不在 Connect 层做发送队列或节流（由私有 API 负责）。

## Requirements *(mandatory)*

### Constitution Alignment *(SendSoon Connect)*

| Principle | This Feature |
|-----------|--------------|
| **I. Protocol Adaptation Only** | ✅ 仅注册 MCP tool + 转发 API；不含模板渲染、队列调度、IP 轮换 |
| **II. Resilient Network Calls** | ✅ `core/` 统一超时（connect/read）+ 对 429/5xx/超时有限重试；写操作不重试非幂等 4xx |
| **III. Tool-Skill Pairing** | ✅ 必须交付 `skills/email-basics/SKILL.md`，触发词含「发邮件」「send email」 |
| **IV. Backward-Compatible Evolution** | ✅ 首版 tool；后续字段只增不改，破坏性变更升 MAJOR |

### MCP Tool Contract: `send_email`

**Tool name**: `send_email`（Python / TypeScript 双实现语义一致）

#### Input

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `to` | string | Yes | 收件人邮箱地址 |
| `subject` | string | Yes | 邮件主题 |
| `body` | string | Yes | 邮件正文（纯文本或 HTML） |
| `content_type` | enum | No | `text/plain`（默认）或 `text/html` |
| `from_alias` | string | No | 发件人显示名 |

#### Output

| Field | Type | Present When | Description |
|-------|------|--------------|-------------|
| `success` | boolean | Always | 是否发送成功 |
| `message_id` | string | `success: true` | 私有 API 返回的消息标识，用于追踪 |
| `error` | object | `success: false` | 结构化错误 |
| `error.code` | string | On failure | 稳定错误码，供 Agent 分支处理 |
| `error.message` | string | On failure | 用户友好说明，禁止含堆栈 |
| `error.retryable` | boolean | On failure | 是否建议稍后重试 |

#### Backend Integration

- **Endpoint**: `POST https://api.sendsoonai.com/v1/emails/send`
- **Authentication**: API Key via `SENDSOON_API_KEY` 环境变量（Connect 层注入 Header，禁止写入仓库）
- **Connect 职责**: 输入校验 → 请求体映射 → HTTP 调用（超时/重试）→ 响应映射 → 错误码归一

### Functional Requirements

- **FR-001**: 系统 MUST 暴露 MCP tool `send_email`，接受 `to`、`subject`、`body` 为必填参数。
- **FR-002**: 系统 MUST 支持可选参数 `content_type`（默认 `text/plain`）与 `from_alias`。
- **FR-003**: 系统 MUST 在调用私有 API 前对 `to` 做邮箱格式校验；无效时返回 `INVALID_RECIPIENT`，不发起远程请求。
- **FR-004**: 系统 MUST 在 `success: true` 时返回非空 `message_id`（若 API 未返回则映射为约定占位并记录可观测日志，plan 阶段定具体策略）。
- **FR-005**: 系统 MUST 在失败时返回 `error` 对象，含 `code`、`message`、`retryable`；禁止透传后端堆栈、SQL、内部主机名。
- **FR-006**: 系统 MUST 将 HTTP 4xx（除 429）映射为不可重试的参数/权限类错误；429 与 5xx/网络超时 MUST 按 Constitution 有限重试。
- **FR-007**: 系统 MUST 在同一次发布中提供 `skills/email-basics/SKILL.md`，含触发词、参数说明、成功/失败示例、常见错误处理。
- **FR-008**: 系统 MUST NOT 在本功能中实现：附件上传、邮件模板渲染、批量发送、发送队列、定时发送（均属其他 spec 或私有 API）。

### Error Code Mapping (minimum set)

| Condition | `error.code` | `retryable` |
|-----------|--------------|-------------|
| 本地校验失败（邮箱/空字段） | `INVALID_INPUT` | false |
| API 400 类参数错误 | `INVALID_INPUT` | false |
| API 401/403 | `AUTH_ERROR` | false |
| API 429 | `RATE_LIMITED` | true |
| API 5xx | `SERVER_ERROR` | true |
| 网络超时/连接失败 | `NETWORK_ERROR` | true |

### Key Entities

- **SendRequest**: 一次单封发送请求，含收件人、主题、正文、内容类型、可选别名。
- **SendResult**: 发送结果，成功时含 `message_id`；失败时含结构化 `error`。
- **OutboundEmail**（私有 API 侧）: 由 SendSoon 后端创建并投递的邮件实体；Connect 层不持久化，仅转发。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 运营或 Agent 在提供合法参数的情况下，可在一次 tool 调用内完成单封发送并拿到明确成功/失败结果（无需二次猜测）。
- **SC-002**: 100% 的失败响应均包含 `error.code` 与可读 `error.message`，且不含后端堆栈字符串（抽样审查或自动化断言）。
- **SC-003**: 从 Agent 发起调用到收到结构化响应，在 API 正常且网络稳定时，用户感知为「即时反馈」（目标 p95 &lt; 10 秒，含 API 往返；具体超时值在 plan 阶段于 `core/` 定义）。
- **SC-004**: `skills/email-basics/SKILL.md` 存在且覆盖「发邮件」「send email」触发场景，新用户仅阅读 SKILL 即可完成一次测试发送（人工 review 通过）。
- **SC-005**: `sendsoon_website` 可基于本 tool 完成单封发信联调，作为 M2 里程碑验收项。

## Out of Scope

- 邮件模板渲染引擎
- 发送队列、调度、IP 轮换与信誉管理
- 附件、内嵌图片、批量发送（`batch_send`，见 `specs/003-batch-outreach`）
- 红人匹配、CASE 解析（见 `specs/002-influencer-matching`）
- 任何 Postal/SMTP 服务器配置或凭证

## Assumptions

- 私有 API `POST /v1/emails/send` 已存在或将在 M2 并行交付；字段名若与上表不一致，plan 阶段以 API 契约为准调整映射，用户故事不变。
- API Key 通过部署环境变量 `SENDSOON_API_KEY` 注入；MCP server 启动时若缺失，tool 调用返回 `AUTH_ERROR` 而非 crash。
- v1 不支持附件；若未来需要，通过新增可选参数（非破坏性）扩展。
- 默认 `content_type` 为 `text/plain`；HTML 发送需显式指定 `text/html`。
- 首发实现语言为 TypeScript（npm 生态）；Python 实现可在同 spec 下 follow-up task 对齐，tool schema 保持一致。

## Dependencies

- SendSoon 私有 API：`https://api.sendsoonai.com/v1/emails/send`
- Constitution v1.0.0（`.specify/memory/constitution.md`）
- 后续 spec：`002-influencer-matching`（匹配后可调用本 tool 做单封触达）、`003-batch-outreach`（批量替代单次循环）
