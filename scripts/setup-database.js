#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

async function setupDatabase() {
  // Load environment variables
  const envPath = path.join(__dirname, '../.env.local')
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found. Please create it with your Supabase credentials.')
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
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local')
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)')
    process.exit(1)
  }

  console.log('🚀 Setting up MCP Hub database...')
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Read schema file
    const schemaPath = path.join(__dirname, '../supabase/schema.sql')
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8')

    // Read seed file
    const seedPath = path.join(__dirname, '../supabase/seed.sql')
    const seedSQL = fs.readFileSync(seedPath, 'utf8')

    console.log('📋 Creating database schema...')
    
    // Execute schema
    const { error: schemaError } = await supabase.rpc('exec_sql', {
      sql: schemaSQL
    })

    if (schemaError) {
      console.error('❌ Schema creation failed:', schemaError.message)
      
      // Try alternative approach - execute via REST API
      console.log('🔄 Trying alternative method...')
      
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({ sql: schemaSQL })
      })

      if (!response.ok) {
        console.error('❌ Alternative schema creation also failed')
        console.log('📝 Manual setup required. Please run the following in Supabase SQL Editor:')
        console.log('1. Copy contents of supabase/schema.sql and execute')
        console.log('2. Copy contents of supabase/seed.sql and execute')
        return
      }
    }

    console.log('✅ Schema created successfully')
    console.log('🌱 Inserting seed data...')

    // Execute seed data
    const { error: seedError } = await supabase.rpc('exec_sql', {
      sql: seedSQL
    })

    if (seedError) {
      console.error('❌ Seed data insertion failed:', seedError.message)
      console.log('📝 Please manually run supabase/seed.sql in Supabase SQL Editor')
      return
    }

    console.log('✅ Seed data inserted successfully')
    console.log('🎉 Database setup complete!')
    console.log('🌐 You can now start the development server with: npm run dev')

  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    console.log('\n📝 Manual setup instructions:')
    console.log('1. Go to https://supabase.com/dashboard')
    console.log('2. Open your project')
    console.log('3. Go to SQL Editor')
    console.log('4. Create a new query and paste contents of supabase/schema.sql')
    console.log('5. Run the schema query')
    console.log('6. Create another query and paste contents of supabase/seed.sql')
    console.log('7. Run the seed query')
  }
}

// Check if we have the required dependencies
try {
  require('@supabase/supabase-js')
} catch (error) {
  console.error('❌ Missing @supabase/supabase-js dependency')
  console.log('Please run: npm install')
  process.exit(1)
}

setupDatabase()