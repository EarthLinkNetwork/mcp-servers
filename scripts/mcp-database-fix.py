#!/usr/bin/env python3

import os
import sys
import subprocess

def install_and_import(package):
    try:
        if package == 'python-dotenv':
            import dotenv
        else:
            __import__(package)
    except ImportError:
        print(f"Installing {package}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        if package == 'python-dotenv':
            import dotenv
        else:
            __import__(package)

# 必要なパッケージをインストール
install_and_import('supabase')
install_and_import('python-dotenv')

from supabase import create_client
import json

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

def add_created_by_column():
    """MCPを使ってcreated_byカラムを追加"""
    
    print("🔧 MCP経由でSupabaseデータベースを修正中...")
    
    # 環境変数を読み込み
    supabase_url, service_key = load_env_vars()
    
    if not supabase_url or not service_key:
        print("❌ 環境変数が設定されていません")
        return False
    
    print(f"📡 Supabase URL: {supabase_url}")
    print(f"🔑 Service Key: {'*' * (len(service_key) - 4) + service_key[-4:]}")
    
    try:
        # Supabaseクライアント作成
        supabase = create_client(supabase_url, service_key)
        
        # まず現在のテーブル構造を確認
        print("🔍 現在のmcp_serversテーブル構造を確認中...")
        
        try:
            # 簡単な検索でテーブルアクセステスト
            result = supabase.table('mcp_servers').select('*').limit(1).execute()
            print("✅ テーブルアクセス成功")
            
            # データの一部を表示
            if result.data:
                print("📊 サンプルデータ:", list(result.data[0].keys()))
            
        except Exception as e:
            print(f"❌ テーブルアクセスエラー: {e}")
            return False
        
        # created_byカラムが存在するかチェック
        print("🔍 created_byカラムの存在確認...")
        
        try:
            # created_byカラムを含むクエリを試行
            test_result = supabase.table('mcp_servers').select('created_by').limit(1).execute()
            print("✅ created_byカラムは既に存在します！")
            return True
            
        except Exception as e:
            if 'column "created_by" does not exist' in str(e):
                print("❌ created_byカラムが存在しません")
                
                # カラム追加を試行
                print("🔧 created_byカラムを追加中...")
                
                # SQLを使用してカラム追加
                sql_commands = [
                    "ALTER TABLE mcp_servers ADD COLUMN created_by UUID REFERENCES auth.users(id);",
                    "DROP POLICY IF EXISTS \"Authenticated users can insert servers\" ON mcp_servers;",
                    "CREATE POLICY \"Authenticated users can insert servers\" ON mcp_servers FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);"
                ]
                
                for sql in sql_commands:
                    try:
                        print(f"📝 実行中: {sql[:50]}...")
                        # 直接SQLを実行する代替方法を試行
                        result = supabase.rpc('execute_sql', {'query': sql}).execute()
                        print("✅ SQL実行成功")
                    except Exception as sql_error:
                        print(f"⚠️ SQL実行エラー: {sql_error}")
                        # RPC関数が存在しない場合の処理
                        continue
                
                # 再度カラム存在確認
                try:
                    verify_result = supabase.table('mcp_servers').select('created_by').limit(1).execute()
                    print("✅ created_byカラム追加成功！")
                    return True
                except Exception as verify_error:
                    print(f"❌ カラム追加後の確認失敗: {verify_error}")
                    return False
                    
            else:
                print(f"❌ 予期しないエラー: {e}")
                return False
    
    except Exception as e:
        print(f"❌ Supabase接続エラー: {e}")
        return False

if __name__ == "__main__":
    success = add_created_by_column()
    
    if success:
        print("\n🎉 データベース修正完了！")
        print("🚀 アプリケーションでMCPサーバーの追加を試してください。")
    else:
        print("\n💥 自動修正失敗")
        print("🛠️ 手動でSupabaseダッシュボードから修正が必要です。")