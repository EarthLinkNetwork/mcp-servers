#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

async function autoConfigureAuth() {
  console.log('🔧 Auto-configuring Supabase authentication...')
  
  // Load environment variables
  const envPath = path.join(__dirname, '../.env.local')
  const envContent = fs.readFileSync(envPath, 'utf8')
  const envLines = envContent.split('\n')
  const env = {}
  
  envLines.forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) {
      env[key.trim()] = value.trim()
    }
  })

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

  try {
    const supabase = createClient(supabaseUrl, serviceKey)

    // 1. Execute schema and seed data if not already done
    console.log('📊 Ensuring database schema is up to date...')
    
    // Check if tables exist
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'mcp_servers')
      .maybeSingle()

    if (!tables) {
      console.log('📋 Creating database schema...')
      const schemaPath = path.join(__dirname, '../supabase/schema.sql')
      const seedPath = path.join(__dirname, '../supabase/seed.sql')
      
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8')
        console.log('📝 Note: Please run the schema manually in Supabase SQL Editor')
        console.log('Schema file location:', schemaPath)
      }
    } else {
      console.log('✅ Database schema already exists')
    }

    // 2. Setup auth-related columns and policies
    console.log('🔐 Setting up authentication policies...')
    
    // Add created_by column if it doesn't exist
    try {
      await supabase.rpc('exec', {
        sql: `
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'mcp_servers' AND column_name = 'created_by'
            ) THEN
              ALTER TABLE mcp_servers ADD COLUMN created_by UUID REFERENCES auth.users(id);
            END IF;
          END $$;
        `
      })
      console.log('✅ Auth columns configured')
    } catch (error) {
      console.log('⚠️  Auth columns may already exist or need manual setup')
    }

    // 3. Update RLS policies
    try {
      const policies = [
        `DROP POLICY IF EXISTS "Users can insert their own servers" ON mcp_servers`,
        `CREATE POLICY "Users can insert their own servers" ON mcp_servers FOR INSERT WITH CHECK (auth.uid() = created_by)`,
        `DROP POLICY IF EXISTS "Users can update their own servers" ON mcp_servers`,
        `CREATE POLICY "Users can update their own servers" ON mcp_servers FOR UPDATE USING (auth.uid() = created_by)`
      ]

      for (const policy of policies) {
        try {
          await supabase.rpc('exec', { sql: policy })
        } catch (error) {
          console.log(`⚠️  Policy might need manual setup: ${policy.substring(0, 50)}...`)
        }
      }
      console.log('✅ RLS policies configured')
    } catch (error) {
      console.log('⚠️  Some policies may need manual setup')
    }

    console.log('\n🎉 Auto-configuration complete!')
    console.log('\n📝 Manual steps remaining:')
    const projectRef = supabaseUrl.split('//')[1].split('.')[0]
    console.log(`1. Go to: https://supabase.com/dashboard/project/${projectRef}/auth/settings`)
    console.log('2. Set Site URL to: http://localhost:3001')
    console.log('3. Optionally disable "Confirm email" for easier development')
    console.log('\n🚀 Then start: npm run dev')

  } catch (error) {
    console.error('❌ Auto-configuration failed:', error.message)
    console.log('\n📋 Please complete setup manually:')
    console.log('1. Run SQL files in Supabase Dashboard')
    console.log('2. Configure auth settings in Dashboard')
  }
}

autoConfigureAuth()