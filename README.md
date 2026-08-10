# SendSoon AI MCP

面向 [SendSoon](https://www.sendsoonai.com/) 的 MCP（Model Context Protocol）服务，让 Codex、Claude、Cursor 及其他支持 MCP 的 AI Agent 调用邮件发送、IP 查询和文件转 Markdown 能力。

配置完成后，直接用自然语言描述任务即可，例如“查询 `8.8.8.8` 的归属地”。通常不需要每次强调“使用 SENDSOON”；Agent 会根据工具描述自动选择。只有 Agent 没有调用工具时，才需要明确说“请调用 `sendsoon` 的 `ip_lookup` 工具”。

## 当前能力

| MCP tool | 用途 | 关键输入 |
| --- | --- | --- |
| `send_email` | 发送单封测试邮件 | `to`、`subject`、`text` 或 `html` |
| `ip_lookup` | 查询公网 IP 的地区、运营商等信息 | `ip` |
| `markitdown_convert` | 将 PDF、Office、图片、音频等文件转换成 Markdown | 本地文件路径或可访问的文件 URL |

邮件发送的每日免费额度由 SendSoon 服务端控制。后续将按业务优先级扩展红人匹配、批量触达等能力。

## 环境要求

- Node.js 20 或更高版本
- pnpm 11
- 支持本地 stdio MCP Server 的客户端

## 安装与构建

```powershell
git clone <本仓库地址>
cd ai
pnpm install
pnpm run build
```

构建成功后，MCP Server 入口为：

```text
<仓库绝对路径>/mcp/dist/index.js
```

下面使用 `/absolute/path/to/ai/mcp/dist/index.js` 作为占位路径。请将它替换为你本机仓库中 `mcp/dist/index.js` 的绝对路径；Windows 用户推荐使用正斜杠，例如 `C:/Users/your-name/projects/ai/mcp/dist/index.js`。

## 环境变量与安全限制

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `SENDSOON_API_BASE_URL` | 否 | 默认 `https://www.sendsoonai.com` |
| `SENDSOON_EMAIL_RECIPIENT` | 发送邮件时是 | 本地收件人白名单；`send_email.to` 必须与它完全一致 |
| `SENDSOON_API_KEY` | 否 | 生产应用建议配置，用于身份认证和后续能力扩展 |

体验当前公开能力时不需要注册或配置 Key。用于生产应用时，建议申请并配置 `SENDSOON_API_KEY`；MCP 会自动通过 Bearer 鉴权发送它，后续扩展能力时不需要更换 Server。

配置方法：在下方任一客户端示例的 `env` 中增加 `"SENDSOON_API_KEY": "你的-key"`；Codex 的 TOML 配置则增加 `SENDSOON_API_KEY = "你的-key"`。Key 属于敏感凭据，不要提交到 Git、写入团队共享配置或发送到聊天中。

建议为每位用户设置自己的 `SENDSOON_EMAIL_RECIPIENT`，不要把 MCP 服务配置成可向任意地址发送邮件。

## Codex 配置

Codex 的用户级配置文件是 `~/.codex/config.toml`；项目也可以使用受信任项目中的 `.codex/config.toml`。

在配置文件中加入：

```toml
[mcp_servers.sendsoon]
command = "node"
args = ["/absolute/path/to/ai/mcp/dist/index.js"]

[mcp_servers.sendsoon.env]
SENDSOON_API_BASE_URL = "https://www.sendsoonai.com"
SENDSOON_EMAIL_RECIPIENT = "you@example.com"
```

也可以通过 Codex CLI 添加：

```powershell
codex mcp add sendsoon --env SENDSOON_API_BASE_URL=https://www.sendsoonai.com --env SENDSOON_EMAIL_RECIPIENT=you@example.com -- node /absolute/path/to/ai/mcp/dist/index.js
```

验证配置：

```powershell
codex mcp list
```

重新打开 Codex 任务后，可通过 `/mcp` 检查服务和工具。桌面版也可以在 `Settings > MCP servers` 中添加或查看服务。

## Claude Code 配置

推荐通过 CLI 添加用户级 MCP Server：

```powershell
claude mcp add --transport stdio --scope user --env SENDSOON_API_BASE_URL=https://www.sendsoonai.com --env SENDSOON_EMAIL_RECIPIENT=you@example.com sendsoon -- node /absolute/path/to/ai/mcp/dist/index.js
```

验证配置：

```powershell
claude mcp list
claude mcp get sendsoon
```

进入 Claude Code 后运行 `/mcp`，确认 `sendsoon` 已连接。如果只希望项目成员共享配置，可以将 scope 改为 `project`；Claude Code 会在项目根目录创建 `.mcp.json`，其他成员首次使用时仍需审核并信任该服务。

## Claude Desktop 配置

对于本地开发中的 stdio Server，可以在 Claude Desktop 的开发者配置文件中加入：

```json
{
  "mcpServers": {
    "sendsoon": {
      "command": "node",
      "args": ["/absolute/path/to/ai/mcp/dist/index.js"],
      "env": {
        "SENDSOON_API_BASE_URL": "https://www.sendsoonai.com",
        "SENDSOON_EMAIL_RECIPIENT": "you@example.com"
      }
    }
  }
}
```

常见配置文件位置：

- Windows：`%APPDATA%/Claude/claude_desktop_config.json`
- macOS：`~/Library/Application Support/Claude/claude_desktop_config.json`

可从 Claude Desktop 的 `Settings > Developer` 打开配置文件。保存后完全退出并重新启动 Claude Desktop，再在工具列表中确认 `sendsoon`。新版 Claude Desktop 优先推荐经过打包和签名的 Desktop Extension（DXT）；上面的手动配置适合开发和本地测试。

## Cursor 配置

项目级配置保存到项目根目录的 `.cursor/mcp.json`，全局配置保存到 `~/.cursor/mcp.json`。内容如下：

```json
{
  "mcpServers": {
    "sendsoon": {
      "command": "node",
      "args": ["/absolute/path/to/ai/mcp/dist/index.js"],
      "env": {
        "SENDSOON_API_BASE_URL": "https://www.sendsoonai.com",
        "SENDSOON_EMAIL_RECIPIENT": "you@example.com"
      }
    }
  }
}
```

注意：顶层只能有一个 `mcpServers`，不要写成下面这种嵌套结构：

```text
mcpServers -> mcpServers -> sendsoon  （错误）
```

保存后打开 Cursor 的 `Settings > Tools & MCP`，确认 `sendsoon` 为启用状态。重开 Agent 对话后，Cursor 会在相关请求中自动选择 MCP 工具；默认情况下，真正执行工具前可能要求用户批准。

如果安装了 Cursor CLI，可进一步检查：

```powershell
agent mcp list
agent mcp list-tools sendsoon
```

旧版 CLI 可将 `agent` 替换为 `cursor-agent`。

## 其他 MCP 客户端

Windsurf、Cline、Continue 等支持 stdio MCP 的客户端，配置名称或文件位置可能不同，但核心参数完全相同：

| 参数 | 值 |
| --- | --- |
| Transport | `stdio` |
| Command | `node` |
| Arguments | `<仓库绝对路径>/mcp/dist/index.js` |
| Environment | `SENDSOON_API_BASE_URL`、`SENDSOON_EMAIL_RECIPIENT` |

通用 JSON 示例：

```json
{
  "mcpServers": {
    "sendsoon": {
      "command": "node",
      "args": ["/absolute/path/to/ai/mcp/dist/index.js"],
      "env": {
        "SENDSOON_API_BASE_URL": "https://www.sendsoonai.com",
        "SENDSOON_EMAIL_RECIPIENT": "you@example.com"
      }
    }
  }
}
```

客户端必须启动上述进程，通过 stdin/stdout 完成 MCP 通信，并允许用户启用或批准暴露出来的工具。如果某个客户端只支持远程 HTTP MCP、不支持本地 stdio，则不能直接使用这份配置，需要额外部署一个受保护的远程传输层。

## 配置后如何使用

直接在 Agent 对话中描述目标即可：

```text
查询 8.8.8.8 的 IP 归属地和运营商。
```

```text
把 D:/docs/product.pdf 转成 Markdown，并总结关键结论。
```

```text
给 you@example.com 发一封测试邮件，主题是“SendSoon MCP 测试”，正文是“配置成功”。
```

邮件地址必须与配置中的 `SENDSOON_EMAIL_RECIPIENT` 一致。第一次调用时，客户端可能弹出授权确认，这是 MCP 客户端的安全机制，不是 SendSoon 登录。

如果 Agent 没有自动调用工具，可使用更明确的说法：

```text
请调用 sendsoon MCP 的 ip_lookup 工具查询 8.8.8.8。
```

不需要把这句话永久写进每次请求。若希望团队统一行为，可在 Cursor Rules、`CLAUDE.md` 或项目 Agent 指令中加入一句：“涉及发邮件、IP 查询或文件转 Markdown 时，优先使用 sendsoon MCP。”

## 本地验证与调试

运行完整的静态检查和自动化测试：

```powershell
pnpm run check
```

用 MCP Inspector 查看工具清单并手动调用：

```powershell
pnpm dlx @modelcontextprotocol/inspector node mcp/dist/index.js
```

真实服务冒烟测试默认调用 IP 查询和 MarkItDown。只有设置 `SENDSOON_LIVE_EMAIL_TO` 时才会真正发送邮件：

```powershell
$env:SENDSOON_LIVE_EMAIL_TO = "you@example.com"
pnpm run test:live
```

测试邮件会消耗服务端免费额度，请勿在 CI 中默认启用。

## 故障排查

### 找不到 `node`

先运行 `node --version`，确认版本不低于 20。部分桌面应用不会继承终端的 PATH，可运行 `where.exe node`（Windows）或 `which node`（macOS/Linux），再把配置中的 `command` 改成 `node` 可执行文件的绝对路径。

### MCP Server 断开或没有工具

1. 运行 `pnpm run build`，确认 `mcp/dist/index.js` 存在。
2. 检查配置路径是否为绝对路径，JSON/TOML 是否有效。
3. 完全重启客户端，重新打开对话。
4. 在客户端 MCP 设置中确认 `sendsoon` 已启用。
5. 使用 MCP Inspector 判断问题在 Server 还是客户端配置。

### 邮件提示收件人不允许

`send_email.to` 必须和 `SENDSOON_EMAIL_RECIPIENT` 完全一致。修改环境变量后需要重启客户端，因为 MCP 子进程只在启动时读取环境变量。

### 网络错误、限流或额度不足

确认能访问 `https://www.sendsoonai.com`。GET 请求会对部分临时网络错误和 `429/502/503/504` 进行有限重试；POST 请求默认不自动重试，避免重复发送邮件。达到每日额度后需等待额度恢复。

## 可靠性约定

- GET 请求使用指数退避，并遵守服务端 `Retry-After`。
- POST 请求不自动重试；邮件请求携带 `Idempotency-Key`，但是否去重由服务端决定。
- 默认 30 秒超时覆盖请求及响应正文读取。
- API Base URL 必须使用 HTTPS；仅 localhost 调试允许 HTTP。
- `send_email` 使用收件人白名单，避免将公开测试接口变成任意邮件转发器。

## 项目结构

```text
core/     协议无关的 HTTP client、校验、超时、重试与错误映射
mcp/      TypeScript MCP Server 和工具定义
skills/   Agent Skill 文档和调用示例
tests/    单元测试、stdio 集成测试和真实服务冒烟测试
```

## 官方参考

- [OpenAI Codex：Model Context Protocol](https://developers.openai.com/codex/mcp)
- [Anthropic：Connect Claude Code to tools via MCP](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [Anthropic：Getting started with local MCP servers on Claude Desktop](https://support.anthropic.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop)
- [Cursor：Model Context Protocol](https://docs.cursor.com/context/model-context-protocol)
- [Model Context Protocol：Build an MCP client](https://modelcontextprotocol.io/docs/develop/build-client)

## License

See [LICENSE](LICENSE).
