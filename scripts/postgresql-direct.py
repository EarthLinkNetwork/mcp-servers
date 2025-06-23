#!/usr/bin/env python3

import os
import sys
import subprocess

def install_and_import(package):
    try:
        if package == 'psycopg2-binary':
            import psycopg2
        else:
            __import__(package)
    except ImportError:
        print(f"Installing {package}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        if package == 'psycopg2-binary':
            import psycopg2
        else:
            __import__(package)

# psycopg2をインストール
install_and_import('psycopg2-binary')

import psycopg2
from urllib.parse import urlparse

def load_env_vars():
    """環境変数を.env.localから読み込み"""
    env_path = '/Users/masa/dev/eln/mcp-servers/.env.local'
    
    if not os.path.exists(env_path):
        print(f"❌ {env_path} not found")
        return None, None
    
    env_vars = {}
    with open(env_path, 'r') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                key, value = line.strip().split('=', 1)
                env_vars[key] = value
    
    return env_vars.get('NEXT_PUBLIC_SUPABASE_URL'), env_vars.get('SUPABASE_SERVICE_ROLE_KEY')

def add_column_via_postgresql():
    """PostgreSQLに直接接続してカラムを追加"""
    
    print("🔧 PostgreSQL直接接続でcreated_byカラムを追加中...")
    
    # 環境変数を読み込み
    supabase_url, service_key = load_env_vars()
    
    if not supabase_url or not service_key:
        print("❌ 環境変数が設定されていません")
        return False
    
    # Supabase URLからプロジェクト参照を抽出
    parsed_url = urlparse(supabase_url)
    project_ref = parsed_url.hostname.split('.')[0]
    
    # PostgreSQL接続文字列を構築
    postgres_url = f"postgresql://postgres:{service_key}@db.{project_ref}.supabase.co:5432/postgres"
    
    print(f"🔌 PostgreSQL接続URL: postgresql://postgres:***@db.{project_ref}.supabase.co:5432/postgres")
    
    try:
        # PostgreSQLに接続
        conn = psycopg2.connect(postgres_url)
        cursor = conn.cursor()
        
        print("✅ PostgreSQL接続成功")
        
        # 現在のテーブル構造を確認
        print("🔍 現在のカラム一覧を取得中...")
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'mcp_servers'
            ORDER BY ordinal_position;
        """)
        
        columns = cursor.fetchall()
        print("📊 現在のカラム:")
        for col_name, col_type in columns:
            print(f"  - {col_name}: {col_type}")
        
        # created_byカラムが存在するかチェック
        column_names = [col[0] for col in columns]
        
        if 'created_by' in column_names:
            print("✅ created_byカラムは既に存在します！")
            cursor.close()
            conn.close()
            return True
        
        print("🔧 created_byカラムを追加中...")
        
        # カラムを追加
        cursor.execute("""
            ALTER TABLE mcp_servers 
            ADD COLUMN created_by UUID REFERENCES auth.users(id);
        """)
        
        print("✅ created_byカラム追加成功")
        
        # RLSポリシーを更新
        print("🔐 RLSポリシーを更新中...")
        
        # 既存のポリシーを削除
        cursor.execute("""
            DROP POLICY IF EXISTS "Authenticated users can insert servers" ON mcp_servers;
        """)
        
        cursor.execute("""
            DROP POLICY IF EXISTS "Users can update own servers" ON mcp_servers;
        """)
        
        cursor.execute("""
            DROP POLICY IF EXISTS "Users can delete own servers" ON mcp_servers;
        """)
        
        # 新しいポリシーを作成
        cursor.execute("""
            CREATE POLICY "Authenticated users can insert servers" ON mcp_servers
            FOR INSERT TO authenticated 
            WITH CHECK (auth.uid() = created_by);
        """)
        
        cursor.execute("""
            CREATE POLICY "Users can update own servers" ON mcp_servers
            FOR UPDATE TO authenticated 
            USING (auth.uid() = created_by);
        """)
        
        cursor.execute("""
            CREATE POLICY "Users can delete own servers" ON mcp_servers
            FOR DELETE TO authenticated 
            USING (auth.uid() = created_by);
        """)
        
        print("✅ RLSポリシー更新成功")
        
        # 変更をコミット
        conn.commit()
        
        print("💾 変更をコミット")
        
        # 最終確認
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'mcp_servers' AND column_name = 'created_by';
        """)
        
        result = cursor.fetchone()
        if result:
            print("✅ created_byカラムの存在を確認")
        else:
            print("❌ created_byカラムが見つかりません")
            return False
        
        cursor.close()
        conn.close()
        
        return True
        
    except psycopg2.Error as e:
        print(f"❌ PostgreSQLエラー: {e}")
        return False
    except Exception as e:
        print(f"❌ 予期しないエラー: {e}")
        return False

if __name__ == "__main__":
    success = add_column_via_postgresql()
    
    if success:
        print("\n🎉 データベース修正完了！")
        print("🚀 アプリケーションでMCPサーバーの追加を試してください。")
    else:
        print("\n💥 PostgreSQL直接接続も失敗")
        print("🛠️ Supabaseダッシュボードでの手動修正が必要です。")