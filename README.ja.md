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

## Google Colab で試す

ローカル環境のセットアップなしで、ブラウザから `ip_lookup`、`markitdown_convert`、`send_email` を試せます。

[![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/sendsoon/mcp/blob/main/docs/SendSoon.ipynb)

このノートブックは、MCP ツールと同じ SendSoon HTTP API を呼び出します。Cursor、Claude、Codex から使う場合は、この後のローカル MCP 設定を続けてください。

## MCP のインストール

**npm（Node）** または **PyPI（Python）** を選べます。ツール名と環境変数は共通です。

### npm（Node）

[`@sendsoon/mcp`](https://www.npmjs.com/package/@sendsoon/mcp) として公開されています。クライアントは `npx` で起動できます（初回にダウンロード）：

```bash
npx -y @sendsoon/mcp
```

任意のグローバルインストール：

```bash
npm install -g @sendsoon/mcp
sendsoon-mcp
```

要件：Node.js 20 以降。

### PyPI（Python）

[`sendsoon-mcp`](https://pypi.org/project/sendsoon-mcp/) として公開されています。グローバルインストール不要の `uvx` を推奨します：

```bash
uvx sendsoon-mcp
```

または：

```bash
pip install sendsoon-mcp
sendsoon-mcp
```

要件：Python 3.10 以降。詳細は [`python/README.md`](python/README.md)。

## 設定値を準備

すべてのクライアントで同じ環境変数を使用します：

| 設定項目 | 必須 | 入力する値 |
| --- | --- | --- |
| `SENDSOON_EMAIL_RECIPIENT` | はい | `<YOUR_EMAIL>` を受信先メールアドレスに置換 |
| `SENDSOON_API_KEY` | いいえ | 未登録で試す場合は空欄。同じパブリック IP から1日3通まで無料でテスト送信できます。継続利用する場合は生成した Key を入力 |
| `SENDSOON_API_BASE_URL` | いいえ | 既定値は `https://www.sendsoonai.com`。別環境に接続する場合のみ設定 |

実際の Key を Git にコミットしたり、他人と共有したりしないでください。

### API Key の取得

1. [SendSoon 登録ページ](https://sendsoonai.com/login-register)で登録またはログインします。
2. [プロフィール](https://sendsoonai.com/profile)を開き、API Key セクションで Key を生成します。
3. 一度だけ表示される `ssk_live_...` Key をすぐにコピーし、MCP 設定の `SENDSOON_API_KEY` に入力します。
4. 設定を保存して MCP クライアントを再起動します。有効な Key を使ったリクエストは匿名 IP の1日あたりの上限を消費しません。

匿名枠を使い切った場合、`send_email` は登録と Key 設定を案内します。無効または取り消された Key は拒否され、匿名枠には自動的に切り替わりません。

## クライアントを選択

### Cursor

Cursor の `Settings > Tools & MCP` を開いて MCP Server を追加します。次の内容をプロジェクトの `.cursor/mcp.json` またはユーザーディレクトリの `~/.cursor/mcp.json` に保存することもできます。

**Node（npm）：**

```json
{
  "mcpServers": {
    "sendsoon": {
      "command": "npx",
      "args": ["-y", "@sendsoon/mcp"],
      "env": {
        "SENDSOON_EMAIL_RECIPIENT": "<YOUR_EMAIL>",
        "SENDSOON_API_KEY": ""
      }
    }
  }
}
```

**Python（PyPI）：**

```json
{
  "mcpServers": {
    "sendsoon": {
      "command": "uvx",
      "args": ["sendsoon-mcp"],
      "env": {
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
command = "npx"
args = ["-y", "@sendsoon/mcp"]

[mcp_servers.sendsoon.env]
SENDSOON_EMAIL_RECIPIENT = "<YOUR_EMAIL>"
SENDSOON_API_KEY = ""
```

保存後に Codex を再起動し、`/mcp` で `sendsoon` が接続されていることを確認します。デスクトップ版では `Settings > MCP servers` からも確認できます。

### Claude Code

プレースホルダーを置き換えて実行します：

```powershell
claude mcp add --transport stdio --scope user --env SENDSOON_EMAIL_RECIPIENT=<YOUR_EMAIL> sendsoon -- npx -y @sendsoon/mcp
```

Claude Code で `/mcp` を実行し、`sendsoon` が接続されていることを確認します。API Key を使用する場合は、サーバー名 `sendsoon` の前に `--env SENDSOON_API_KEY=<SENDSOON_API_KEY>` を追加します。

### Claude Desktop

`Settings > Developer` から設定ファイルを開き、次を追加します：

```json
{
  "mcpServers": {
    "sendsoon": {
      "command": "npx",
      "args": ["-y", "@sendsoon/mcp"],
      "env": {
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
| Command | `npx` |
| Arguments | `-y @sendsoon/mcp` |
| Environment | 上記の環境変数 |

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

## Agent Skills をインストール

Skills は、各 MCP ツールをいつ呼び出すか、エラーコードをどう扱うかをエージェントに教えます。先に MCP を入れ、その後 Skills を追加してください。

### Claude Code（プラグイン）

```text
/plugin marketplace add sendsoon/mcp
/plugin install sendsoon-skills@sendsoon
```

### Cursor / Claude（フォルダーをコピー）

[`skills/`](skills) 配下のフォルダーを、次のパスにコピーします：

| クライアント | プロジェクト | ユーザー |
| --- | --- | --- |
| Cursor | `.cursor/skills/<name>/` | `~/.cursor/skills/<name>/` |
| Claude Code | `.claude/skills/<name>/` | `~/.claude/skills/<name>/` |

利用可能な Skills：`email-basics`、`ip-lookup`、`markitdown`。

## License

See [LICENSE](LICENSE).
