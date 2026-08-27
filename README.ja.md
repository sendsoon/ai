# SendSoon AI MCP

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md)

SendSoon MCP は [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) サーバーです。Codex、Claude、Cursor などの AI エージェントから [SendSoon](https://sendsoonai.com/) のメール送信、IP 検索、ローカル文書の Markdown 変換を利用できます。

一度設定すれば、あとは自然言語で依頼するだけです。通常、毎回 SendSoon を指定する必要はありません。

## できること

| ツール | 用途 | 例 |
| --- | --- | --- |
| `send_email` | メールを1通送信 | 「テストメールを送って」 |
| `ip_lookup` | パブリック IP 情報を検索 | 「8.8.8.8 の所在地を調べて」 |
| `markitdown_convert` | ローカル文書を Markdown に変換 | 「この PDF を Markdown に変換して」 |

## パッケージ

**npm（Node）** または **PyPI（Python）** を MCP ランタイムとして選びます。ツール名と環境変数は共通です。

| チャネル | パッケージ | 要件 |
| --- | --- | --- |
| npm | [`@sendsoon/mcp`](https://www.npmjs.com/package/@sendsoon/mcp) | Node.js 20 以降 |
| PyPI | [`sendsoon-mcp`](https://pypi.org/project/sendsoon-mcp/) | Python 3.10 以降。詳細は [`pypi/README.md`](pypi/README.md) |

クライアント設定では `npx -y @sendsoon/mcp` または `uvx sendsoon-mcp` でサーバーを起動します。グローバルインストールは任意です。

## 設定値を準備

すべてのクライアントで同じ環境変数を使用します：

| 設定項目 | 必須 | 入力する値 |
| --- | --- | --- |
| `SENDSOON_API_KEY` | いいえ | 未登録で試す場合は空欄。同じパブリック IP から1日3通まで無料でテスト送信できます。継続利用する場合は生成した Key を入力 |
| `SENDSOON_API_BASE_URL` | いいえ | 既定値は `https://www.sendsoonai.com`。別環境に接続する場合のみ設定 |

実際の Key を Git にコミットしたり、他人と共有したりしないでください。

### API Key の取得

1. [SendSoon 登録ページ](https://sendsoonai.com/login-register)で登録またはログインします。
2. [プロフィール](https://sendsoonai.com/profile)を開き、API Key セクションで Key を生成します。
3. 一度だけ表示される `ssk_live_...` Key をすぐにコピーし、MCP 設定の `SENDSOON_API_KEY` に入力します。
4. 設定を保存して MCP クライアントを再起動します。有効な Key を使ったリクエストは匿名 IP の1日あたりの上限を消費しません。

匿名枠を使い切った場合、`send_email` は登録と Key 設定を案内します。無効または取り消された Key は拒否され、匿名枠には自動的に切り替わりません。

## AI クライアントへのインストール

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

トップレベルの `mcpServers` は1つだけにしてください。保存後に Cursor を再起動し、`sendsoon` が有効になっていることを確認します。

### Codex

ユーザー設定ファイル `~/.codex/config.toml` を開き、次を追加します：

```toml
[mcp_servers.sendsoon]
command = "npx"
args = ["-y", "@sendsoon/mcp"]

[mcp_servers.sendsoon.env]
SENDSOON_API_KEY = ""
```

保存後に Codex を再起動し、`/mcp` で `sendsoon` が接続されていることを確認します。デスクトップ版では `Settings > MCP servers` からも確認できます。

### Claude Code

プレースホルダーを置き換えて実行します：

```powershell
claude mcp add --transport stdio --scope user sendsoon -- npx -y @sendsoon/mcp
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

インストール後、クライアントを再起動して新しい会話を開始します。初回のツール実行時に許可を求められる場合があります。

## 普段の使い方

```text
8.8.8.8 の所在地と ISP を調べてください。
```

```text
/path/to/report.pdf を Markdown に変換し、要点をまとめてください。
```

```text
user@example.com に件名「会議のリマインダー」、本文「本日15時から会議です。」のメールを送信してください。
```

エージェントが自動的にツールを選択しない場合は、次のように指定します：

```text
sendsoon MCP を使ってこのタスクを完了してください。
```

## Google Colab で試す

ローカル環境のセットアップなしで、ブラウザから `ip_lookup`、`markitdown_convert`、`send_email` を試せます。

[![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/sendsoon/mcp/blob/main/docs/SendSoon.ipynb)

このノートブックは MCP ツールと同じ SendSoon HTTP API を呼び出します。

---

## ローカル可視化テスト（MCP Inspector）

AI クライアントにインストールする前に、**ブラウザ上で3つのツールを表示して手動で試す**には [MCP Inspector](https://github.com/modelcontextprotocol/inspector) を使います。

Node.js 20 以降が必要です。ターミナルで次のいずれかを実行すると、Web UI が自動的に開きます：

**npm（Node）版 SendSoon MCP：**

```bash
npx @modelcontextprotocol/inspector npx -y @sendsoon/mcp
```

**PyPI 版 SendSoon MCP：**

```bash
npx @modelcontextprotocol/inspector uvx sendsoon-mcp
```

### 操作手順

1. ターミナルに `MCP Inspector Web is up and running` と表示されるまで待ちます。ブラウザが開かない場合は、表示された `http://127.0.0.1:6274?...` URL を開きます。
2. ページ上部が **Connected** になっていることを確認します。
3. ページ右上の **Tools** タブを開きます。
4. 左側のツール一覧からツールを選び、パラメータを入力して **Execute Tool** をクリックします。
5. 右側の **Results** パネルで結果を確認します。失敗時は `error.code` と `error.message` を確認します。

### クイックテスト

**IP 検索（`ip_lookup`）**

| パラメータ | 値 |
| --- | --- |
| `ip` | `8.8.8.8` |

**メール送信（`send_email`）**

| パラメータ | 値 |
| --- | --- |
| `to` | 自分のメールアドレス |
| `subject` | `SendSoon MCP test` |
| `body` | `Configuration successful` |

`SENDSOON_API_KEY` 未設定時、同一パブリック IP から1日3通まで無料でテスト送信できます。

**ファイルを Markdown に変換（`markitdown_convert`）**

| パラメータ | 値 |
| --- | --- |
| `file_path` | ローカルファイルの絶対パス（例：`/path/to/report.pdf`） |

対応：`.pdf` `.docx` `.pptx` `.xlsx` `.xls` `.txt` `.md` `.html` `.htm`。画像（`.png`、`.jpg` など）と直接 URL は非対応。Web ページは `.html` として保存してから指定してください。

終了時はターミナルで `Ctrl+C` を押します。

## License

See [LICENSE](LICENSE).
