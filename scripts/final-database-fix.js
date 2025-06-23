#!/usr/bin/env node

const https = require('https')
const fs = require('fs')
const path = require('path')

async function finalDatabaseFix() {
  console.log('🔧 Final attempt: Using Supabase Management API...')
  
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
  const projectRef = supabaseUrl.split('//')[1].split('.')[0]

  // Try using the PostgREST API with a direct query
  const sql = 'ALTER TABLE mcp_servers ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);'
  
  const postData = JSON.stringify({
    sql: sql
  })

  console.log(`🌐 Project Reference: ${projectRef}`)
  console.log('📝 Executing SQL:', sql)

  const options = {
    hostname: `${projectRef}.supabase.co`,
    port: 443,
    path: '/rest/v1/rpc/exec',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
      'apikey': serviceKey,
      'Prefer': 'return=minimal'
    }
  }

  try {
    const result = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = ''
        res.on('data', (chunk) => data += chunk)
        res.on('end', () => {
          console.log(`📡 Response status: ${res.statusCode}`)
          console.log(`📊 Response data: ${data}`)
          resolve({ status: res.statusCode, data })
        })
      })
      
      req.on('error', (error) => {
        console.log(`❌ Request error: ${error.message}`)
        reject(error)
      })
      
      req.write(postData)
      req.end()
    })

    if (result.status !== 200) {
      console.log('⚠️  API call failed, trying direct database connection...')
      
      // Final approach: Use the Supabase client with direct database access
      const { createClient } = require('@supabase/supabase-js')
      const supabase = createClient(supabaseUrl, serviceKey)
      
      // Create a function to add the column
      console.log('🔧 Creating database function to add column...')
      
      const { data: functionData, error: functionError } = await supabase.rpc('create_column_if_not_exists', {})
      
      if (functionError) {
        console.log('❌ Function approach failed:', functionError.message)
        
        // Last resort: direct modification
        console.log('🔧 Last resort: Direct table modification attempt...')
        
        // Check current schema
        const { data: schemaData, error: schemaError } = await supabase
          .from('information_schema.columns')
          .select('column_name')
          .eq('table_name', 'mcp_servers')
        
        if (!schemaError) {
          console.log('📋 Current columns:', schemaData.map(col => col.column_name))
          
          if (!schemaData.find(col => col.column_name === 'created_by')) {
            console.log('❌ created_by column is definitely missing')
            console.log('')
            console.log('🛠️  MANUAL INTERVENTION REQUIRED:')
            console.log('1. Go to your Supabase dashboard')
            console.log('2. Navigate to SQL Editor')
            console.log('3. Execute this SQL:')
            console.log('')
            console.log('   ALTER TABLE mcp_servers ADD COLUMN created_by UUID REFERENCES auth.users(id);')
            console.log('')
            console.log('4. Run the application again')
            console.log('')
            return false
          } else {
            console.log('✅ Column already exists!')
            return true
          }
        }
      } else {
        console.log('✅ Function executed successfully!')
        return true
      }
    } else {
      console.log('✅ SQL executed successfully via API!')
      return true
    }

  } catch (error) {
    console.log('❌ All automated approaches failed:', error.message)
    console.log('')
    console.log('🛠️  MANUAL INTERVENTION REQUIRED:')
    console.log('Please add the column manually via Supabase dashboard:')
    console.log('')
    console.log('ALTER TABLE mcp_servers ADD COLUMN created_by UUID REFERENCES auth.users(id);')
    console.log('')
    return false
  }
}

finalDatabaseFix().then(success => {
  if (success) {
    console.log('\n🎉 Database fix completed!')
    console.log('🚀 Try adding a server in the application now.')
  } else {
    console.log('\n💥 Automated fix failed - manual intervention needed.')
  }
})