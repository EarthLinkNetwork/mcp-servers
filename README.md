# MCP Hub - MCP Server Configuration Manager

MCP設定自動化ツール - MCPサーバーの設定を簡単に生成・管理するWebサービス

## 概要

MCP Hubは、Model Context Protocol (MCP) サーバーの設定を簡単に生成・管理できるWebサービスです。
複数のMCPサーバーを検索し、カートに追加して、Claude Code、Cursor、VS Code用の設定ファイルを自動生成できます。

## 機能

- 🔍 MCPサーバーの検索とカテゴリー別表示
- 🛒 カート機能で複数サーバーを選択
- ⚙️ 各エディター用の設定ファイル自動生成
  - Claude Code (.claude.json)
  - Cursor (.cursor/claude_mcp_config.json)
  - VS Code (settings.json)
- 📋 環境変数テンプレート(.env.template)の生成
- 👥 ユーザーによるMCPサーバーの登録・管理

## セットアップ

### 必要な環境

- Node.js 18以上
- Supabaseアカウント

### インストール

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.local.example .env.local
# .env.localファイルを編集して、SupabaseのURLとキーを設定
```

### Supabaseデータベースのセットアップ

1. Supabaseプロジェクトを作成
2. SQLエディターで以下のファイルを実行:
   - `supabase/schema.sql` - テーブルとRLSポリシーの作成
   - `supabase/seed.sql` - 初期データの投入

### 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアプリケーションにアクセスできます。

## 技術スタック

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **State Management**: Zustand
- **Icons**: Lucide React

## プロジェクト構造

```
src/
├── app/              # Next.js App Router
├── components/       # Reactコンポーネント
├── lib/             # ユーティリティ関数
├── store/           # Zustand store
└── types/           # TypeScript型定義
```

## 貢献

プルリクエストを歓迎します。大きな変更を行う場合は、まずイシューを作成して変更内容について議論してください。

## ライセンス

MIT
