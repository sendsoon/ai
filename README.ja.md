# SendSoon AI MCP

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md)

Codex、Claude、Cursor などの AI エージェントから、[SendSoon](https://sendsoonai.com/) のメール送信、IP 検索、ファイルの Markdown 変換機能を利用できます。

一度設定すれば、あとは自然言語で依頼するだけです。通常、毎回 SendSoon を指定する必要はありません。

## できること

| ツール | 用途 | 例 |
| --- | --- | --- |
| `send_email` | メールを1通送信 | 「テストメールを送って」 |
| `ip_lookup` | パブリック IP 情報を検索 | 「8.8.8.8 の所在地を調べて」 |
| `markitdown_convert` | ファイルを Markdown に変換 | 「この PDF を Markdown に変換して」 |

## ステップ1：インストール

必要なもの：

- Node.js 20 以降
- pnpm 11
- Codex、Claude、Cursor、またはローカル stdio MCP サーバーに対応したクライアント

ターミナルで次を実行します：

```powershell
git clone https://github.com/sendsoon/ai.git
cd ai
pnpm install
pnpm run build
```

ビルドが完了したら、MCP エントリーファイルの絶対パスを取得します。

Windows PowerShell：

```powershell
(Resolve-Path .\mcp\dist\index.js).Path.Replace('\', '/')
```

macOS / Linux：

```bash
realpath ./mcp/dist/index.js
```

出力されたパスをコピーし、設定内の `<MCP_ENTRY_PATH>` と置き換えます。`ai` フォルダーではなく `index.js` ファイルまで含む完全なパスを指定し、`<MCP_ENTRY_PATH>` をそのまま残さないでください。

たとえば、出力が次の場合：

```text
C:/Users/your-name/ai/mcp/dist/index.js
```

設定の次の部分を：

```json
"args": ["<MCP_ENTRY_PATH>"]
```

次のように変更します：

```json
"args": ["C:/Users/your-name/ai/mcp/dist/index.js"]
```

macOS / Linux でも同様です：

```json
"args": ["/Users/your-name/ai/mcp/dist/index.js"]
```

## ステップ2：設定値を準備

すべてのクライアントで同じ3つの環境変数を使用します：

| 設定項目 | 入力する値 |
| --- | --- |
| `SENDSOON_API_BASE_URL` | `https://sendsoonai.com` のまま使用 |
| `SENDSOON_EMAIL_RECIPIENT` | `<YOUR_EMAIL>` を受信先メールアドレスに置換 |
| `SENDSOON_API_KEY` | 未登録で試す場合は空欄。同じパブリック IP から1日3通まで無料でテスト送信できます。継続利用する場合は生成した Key を入力 |

実際の Key を Git にコミットしたり、他人と共有したりしないでください。

### API Key の取得

1. [SendSoon 登録ページ](https://sendsoonai.com/login-register)で登録またはログインします。
2. [プロフィール](https://sendsoonai.com/profile)を開き、API Key セクションで Key を生成します。
3. 一度だけ表示される `ssk_live_...` Key をすぐにコピーし、MCP 設定の `SENDSOON_API_KEY` に入力します。
4. 設定を保存して MCP クライアントを再起動します。有効な Key を使ったリクエストは匿名 IP の1日あたりの上限を消費しません。

匿名枠を使い切った場合、`send_email` は登録と Key 設定を案内します。無効または取り消された Key は拒否され、匿名枠には自動的に切り替わりません。

## ステップ3：クライアントを選択

### Cursor

Cursor の `Settings > Tools & MCP` を開いて MCP Server を追加します。次の内容をプロジェクトの `.cursor/mcp.json` またはユーザーディレクトリの `~/.cursor/mcp.json` に保存することもできます：

```json
{
  "mcpServers": {
    "sendsoon": {
      "command": "node",
      "args": ["<MCP_ENTRY_PATH>"],
      "env": {
        "SENDSOON_API_BASE_URL": "https://sendsoonai.com",
        "SENDSOON_EMAIL_RECIPIENT": "<YOUR_EMAIL>",
        "SENDSOON_API_KEY": ""
      }
    }
  }
}
```

トップレベルの `mcpServers` は1つだけにしてください。保存後に Cursor を再起動し、`sendsoon` が有効になっていることを確認します。

### Codex

ユーザー設定ファイル `~/.codex/config.toml` を開き、次を追加します：

```toml
[mcp_servers.sendsoon]
command = "node"
args = ["<MCP_ENTRY_PATH>"]

[mcp_servers.sendsoon.env]
SENDSOON_API_BASE_URL = "https://sendsoonai.com"
SENDSOON_EMAIL_RECIPIENT = "<YOUR_EMAIL>"
SENDSOON_API_KEY = ""
```

保存後に Codex を再起動し、`/mcp` で `sendsoon` が接続されていることを確認します。デスクトップ版では `Settings > MCP servers` からも確認できます。

### Claude Code

2つのプレースホルダーを置き換えて実行します：

```powershell
claude mcp add --transport stdio --scope user --env SENDSOON_API_BASE_URL=https://sendsoonai.com --env SENDSOON_EMAIL_RECIPIENT=<YOUR_EMAIL> sendsoon -- node "<MCP_ENTRY_PATH>"
```

Claude Code で `/mcp` を実行し、`sendsoon` が接続されていることを確認します。API Key を使用する場合は、サーバー名 `sendsoon` の前に `--env SENDSOON_API_KEY=<SENDSOON_API_KEY>` を追加します。

### Claude Desktop

`Settings > Developer` から設定ファイルを開き、次を追加します：

```json
{
  "mcpServers": {
    "sendsoon": {
      "command": "node",
      "args": ["<MCP_ENTRY_PATH>"],
      "env": {
        "SENDSOON_API_BASE_URL": "https://sendsoonai.com",
        "SENDSOON_EMAIL_RECIPIENT": "<YOUR_EMAIL>",
        "SENDSOON_API_KEY": ""
      }
    }
  }
}
```

保存後、Claude Desktop を完全に終了して再起動し、ツール一覧に `sendsoon` が表示されることを確認します。

### その他の MCP クライアント

Windsurf、Cline、Continue など、ローカル stdio MCP サーバーに対応したクライアントでは、次を入力します：

| 設定 | 値 |
| --- | --- |
| Transport | `stdio` |
| Command | `node` |
| Arguments | `<MCP_ENTRY_PATH>` |
| Environment | 上記3つの環境変数 |

## 接続を確認

クライアントを再起動して新しい会話を開き、次のように入力します：

```text
8.8.8.8 の所在地と ISP を調べてください。
```

エージェントが `ip_lookup` を呼び出して結果を返せば、MCP は正常に接続されています。

メールを確認する場合は、次のように入力します：

```text
<YOUR_EMAIL> に件名「SendSoon MCP テスト」、本文「設定に成功しました。」のテストメールを送信してください。
```

メールアドレスは `SENDSOON_EMAIL_RECIPIENT` と完全に一致する必要があります。初回のツール実行時にクライアントが許可を求める場合は、許可して続行してください。

## 普段の使い方

```text
1.1.1.1 の IP 情報を調べてください。
```

```text
<YOUR_FILE_PATH> を Markdown に変換し、要点をまとめてください。
```

```text
<YOUR_EMAIL> に件名「会議のリマインダー」、本文「本日15時から会議です。」のメールを送信してください。
```

エージェントが自動的にツールを選択しない場合は、次のように指定します：

```text
sendsoon MCP を使ってこのタスクを完了してください。
```

通常、この明示的な指定が必要なのは初回だけです。

## 公式リファレンス

- [SendSoon 公式サイト](https://sendsoonai.com/)
- [OpenAI Codex：Model Context Protocol](https://developers.openai.com/codex/mcp)
- [Anthropic：Claude Code MCP](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [Cursor：Model Context Protocol](https://docs.cursor.com/context/model-context-protocol)
- [Model Context Protocol](https://modelcontextprotocol.io/)

## License

See [LICENSE](LICENSE).
