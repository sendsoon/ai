# SendSoon AI

面向 [SendSoon](https://sendsoonai.com/) 的 **MCP + Agent Skill** 公开适配层，让 Cursor、Claude Code 等 AI Agent 调用 SendSoon 能力。

## 关于 SendSoon

[SendSoon](https://sendsoonai.com/) 专注 **Brand Overseas Email（品牌出海邮件）** 与 **AI Agent** 开发，提供高送达率海外邮件基础设施与 Agent 自动化能力。

当前平台已开放（或正在开放）的主要能力包括：


| 能力             | 说明                                       | 入口                                                             |
| -------------- | ---------------------------------------- | -------------------------------------------------------------- |
| **邮局服务**       | 海外邮件发送、送达监控、域名预热等                        | [sendsoonai.com](https://sendsoonai.com/)                      |
| **IP Lookup**  | 公网 IP 与地理位置查询                            | [sendsoonai.com/ip-lookup](https://sendsoonai.com/ip-lookup)   |
| **MarkItDown** | 多格式文件转 Markdown（PDF / Office / 图片 / 音频等） | [sendsoonai.com/markitdown](https://sendsoonai.com/markitdown) |


本仓库职责：为上述能力提供 **MCP tool** 与 **SKILL.md** 封装，供 Agent 与用户调用；核心逻辑在 SendSoon 私有 API（`https://api.sendsoonai.com`），此处仅做协议适配与请求转发。

## 已实现（P0）

- `send_email` — 单封邮件发送
- `ip_lookup` — 公网 IP 归属地 / ISP 查询
- `markitdown_convert` — 文件（PDF/Office/图片/音频等）转 Markdown
- `skills/email-basics/` — 触发词「发邮件」「send email」
- `skills/ip-lookup/` — 触发词「查IP」「IP 归属地」
- `skills/markitdown/` — 触发词「转 Markdown」「文件转文本」

后续将按业务优先级扩展更多 tool（红人匹配、批量触达等）。

## 目录结构

```text
core/     协议无关 HTTP client（超时、重试、错误映射）
mcp/      TypeScript MCP server
skills/   Agent Skill 文档
```



## 快速开始



### 1. 环境变量

```bash
cp .env.example .env
export SENDSOON_API_KEY="YOUR_API_KEY"
```



### 2. 安装与构建

```bash
cd core && npm install && npm run build
cd ../mcp && npm install && npm run build
```



### 3. 启动 MCP Server（stdio）

```bash
cd mcp && npm start
```



### 4. MCP Inspector 调试

```bash
npx @modelcontextprotocol/inspector node mcp/dist/index.js
```



## Cursor 配置示例

```json
{
  "mcpServers": {
    "sendsoon": {
      "command": "node",
      "args": ["D:/path/to/ai/mcp/dist/index.js"],
      "env": {
        "SENDSOON_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```



## License

See [LICENSE](LICENSE).