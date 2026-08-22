<!--
Sync Impact Report
==================
Version change: (template) → 1.0.0
Modified principles: N/A (initial ratification)
Added sections:
  - Core Principles (4 principles)
  - Architecture & Security Constraints
  - Development Workflow
Removed sections: Template placeholder principles (5 generic slots)
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ updated
  - .specify/templates/spec-template.md ✅ updated
  - .specify/templates/tasks-template.md ✅ updated
  - .specify/templates/commands/*.md ⚠ N/A (directory not present)
Follow-up TODOs: None
-->

# SendSoon Connect Constitution

## Core Principles

### I. Protocol Adaptation Only

本仓库是公开的 MCP + Agent Skill 适配层，**MUST NOT** 包含任何核心业务逻辑。

- `mcp/` 只处理 MCP 协议适配（tool/resource/prompt 注册、schema 定义、transport 配置）
- `skills/` 只处理 Agent Skills 规范（`SKILL.md` + 触发词 + 示例），纯 Markdown，不含可执行代码
- `core/` 只包含协议无关的 HTTP client（参数校验、请求转发、响应格式转换、错误码映射）
- **所有对外功能** MUST 通过 HTTPS 调用 SendSoon API（默认 `https://www.sendsoonai.com`）；禁止在本仓库实现验证算法、发信调度、Postal/SMTP 配置、IP 信誉管理等私有逻辑
- 写任何函数前 MUST 自问：这段逻辑若复制到私有仓库是否更合适？若是，停止编写，转到 `sendsoon/sendsoon` 私有仓库

**Rationale**: 公开仓库与私有核心引擎的边界是 SendSoon Connect 存在的根本前提；越界会导致安全暴露、维护分裂和竞品复现风险。

### II. Resilient Network Calls

所有对外部 API 的网络调用 **MUST** 具备超时与重试机制，不得裸调 HTTP client。

- **超时**：每个请求 MUST 配置明确的 connect/read 超时；默认值 MUST 在 `core/` 层集中定义，禁止在各 tool handler 中散落硬编码
- **重试**：对幂等读操作和明确可重试的错误（如 429、502、503、504、网络超时）MUST 实现有限次重试；重试 MUST 使用指数退避并带上限
- **不可重试**：4xx 客户端错误（除 429）MUST NOT 自动重试；写操作 MUST 仅在 API 契约明确保证幂等时才允许重试
- **可观测**：失败 MUST 返回结构化错误信息（含 HTTP 状态码、API 错误码、可读 message），便于 Agent 和用户排查

**Rationale**: MCP server 运行在 Agent 长会话中，网络抖动不应导致 silent hang 或不可恢复的中断；统一的 client 层保证 Python/TS 双实现行为一致。

### III. Tool-Skill Pairing

每个 MCP tool **MUST** 有对应的 `SKILL.md` 使用说明，tool 与 skill 一一配对、同步演进。

- 新增 MCP tool 时，MUST 在同一次变更中新增或更新对应 `skills/<name>/SKILL.md`（或 `.agent/skills/<name>/SKILL.md`）
- SKILL.md MUST 包含：触发词/使用场景、`description` frontmatter、参数说明、端到端调用示例、常见错误处理；**MUST NOT** 描述后端实现细节
- Python 与 TypeScript 双实现的 tool 名称、输入输出 schema 语义 MUST 保持一致；SKILL.md 只写一份，语言无关
- PR 审查 MUST 验证 tool 清单与 skill 清单对齐；缺少 SKILL 的 tool 不得合并

**Rationale**: MCP tool 暴露机器接口，SKILL.md 暴露人类/Agent 使用指南；二者分离会导致 discoverability 断裂和误用。

### IV. Backward-Compatible Evolution

协议与接口变更 **MUST** 优先保证向后兼容；破坏性变更通过新增目录/版本实现，而非重构现有路径。

- 现有 MCP tool 的名称、必填参数、响应字段 **MUST NOT** 在不升 MAJOR 版本的情况下删除或改变语义
- 新协议（MCP 之外）→ 新增顶层目录（如 `future-protocol-x/`），不修改 `mcp/` 现有结构
- 双语言实现（Python/TypeScript）MUST 同步暴露一致的 tool 集合；单侧先行 MUST 在 spec 中标注并在另一侧补齐后再发布
- 仓库拆分仅在满足明确信号时进行（外部真实 PR、发布节奏严重不一致、技术栈完全不重叠）

**Rationale**: 公开适配层被多生态、多版本客户端依赖；破坏性重构的迁移成本远高于增量扩展。

## Architecture & Security Constraints

- **目录职责**（不可混淆）：
  - `mcp/` — MCP 协议适配
  - `skills/` — Agent Skills 文档
  - `core/` — 共享 HTTP client（Python/TS 各一份，接口语义一致）
  - `specs/` — Spec-Driven Development 产出
- **语言选型**：stdio 本地 MCP server → Python；npm 发布 / Streamable HTTP → TypeScript
- **安全红线**（绝不允许）：
  - API Key、密钥、`.env` 明文内容进入仓库
  - Postal/SMTP/Caddy/Nginx 具体配置
  - 邮箱验证算法（黑名单库、评分逻辑）
- **凭证处理**：示例与测试 MUST 使用占位符（如 `YOUR_API_KEY`），禁止真实凭证

## Development Workflow

- **先方案，后实施**：涉及新 MCP tool/SKILL、`core/` 接口变更、新依赖、协议版本升级时，MUST 先输出技术方案并等待人工确认，再动手实现（详见 `.cursor/rules/50-workflow.mdc`）
- **Spec-Driven Development**：功能变更 SHOULD 走 `/specify` → `/plan` → `/tasks` → `/implement`，规格文档提交到 `specs/` 留痕
- **例外**（可跳过方案确认）：已确认 spec 内的 bug 修复、拼写/注释/格式化、当前对话已明确确认的改动
- **审查门禁**：每个 PR MUST 通过 Constitution Check（见 plan-template.md），确认不违反四项 Core Principles

## Governance

- 本 Constitution 优先级高于其他开发惯例；与 `.cursor/rules/` 冲突时，以本文件为准并同步更新 rules
- **修订程序**：
  1. 提出修订动机与影响范围
  2. 更新本文件并递增 `CONSTITUTION_VERSION`（语义化版本）
  3. 同步更新 `.specify/templates/` 中依赖的检查项
  4. 重大原则变更 MUST 经人工确认后合并
- **版本策略**：
  - MAJOR：原则删除或重新定义（向后不兼容的治理变更）
  - MINOR：新增原则或实质性扩展指导
  - PATCH：措辞澄清、非语义 refinements
- **合规审查**：plan 阶段的 Constitution Check 为强制门禁；implement 阶段 MUST 验证 tool/skill 配对与 network client 配置
- **运行时指南**：`.cursor/rules/00-guardrails.mdc`、`10-architecture.mdc`、`40-skills-markdown.mdc`、`50-workflow.mdc`

**Version**: 1.0.0 | **Ratified**: 2026-07-06 | **Last Amended**: 2026-07-06
