# SendSoon AI MCP

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md)

让 Codex、Claude、Cursor 等 AI Agent 使用 [SendSoon](https://sendsoonai.com/) 的邮件发送、IP 查询和文件转 Markdown 能力。

配置一次后，直接用自然语言描述任务即可，通常不需要每次强调“使用 SendSoon”。

## 可以做什么

| 工具 | 用途 | 示例 |
| --- | --- | --- |
| `send_email` | 发送单封邮件 | “给我发一封测试邮件” |
| `ip_lookup` | 查询公网 IP 信息 | “查询 8.8.8.8 的归属地” |
| `markitdown_convert` | 将文件转换成 Markdown | “把这份 PDF 转成 Markdown” |

## 在 Google Colab 中试用

免去本地环境配置，点击即可在浏览器中试用 `ip_lookup`、`markitdown_convert` 和 `send_email`。

[![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/sendsoon/ai/blob/main/docs/SendSoon.ipynb)

该 Notebook 调用的是 MCP 工具背后同一套 SendSoon HTTP API。若要在 Cursor、Claude 或 Codex 中使用，请继续完成下面的本地 MCP 配置。

## 第一步：确认环境

- Node.js 20 或更高版本
- Codex、Claude、Cursor 或其他支持本地 stdio MCP 的客户端

不需要手动安装任何东西。下面所有配置都通过 `npx` 启动服务，首次使用时自动下载 [`@sendsoon/mcp-server`](https://www.npmjs.com/package/@sendsoon/mcp-server)，之后复用缓存。

如果你更希望从源码运行，见 [从源码构建](#从源码构建)。

## 第二步：准备配置

所有客户端都使用相同的环境变量：

| 配置项 | 是否必填 | 如何填写 |
| --- | --- | --- |
| `SENDSOON_EMAIL_RECIPIENT` | 是 | 将 `<YOUR_EMAIL>` 替换为你的收件邮箱 |
| `SENDSOON_API_KEY` | 否 | 未注册体验时可留空；同一公网 IP 每天最多免费发送 3 封测试邮件。继续使用时请填写注册后生成的 Key |
| `SENDSOON_API_BASE_URL` | 否 | 默认为 `https://www.sendsoonai.com`，仅在需要指向其他环境时才设置 |

请勿将真实 Key 提交到 Git 或分享给其他人。

### 获取 API Key

1. 在 [SendSoon 注册页](https://sendsoonai.com/login-register) 注册并登录。
2. 打开 [个人设置](https://sendsoonai.com/profile)，在 API Key 区域生成一个 Key。
3. 立即复制仅展示一次的 `ssk_live_...` Key，并将它填入 MCP 配置的 `SENDSOON_API_KEY`。
4. 保存配置并重启 MCP 客户端。带有效 Key 的请求不会消耗匿名 IP 的每日 3 次额度。

如果匿名额度已经用完，`send_email` 会返回注册与配置 Key 的提示；配置无效或已撤销的 Key 会被拒绝，不会自动退回匿名额度。

## 第三步：选择你的客户端

### Cursor

打开 Cursor 的 `Settings > Tools & MCP`，添加 MCP Server；也可以将下面的内容保存到项目的 `.cursor/mcp.json` 或用户目录的 `~/.cursor/mcp.json`：

```json
{
  "mcpServers": {
    "sendsoon": {
      "command": "npx",
      "args": ["-y", "@sendsoon/mcp-server"],
      "env": {
        "SENDSOON_EMAIL_RECIPIENT": "<YOUR_EMAIL>",
        "SENDSOON_API_KEY": ""
      }
    }
  }
}
```

顶层只需要一个 `mcpServers`，不要重复嵌套。保存后重新打开 Cursor，并确认 `sendsoon` 已启用。

### Codex

打开用户级配置文件 `~/.codex/config.toml`，加入：

```toml
[mcp_servers.sendsoon]
command = "npx"
args = ["-y", "@sendsoon/mcp-server"]

[mcp_servers.sendsoon.env]
SENDSOON_EMAIL_RECIPIENT = "<YOUR_EMAIL>"
SENDSOON_API_KEY = ""
```

保存后重新打开 Codex，通过 `/mcp` 确认 `sendsoon` 已连接。桌面版也可以在 `Settings > MCP servers` 中查看。

### Claude Code

将下面命令中的占位符替换后运行：

```powershell
claude mcp add --transport stdio --scope user --env SENDSOON_EMAIL_RECIPIENT=<YOUR_EMAIL> sendsoon -- npx -y @sendsoon/mcp-server
```

进入 Claude Code 后运行 `/mcp`，确认 `sendsoon` 已连接。需要使用 Key 时，在命令的 `sendsoon` 之前增加 `--env SENDSOON_API_KEY=<SENDSOON_API_KEY>`。

### Claude Desktop

打开 `Settings > Developer` 中的配置文件，加入：

```json
{
  "mcpServers": {
    "sendsoon": {
      "command": "npx",
      "args": ["-y", "@sendsoon/mcp-server"],
      "env": {
        "SENDSOON_EMAIL_RECIPIENT": "<YOUR_EMAIL>",
        "SENDSOON_API_KEY": ""
      }
    }
  }
}
```

保存后完全退出并重新启动 Claude Desktop，再确认工具列表中出现 `sendsoon`。

### 其他 MCP 客户端

Windsurf、Cline、Continue 等支持本地 stdio MCP 的客户端，填写以下信息即可：

| 参数 | 值 |
| --- | --- |
| Transport | `stdio` |
| Command | `npx` |
| Arguments | `-y @sendsoon/mcp-server` |
| Environment | 上方列出的环境变量 |

## 确认配置成功

重新启动客户端并打开一个新对话，然后输入：

```text
查询 8.8.8.8 的 IP 归属地和运营商。
```

Agent 调用 `ip_lookup` 并返回查询结果，说明 MCP 已经连接成功。

需要验证邮件时，再输入：

```text
给 <YOUR_EMAIL> 发送一封测试邮件，主题是“SendSoon MCP 测试”，正文是“配置成功”。
```

这里的邮箱必须和配置中的 `SENDSOON_EMAIL_RECIPIENT` 完全一致。第一次调用工具时，客户端可能要求确认授权，选择允许即可。

## 日常使用示例

```text
查询 1.1.1.1 的 IP 信息。
```

```text
把 <YOUR_FILE_PATH> 转换成 Markdown，并总结重点。
```

```text
给 <YOUR_EMAIL> 发一封邮件，主题是“会议提醒”，正文是“今天下午三点开会”。
```

如果 Agent 没有自动选择工具，可以明确说：

```text
请调用 sendsoon MCP 完成这个任务。
```

通常只需在首次使用时这样提示，后续可以直接描述任务。

## Agent Skills

本仓库同时提供 Agent Skills，告诉 Agent 什么时候该用哪个工具、以及如何处理各类错误码。在 Claude Code 中可以作为插件安装：

```text
/plugin marketplace add sendsoon/ai
/plugin install sendsoon-skills@sendsoon
```

也可以把 [`skills/`](skills) 下的任意目录复制到项目的 `.claude/skills/` 或用户目录的 `~/.claude/skills/`。

## 从源码构建

仅在需要修改服务端代码或运行未发布版本时才需要，要求 pnpm 11。

```powershell
git clone https://github.com/sendsoon/ai.git
cd ai
pnpm install
pnpm run build
pnpm run bundle
```

然后把客户端配置从 `npx` 改为指向构建产物，用下面的命令获取绝对路径：

```powershell
(Resolve-Path .\mcp\bin\sendsoon-mcp.mjs).Path.Replace('\', '/')
```

```bash
realpath ./mcp/bin/sendsoon-mcp.mjs
```

配置改成 `"command": "node"`，并把上面得到的绝对路径作为唯一参数。修改代码后运行 `pnpm run check` 执行 lint 和测试。

## 官方参考

- [OpenAI Codex：Model Context Protocol](https://developers.openai.com/codex/mcp)
- [Anthropic：Claude Code MCP](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [Cursor：Model Context Protocol](https://docs.cursor.com/context/model-context-protocol)
- [Model Context Protocol](https://modelcontextprotocol.io/)

## License

See [LICENSE](LICENSE).
