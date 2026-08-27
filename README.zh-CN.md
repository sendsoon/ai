# SendSoon AI MCP

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md)

SendSoon MCP 是一个 [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) 服务端，让 Codex、Claude、Cursor 等 AI Agent 调用 [SendSoon](https://sendsoonai.com/) 的能力：发邮件、查 IP、把本地文档转成 Markdown。

配置一次后，直接用自然语言描述任务即可，通常不需要每次强调“使用 SendSoon”。

## 可以做什么

| 工具 | 用途 | 示例 |
| --- | --- | --- |
| `send_email` | 发送单封邮件 | “给我发一封测试邮件” |
| `ip_lookup` | 查询公网 IP 信息 | “查询 8.8.8.8 的归属地” |
| `markitdown_convert` | 将本地文档转换成 Markdown | “把这份 PDF 转成 Markdown” |

## 安装包

任选 **npm（Node）** 或 **PyPI（Python）** 作为 MCP 运行时，工具名称与环境变量相同。

| 渠道 | 包名 | 要求 |
| --- | --- | --- |
| npm | [`@sendsoon/mcp`](https://www.npmjs.com/package/@sendsoon/mcp) | Node.js 20+ |
| PyPI | [`sendsoon-mcp`](https://pypi.org/project/sendsoon-mcp/) | Python 3.10+，详见 [`pypi/README.md`](pypi/README.md) |

客户端配置里使用 `npx -y @sendsoon/mcp` 或 `uvx sendsoon-mcp` 启动服务即可，无需单独全局安装。

## 准备配置

所有客户端都使用相同的环境变量：

| 配置项 | 是否必填 | 如何填写 |
| --- | --- | --- |
| `SENDSOON_API_KEY` | 否 | 未注册体验时可留空；同一公网 IP 每天最多免费发送 3 封测试邮件。继续使用时请填写注册后生成的 Key |
| `SENDSOON_API_BASE_URL` | 否 | 默认为 `https://www.sendsoonai.com`，仅在需要指向其他环境时才设置 |

请勿将真实 Key 提交到 Git 或分享给其他人。

### 获取 API Key

1. 在 [SendSoon 注册页](https://sendsoonai.com/login-register) 注册并登录。
2. 打开 [个人设置](https://sendsoonai.com/profile)，在 API Key 区域生成一个 Key。
3. 立即复制仅展示一次的 `ssk_live_...` Key，并将它填入 MCP 配置的 `SENDSOON_API_KEY`。
4. 保存配置并重启 MCP 客户端。带有效 Key 的请求不会消耗匿名 IP 的每日 3 次额度。

如果匿名额度已经用完，`send_email` 会返回注册与配置 Key 的提示；配置无效或已撤销的 Key 会被拒绝，不会自动退回匿名额度。

## 安装到 AI 客户端

### Cursor

打开 Cursor 的 `Settings > Tools & MCP`，添加 MCP Server；也可以将下面的内容保存到项目的 `.cursor/mcp.json` 或用户目录的 `~/.cursor/mcp.json`。

**Node（npm）：**

```json
{
  "mcpServers": {
    "sendsoon": {
      "command": "npx",
      "args": ["-y", "@sendsoon/mcp"],
      "env": {
        "SENDSOON_API_KEY": ""
      }
    }
  }
}
```

**PyPI：**

```json
{
  "mcpServers": {
    "sendsoon": {
      "command": "uvx",
      "args": ["sendsoon-mcp"],
      "env": {
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
args = ["-y", "@sendsoon/mcp"]

[mcp_servers.sendsoon.env]
SENDSOON_API_KEY = ""
```

保存后重新打开 Codex，通过 `/mcp` 确认 `sendsoon` 已连接。桌面版也可以在 `Settings > MCP servers` 中查看。

### Claude Code

将下面命令中的占位符替换后运行：

```powershell
claude mcp add --transport stdio --scope user sendsoon -- npx -y @sendsoon/mcp
```

进入 Claude Code 后运行 `/mcp`，确认 `sendsoon` 已连接。需要使用 Key 时，在命令的 `sendsoon` 之前增加 `--env SENDSOON_API_KEY=<SENDSOON_API_KEY>`。

### Claude Desktop

打开 `Settings > Developer` 中的配置文件，加入：

```json
{
  "mcpServers": {
    "sendsoon": {
      "command": "npx",
      "args": ["-y", "@sendsoon/mcp"],
      "env": {
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
| Arguments | `-y @sendsoon/mcp` |
| Environment | 上方列出的环境变量 |

安装完成后，重启客户端并在新对话中用自然语言发起任务。第一次调用工具时，客户端可能要求确认授权，选择允许即可。

## 日常使用示例

```text
查询 8.8.8.8 的 IP 归属地和运营商。
```

```text
把 D:\docs\report.pdf 转换成 Markdown，并总结重点。
```

```text
给 user@example.com 发一封邮件，主题是“会议提醒”，正文是“今天下午三点开会”。
```

如果 Agent 没有自动选择工具，可以明确说：

```text
请调用 sendsoon MCP 完成这个任务。
```

## 在 Google Colab 中试用

免去本地环境配置，点击即可在浏览器中试用 `ip_lookup`、`markitdown_convert` 和 `send_email`。

[![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/sendsoon/mcp/blob/main/docs/SendSoon.ipynb)

该 Notebook 调用的是 MCP 工具背后同一套 SendSoon HTTP API，适合快速体验 API 行为。

---

## 本地可视化测试（MCP Inspector）

若想在安装到 AI 客户端之前，**在浏览器里直接看到三个工具并手动点击测试**，请使用 [MCP Inspector](https://github.com/modelcontextprotocol/inspector)。

需要 Node.js 20+。在终端运行下列命令之一，Inspector 会自动打开浏览器页面：

**npm（Node）版 SendSoon MCP：**

```bash
npx @modelcontextprotocol/inspector npx -y @sendsoon/mcp
```

**PyPI 版 SendSoon MCP：**

```bash
npx @modelcontextprotocol/inspector uvx sendsoon-mcp
```

### 操作步骤

1. 等待终端出现 `MCP Inspector Web is up and running`，浏览器会自动打开；若未打开，复制终端里的 `http://127.0.0.1:6274?...` 地址手动访问。
2. 确认页面顶部显示 **Connected**（已连接）。
3. 点击页面右上角的 **Tools** 标签。
4. 在左侧工具列表中选择要测试的工具，填写参数后点击 **Execute Tool**。
5. 在右侧 **Results** 面板查看返回结果；若失败，查看 `error.code` 与 `error.message`。

### 快速测试用例

**IP 归属查询（`ip_lookup`）**

| 参数 | 值 |
| --- | --- |
| `ip` | `8.8.8.8` |

**发送邮件（`send_email`）**

| 参数 | 值 |
| --- | --- |
| `to` | 你的邮箱 |
| `subject` | `SendSoon MCP 测试` |
| `body` | `配置成功` |

未配置 `SENDSOON_API_KEY` 时，同一公网 IP 每天最多 3 封免费测试邮件。

**文件转 Markdown（`markitdown_convert`）**

| 参数 | 值 |
| --- | --- |
| `file_path` | 本地文件绝对路径，例如 `D:\docs\report.pdf` |

支持：`.pdf` `.docx` `.pptx` `.xlsx` `.xls` `.txt` `.md` `.html` `.htm`。不支持图片（`.png`、`.jpg` 等）和直接 URL；网页请先另存为 `.html` 再传入路径。

测试完成后，在终端按 `Ctrl+C` 停止 Inspector。

## License

See [LICENSE](LICENSE).
