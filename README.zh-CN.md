# SendSoon AI MCP

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md)

SendSoon MCP 是一个 [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) 服务端，让 Codex、Claude 等 AI Agent 调用 [SendSoon](https://sendsoonai.com/) 的能力：发邮件、查 IP、把本地文档转成 Markdown。

配置一次后，直接用自然语言描述任务即可，通常不需要每次强调“使用 SendSoon”。

## 可以做什么

| 工具 | 用途 | 示例 |
| --- | --- | --- |
| `send_email` | 发送单封邮件 | “给我发一封测试邮件” |
| `ip_lookup` | 查询公网 IP 信息 | “查询 8.8.8.8 的归属地” |
| `markitdown_convert` | 将本地文档转换成 Markdown | “把这份 PDF 转成 Markdown” |

## 安装到 AI 客户端

以下说明适用于 **Codex** 与 **Claude Desktop**。

### Codex

**配置文件：** 用户级 `~/.codex/config.toml`（macOS / Linux）或 `%USERPROFILE%\.codex\config.toml`（Windows）。

```toml
[mcp_servers.sendsoon]
command = "npx"
args = ["-y", "@sendsoon/mcp"]

[mcp_servers.sendsoon.env]
SENDSOON_API_KEY = ""
```

**验证：** 保存后重启 Codex，在对话中输入 `/mcp`，应看到 `sendsoon` 已连接。桌面版也可在 `Settings > MCP servers` 查看状态。

**首次调用：** 新对话中让 Agent 执行一次简单任务（如「查询 8.8.8.8 的 IP 信息」）。若弹出工具授权提示，选择允许。

### Claude Desktop

**配置文件：**

| 系统 | 路径 |
| --- | --- |
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |

也可在 Claude Desktop 中打开 `Settings > Developer > Edit Config` 直接编辑。

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

**验证：** 保存后**完全退出** Claude Desktop（托盘图标也需退出），再重新启动。新建对话，在输入框旁的 tools 图标或设置中确认 `sendsoon` 工具可用。

**首次调用：** 第一次触发工具时，Claude 可能询问是否允许访问；选择允许后继续。

## 准备配置

可选环境变量：

| 配置项 | 是否必填 | 如何填写 |
| --- | --- | --- |
| `SENDSOON_API_KEY` | 否 | 未注册体验时可留空；同一公网 IP 每天最多免费发送 3 封测试邮件。继续使用时请填写注册后生成的 Key |

请勿将真实 Key 提交到 Git 或分享给其他人。

### 获取 API Key

1. 在 [SendSoon 注册页](https://sendsoonai.com/login-register) 注册并登录。
2. 打开 [个人设置](https://sendsoonai.com/profile)，在 API Key 区域生成一个 Key。
3. 立即复制仅展示一次的 `ssk_live_...` Key，并将它填入 MCP 配置的 `SENDSOON_API_KEY`。
4. 保存配置并重启 MCP 客户端。带有效 Key 的请求不会消耗匿名 IP 的每日 3 次额度。

如果匿名额度已经用完，`send_email` 会返回注册与配置 Key 的提示；配置无效或已撤销的 Key 会被拒绝，不会自动退回匿名额度。

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

需要 Node.js 20+。在终端运行下列命令，Inspector 会自动打开浏览器页面：

```bash
npx @modelcontextprotocol/inspector npx -y @sendsoon/mcp
```

### 操作步骤

1. 等待终端出现 `MCP Inspector Web is up and running`，浏览器会自动打开；若未打开，复制终端里的 `http://127.0.0.1:6274?...` 地址手动访问。
2. 确认页面顶部显示 **Connected**（已连接）。
3. 点击页面右上角的 **Tools** 标签。
4. 在左侧工具列表中选择要测试的工具，填写参数后点击 **Execute Tool**。
5. 在右侧 **Results** 面板查看返回结果；若失败，查看 `error.code` 与 `error.message`。

## License

See [LICENSE](LICENSE).
