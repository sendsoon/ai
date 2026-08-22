---
description: "Task list for send_email MCP tool (P0)"
---

# Tasks: send_email MCP Tool

**Input**: Design documents from `specs/001-send-email/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: 未在 spec 中明确要求 TDD；Polish 阶段通过 quickstart 手动验证。`core/` 单元测试为可选增强，不阻塞 MVP。

**Organization**: 按 user story 分组，支持 US1 独立交付 MVP。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行（不同文件、无未完成依赖）
- **[Story]**: 对应 spec.md 用户故事（US1/US2/US3）

## Path Conventions

- **core/**: 协议无关 HTTP client（`core/src/`）
- **mcp/**: MCP 协议适配（`mcp/src/`）
- **skills/**: Agent Skills 文档（`skills/email-basics/`）

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 初始化 monorepo 骨架与 TypeScript 工具链

- [x] T001 Create root `.gitignore` per SendSoon-Connect-开发指南（exclude `.env`, `node_modules/`, `dist/`, `.specify/cache/`）
- [x] T002 [P] Initialize `core/package.json` with TypeScript 5.x, `"type": "module"`, build script
- [x] T003 [P] Initialize `mcp/package.json` with `@modelcontextprotocol/sdk` ^1.29.0, `zod`, workspace/file dependency on `core`
- [x] T004 [P] Create `core/tsconfig.json` with `strict: true`, `moduleResolution: bundler`, outDir `dist`
- [x] T005 [P] Create `mcp/tsconfig.json` with project reference to `core`, outDir `dist`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: `core/` 共享层——所有 user story 依赖此阶段完成

**⚠️ CRITICAL**: US1/US2/US3 均不得在此阶段完成前开始

- [x] T006 Create `core/src/types/send-request.ts` and `core/src/types/send-result.ts` per `specs/001-send-email/data-model.md`
- [x] T007 Create `core/src/config.ts` reading `SENDSOON_API_KEY` and `SENDSOON_API_BASE_URL` (default `https://api.sendsoonai.com`)
- [x] T008 Create `core/src/errors.ts` with `SendSoonErrorCode` enum, `mapHttpError()`, `mapValidationError()` per plan.md error table
- [x] T009 Create `core/src/http.ts` with native fetch wrapper: connect 10s / read 30s timeout, max 3 retries, exponential backoff (500ms–4s), retry on 429/502/503/504 and network errors
- [x] T010 Create `core/src/client.ts` with `SendSoonClient.sendEmail()` posting to `/v1/emails/send` using `core/src/http.ts` and Bearer auth
- [x] T011 Create `core/src/index.ts` exporting client, types, and error helpers
- [x] T012 [P] Create root `.env.example` with `SENDSOON_API_KEY=` and `SENDSOON_API_BASE_URL=` placeholders

**Checkpoint**: `SendSoonClient.sendEmail()` 可独立调用（mock fetch 或 staging API）

---

## Phase 3: User Story 1 - 运营单次红人触达 (Priority: P1) 🎯 MVP

**Goal**: 运营或 Agent 通过 `send_email` 完成单封纯文本/HTML 发送，返回 `success` + `message_id`

**Independent Test**: Inspector 调用 `send_email` with valid `to`/`subject`/`body` → `success: true`, non-empty `message_id`（见 spec US1）

### Implementation for User Story 1

- [x] T013 [US1] Create `mcp/src/server.ts` with `McpServer({ name: 'sendsoon-connect', version: '1.0.0' })`
- [x] T014 [US1] Create `mcp/src/tools/send_email.ts` with Zod v4 inputSchema (`to`, `subject`, `body`, `content_type`, `from_alias`) and outputSchema per `specs/001-send-email/contracts/send_email-tool.schema.json`
- [x] T015 [US1] Implement send_email handler in `mcp/src/tools/send_email.ts` calling `SendSoonClient.sendEmail()` and returning `structuredContent`
- [x] T016 [US1] Register `send_email` tool in `mcp/src/server.ts`
- [x] T017 [US1] Create `mcp/src/index.ts` with stdio transport (`StdioServerTransport`) entry point
- [x] T018 [US1] Add `build` and `start` scripts to `mcp/package.json` (e.g. `tsc` + `node dist/index.js`)

**Checkpoint**: MVP 可用 — plain text 和 `content_type: text/html` 均可发送成功

---

## Phase 4: User Story 2 - Agent 测试发送与错误恢复 (Priority: P2)

**Goal**: 参数错误与 API 故障返回结构化 `error`（code/message/retryable），无堆栈泄露

**Independent Test**: 无效邮箱 → `INVALID_RECIPIENT`；mock 429 → `RATE_LIMITED`；mock 5xx → `SERVER_ERROR`（见 spec US2）

### Implementation for User Story 2

- [x] T019 [US2] Extend `core/src/errors.ts` with `PAYLOAD_TOO_LARGE` and user-friendly messages for all codes in spec.md
- [x] T020 [US2] Integrate full HTTP status mapping in `core/src/client.ts` (400→INVALID_INPUT, 401/403→AUTH_ERROR, 413→PAYLOAD_TOO_LARGE, 429→RATE_LIMITED, 5xx→SERVER_ERROR)
- [x] T021 [US2] Update `mcp/src/tools/send_email.ts` to always return `{ success: false, error }` on failure without throwing MCP exceptions
- [x] T022 [US2] Handle missing `SENDSOON_API_KEY` in `core/src/client.ts` returning `AUTH_ERROR` before HTTP call
- [x] T023 [US2] Add pre-API validation in `mcp/src/tools/send_email.ts`: invalid email → `INVALID_RECIPIENT`, empty subject/body → `INVALID_INPUT`

