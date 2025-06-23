#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

async function simpleSetup() {
  console.log('🚀 Setting up MCP Hub database...')
  
  // Load environment variables
  const envPath = path.join(__dirname, '../.env.local')
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found.')
    console.log('\n📝 Please create .env.local with your Supabase credentials:')
    console.log('NEXT_PUBLIC_SUPABASE_URL=your_project_url')
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key')
    console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key')
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
    console.error('❌ Missing Supabase credentials in .env.local')
    console.log('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    console.log('\nYou can find these in your Supabase dashboard:')
    console.log('1. Go to https://supabase.com/dashboard')
    console.log('2. Select your project')
    console.log('3. Go to Settings > API')
    console.log('4. Copy the URL and service_role key')
    process.exit(1)
  }

  try {
    const supabase = createClient(supabaseUrl, serviceKey)

    // Test connection and check if tables already exist
    console.log('🔗 Testing connection...')
    const { data: existingTables, error: checkError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
      .eq('tablename', 'mcp_servers')
    
    if (checkError && !checkError.message.includes('does not exist')) {
      console.error('❌ Connection failed:', checkError.message)
      console.log('\n📝 Please check your credentials and try manual setup:')
      console.log('1. Go to https://supabase.com/dashboard')
      console.log('2. Open SQL Editor')
      console.log('3. Run supabase/schema.sql')
      console.log('4. Run supabase/seed.sql')
      return
    }

    console.log('✅ Connection successful!')

    const tables = existingTables

    if (tables && tables.length > 0) {
      console.log('⚠️  Tables already exist. Skipping schema creation.')
      console.log('✅ Database is ready!')
      return
    }

    console.log('📋 Creating schema and inserting data...')
    console.log('\n📝 Manual setup required:')
    console.log('1. Go to https://supabase.com/dashboard')
    console.log('2. Open your project')
    console.log('3. Go to SQL Editor')
    console.log('4. Create a new query and paste contents of supabase/schema.sql')
    console.log('5. Run the query')
    console.log('6. Create another query and paste contents of supabase/seed.sql')
    console.log('7. Run the second query')
    console.log('\n✅ Then restart your development server with: npm run dev')

  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    console.log('\n📝 Please complete setup manually in Supabase dashboard')
  }
}

simpleSetup()