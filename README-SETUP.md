# MCP Hub Setup Instructions

このMCPサーバー設定自動化ツールのセットアップ手順です。

## 必要な手動設定

### 1. Supabaseダッシュボードでのデータベース設定

自動化スクリプトの制限により、以下のSQLをSupabaseダッシュボードで手動実行する必要があります：

1. [Supabaseダッシュボード](https://supabase.com/dashboard) にアクセス
2. プロジェクトを選択
3. 左側のメニューから「SQL Editor」を選択
4. 以下のSQLを実行：

```sql
-- Add created_by column to mcp_servers table
ALTER TABLE mcp_servers ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Update RLS policies for mcp_servers
DROP POLICY IF EXISTS "Authenticated users can insert servers" ON mcp_servers;
CREATE POLICY "Authenticated users can insert servers" ON mcp_servers
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update own servers" ON mcp_servers;
CREATE POLICY "Users can update own servers" ON mcp_servers
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete own servers" ON mcp_servers;
CREATE POLICY "Users can delete own servers" ON mcp_servers
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = created_by);
```

### 2. 環境変数の設定

`.env.local` ファイルに以下を設定：

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. 依存関係のインストールと起動

```bash
npm install
npm run dev
```

## スキーマ検証

データベース設定が正しく完了したかを確認：

```bash
npm run verify:schema
```

## 機能

- MCPサーバーの検索とカテゴリフィルタ
- サーバーのカート機能
- Claude Code、Cursor、VS Code用の設定ファイル生成
- ユーザー認証と新しいMCPサーバーの登録
- 環境変数テンプレート生成

## 使用方法

1. ブラウザで `http://localhost:4331` にアクセス
2. MCPサーバーを検索・選択してカートに追加
3. 「Generate Config」で設定ファイルを生成
4. 認証後、新しいサーバーを登録可能

## トラブルシューティング

### "new row violates row-level security policy"

上記のSQL手動実行を行ってください。

### "column 'created_by' does not exist"

1. Supabaseダッシュボードで上記SQLを実行
2. `npm run verify:schema` で確認
3. アプリケーションを再起動