**Checkpoint**: 所有 spec US2 acceptance scenarios 可通过 Inspector 或 mock 验证

---

## Phase 5: User Story 3 - 可选发件人别名 (Priority: P3)

**Goal**: `from_alias` 可选；省略时使用 API 默认发件人，提供时正确转发

**Independent Test**: 不传 `from_alias` 发送成功；传 `"SendSoon Outreach"` 时请求体含该字段（见 spec US3）

### Implementation for User Story 3

- [x] T024 [US3] Update `core/src/client.ts` to omit `from_alias` from JSON body when undefined
- [x] T025 [US3] Add `from_alias` optional field description in `mcp/src/tools/send_email.ts` tool metadata for Agent discoverability
- [x] T026 [US3] Document optional `from_alias` usage in `skills/email-basics/SKILL.md`

**Checkpoint**: US3 acceptance scenarios pass

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: SKILL 配对、文档、Constitution 合规、quickstart 验证

- [x] T027 [P] Create `skills/email-basics/SKILL.md` with frontmatter (`name`, `description`), triggers「发邮件」「send email」, parameters, error handling
- [x] T028 [P] Create `skills/email-basics/examples/plain-text-send.md` with placeholder `YOUR_API_KEY`
- [x] T029 [P] Create `skills/email-basics/examples/html-send.md` with `content_type: text/html` example
- [x] T030 [P] Verify tool I/O in `mcp/src/tools/send_email.ts` aligns with `specs/001-send-email/contracts/send_email-tool.schema.json`
- [x] T031 Verify HTTP timeout/retry only in `core/src/http.ts` not duplicated in `mcp/src/tools/send_email.ts` (Constitution II)
- [x] T032 Confirm no core business logic beyond param validation + forwarding in `core/src/client.ts` (Constitution I)
- [x] T033 Update root `README.md` with env setup, build, and MCP Inspector quickstart link to `specs/001-send-email/quickstart.md`
- [x] T034 Run validation checklist in `specs/001-send-email/quickstart.md` sections 1–7

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖，立即开始
- **Foundational (Phase 2)**: 依赖 Setup — **阻塞所有 user story**
- **US1 (Phase 3)**: 依赖 Foundational — **MVP 里程碑**
- **US2 (Phase 4)**: 依赖 Foundational；与 US1 部分重叠，建议 US1 完成后执行
- **US3 (Phase 5)**: 依赖 US1（同一 tool）；可与 US2 并行（不同关注点）
- **Polish (Phase 6)**: 依赖 US1 至少完成；SKILL 文档可在 US1 后并行起草

### User Story Dependencies

- **US1 (P1)**: Foundational 完成后即可开始 — 无其他 story 依赖
- **US2 (P2)**: 依赖 Foundational + US1 tool 骨架；增强错误路径
- **US3 (P3)**: 依赖 US1；仅扩展 optional 字段行为与文档

### Within Each User Story

- Types/config before client
- Client before MCP tool handler
- Tool registration before index.ts transport
- Story complete before Polish 最终验证

### Parallel Opportunities

- Phase 1: T002–T005 全部 [P]
- Phase 2: T012 与 T006–T011 末尾可并行
- Phase 6: T027–T030 全部 [P]
- US2 与 US3 在 US1 完成后可由不同开发者并行

---

## Parallel Example: Phase 1 Setup

```bash
# Launch together:
Task T002: Initialize core/package.json
Task T003: Initialize mcp/package.json
Task T004: Create core/tsconfig.json
Task T005: Create mcp/tsconfig.json
```

## Parallel Example: Phase 6 Polish

```bash
# Launch together:
Task T027: skills/email-basics/SKILL.md
Task T028: examples/plain-text-send.md
Task T029: examples/html-send.md
Task T030: Verify contract alignment
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational（**CRITICAL**）
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: MCP Inspector 发送纯文本邮件
5. 可 demo 给 sendsoon_website 团队做早期联调

### Incremental Delivery

1. Setup + Foundational → core client 就绪
2. US1 → 单封发送 MVP → 网站可联调基础发信
3. US2 → 错误恢复 → Agent 自动化可靠
4. US3 + Polish → 别名 + SKILL 文档 → 完整 P0 交付

### Suggested MVP Scope

**Minimum for M2 milestone**: Phase 1 + Phase 2 + Phase 3（T001–T018）

**Full P0 delivery**: T001–T034

---

## Notes

- Python MCP 实现不在本 tasks 范围；TS 首发，后续 spec 单列 follow-up
- Streamable HTTP transport（website 远程联调）可在 M6 单独 task，本 feature 仅交付 stdio
- API 字段联调差异只改 `core/src/client.ts` 映射，不改 tool schema
- 每个 task 完成后建议 commit，便于 review `core/` 共享逻辑
