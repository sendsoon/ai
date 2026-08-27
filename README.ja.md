# SendSoon AI MCP

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md)

SendSoon MCP は [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) サーバーです。Codex および Claude から [SendSoon](https://sendsoonai.com/) のメール送信、IP 検索、ローカル文書の Markdown 変換を利用できます。

一度設定すれば、あとは自然言語で依頼するだけです。通常、毎回 SendSoon を指定する必要はありません。

## できること

| ツール | 用途 | 例 |
| --- | --- | --- |
| `send_email` | メールを1通送信 | 「テストメールを送って」 |
| `ip_lookup` | パブリック IP 情報を検索 | 「8.8.8.8 の所在地を調べて」 |
| `markitdown_convert` | ローカル文書を Markdown に変換 | 「この PDF を Markdown に変換して」 |

## 普段の使い方

```text
user@example.com に件名「会議のリマインダー」、本文「本日15時から会議です。」のメールを送信してください。
```

```text
8.8.8.8 の所在地と ISP を調べてください。
```

```text
/path/to/report.pdf を Markdown に変換し、要点をまとめてください。
```

エージェントが自動的にツールを選択しない場合は、次のように指定します：

```text
sendsoon MCP を使ってこのタスクを完了してください。
```

## AI クライアントへのインストール

以下は **Codex** と **Claude Desktop** 向けです。

### Codex

**設定ファイル：** ユーザー単位の `~/.codex/config.toml`（macOS / Linux）または `%USERPROFILE%\.codex\config.toml`（Windows）。

```toml
[mcp_servers.sendsoon]
command = "npx"
args = ["-y", "@sendsoon/mcp"]

[mcp_servers.sendsoon.env]
SENDSOON_API_KEY = ""
```

**確認：** 保存後に Codex を再起動し、チャットで `/mcp` を実行して `sendsoon` が接続されていることを確認します。デスクトップ版では `Settings > MCP servers` でも確認できます。

**初回利用：** 新しい会話で簡単なタスク（例：「8.8.8.8 の IP 情報を調べて」）を依頼します。ツール許可を求められたら許可してください。

### Claude Desktop

**設定ファイル：**

| OS | パス |
| --- | --- |
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |

Claude Desktop 内の `Settings > Developer > Edit Config` から直接編集することもできます。

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

**確認：** 保存後、**完全に終了**して Claude Desktop を再起動します（トレイアイコンも終了）。新しい会話を開始し、tools メニューまたは設定で `sendsoon` が利用可能か確認します。

**初回利用：** 初回のツール実行時にアクセス許可を求められる場合があります。許可して続行してください。

## 設定値を準備

任意の環境変数：

| 設定項目 | 必須 | 入力する値 |
| --- | --- | --- |
| `SENDSOON_API_KEY` | いいえ | 未登録で試す場合は空欄。同じパブリック IP から1日3通まで無料でテスト送信できます。継続利用する場合は生成した Key を入力 |

実際の Key を Git にコミットしたり、他人と共有したりしないでください。

### API Key の取得

1. [SendSoon 登録ページ](https://sendsoonai.com/login-register)で登録またはログインします。
2. [プロフィール](https://sendsoonai.com/profile)を開き、API Key セクションで Key を生成します。
3. 一度だけ表示される `ssk_live_...` Key をすぐにコピーし、MCP 設定の `SENDSOON_API_KEY` に入力します。
4. 設定を保存して MCP クライアントを再起動します。有効な Key を使ったリクエストは匿名 IP の1日あたりの上限を消費しません。

匿名枠を使い切った場合、`send_email` は登録と Key 設定を案内します。無効または取り消された Key は拒否され、匿名枠には自動的に切り替わりません。

## Google Colab で試す

ローカル環境のセットアップなしで、ブラウザから `ip_lookup`、`markitdown_convert`、`send_email` を試せます。

[![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/sendsoon/mcp/blob/main/docs/SendSoon.ipynb)

このノートブックは MCP ツールと同じ SendSoon HTTP API を呼び出します。

---

## ローカル可視化テスト（MCP Inspector）

AI クライアントにインストールする前に、**ブラウザ上で3つのツールを表示して手動で試す**には [MCP Inspector](https://github.com/modelcontextprotocol/inspector) を使います。

Node.js 20 以降が必要です。ターミナルで次のコマンドを実行すると、Web UI が自動的に開きます：

```bash
npx @modelcontextprotocol/inspector npx -y @sendsoon/mcp
```

### 操作手順

1. ターミナルに `MCP Inspector Web is up and running` と表示されるまで待ちます。ブラウザが開かない場合は、表示された `http://127.0.0.1:6274?...` URL を開きます。
2. ページ上部が **Connected** になっていることを確認します。
3. ページ右上の **Tools** タブを開きます。
4. 左側のツール一覧からツールを選び、パラメータを入力して **Execute Tool** をクリックします。
5. 右側の **Results** パネルで結果を確認します。失敗時は `error.code` と `error.message` を確認します。

## License

See [LICENSE](LICENSE).
