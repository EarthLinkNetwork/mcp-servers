#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

async function setupAuth() {
  console.log('🔐 Setting up authentication and permissions...')
  
  // Load environment variables
  const envPath = path.join(__dirname, '../.env.local')
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found.')
    process.exit(1)
  }

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

  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing Supabase credentials')
    process.exit(1)
  }

  try {
    const supabase = createClient(supabaseUrl, serviceKey)

    console.log('🔗 Testing connection...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError && !authError.message.includes('session_not_found')) {
      throw authError
    }
    console.log('✅ Connection successful!')

    // Read auth SQL file
    const authSqlPath = path.join(__dirname, '../supabase/auth.sql')
    if (!fs.existsSync(authSqlPath)) {
      console.log('⚠️  auth.sql not found, creating basic auth setup...')
      await createBasicAuthSetup(supabase)
    } else {
      console.log('📋 Executing auth setup SQL...')
      const authSql = fs.readFileSync(authSqlPath, 'utf8')
      
      // Split SQL into individual statements and execute them
      const statements = authSql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt && !stmt.startsWith('--'))

      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await supabase.rpc('exec', { sql: statement + ';' })
          } catch (error) {
            // Try alternative method for some statements
            console.log(`⚠️  Statement might need manual execution: ${statement.substring(0, 50)}...`)
          }
        }
      }
    }

    console.log('✅ Authentication setup complete!')
    console.log('\n📝 Next steps:')
    console.log('1. Go to https://supabase.com/dashboard/project/' + supabaseUrl.split('//')[1].split('.')[0] + '/auth/settings')
    console.log('2. Set Site URL to: http://localhost:3001')
    console.log('3. Enable email confirmations (optional)')
    console.log('\n🚀 Then restart your dev server: npm run dev')

  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    console.log('\n📝 Manual setup required:')
    console.log('1. Go to Supabase Dashboard > Authentication > Settings')
    console.log('2. Set Site URL to: http://localhost:3001')
    console.log('3. Go to SQL Editor and run the contents of supabase/auth.sql')
  }
}

async function createBasicAuthSetup(supabase) {
  console.log('🔧 Creating basic auth setup...')
  
  try {
    // Add created_by column to mcp_servers if it doesn't exist
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

    // Create policies for authenticated users to add servers
    await supabase.rpc('exec', {
      sql: `
        DROP POLICY IF EXISTS "Users can insert their own servers" ON mcp_servers;
        CREATE POLICY "Users can insert their own servers" ON mcp_servers
          FOR INSERT WITH CHECK (auth.uid() = created_by);
      `
    })

    console.log('✅ Basic auth setup created')
  } catch (error) {
    console.log('⚠️  Some auth setup steps may need manual configuration')
  }
}

setupAuth()