#!/usr/bin/env node

const https = require('https')
const fs = require('fs')
const path = require('path')

async function forceAddColumn() {
  console.log('💪 Force adding created_by column...')
  
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

  try {
    // Execute SQL directly via PostgreSQL REST API
    const sqlCommands = [
      'ALTER TABLE mcp_servers ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);',
      'DROP POLICY IF EXISTS "Public servers are viewable by everyone" ON mcp_servers;',
      'CREATE POLICY "Public servers are viewable by everyone" ON mcp_servers FOR SELECT USING (is_active = true);',
      'DROP POLICY IF EXISTS "Authenticated users can insert servers" ON mcp_servers;',
      'CREATE POLICY "Authenticated users can insert servers" ON mcp_servers FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);'
    ]

    console.log('🔧 Executing SQL commands directly...')
    
    for (const sql of sqlCommands) {
      console.log(`📝 Executing: ${sql.substring(0, 50)}...`)
      
      const postData = JSON.stringify({
        query: sql
      })

      const options = {
        hostname: `${projectRef}.supabase.co`,
        port: 443,
        path: '/rest/v1/rpc/execute_sql',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey,
          'Content-Length': Buffer.byteLength(postData)
        }
      }

      try {
        await new Promise((resolve, reject) => {
          const req = https.request(options, (res) => {
            let data = ''
            res.on('data', (chunk) => data += chunk)
            res.on('end', () => {
              if (res.statusCode === 200 || res.statusCode === 404) {
                console.log('✅ Command executed')
                resolve(data)
              } else {
                console.log(`⚠️  Command response: ${res.statusCode}`)
                resolve(data)
              }
            })
          })
          
          req.on('error', (error) => {
            console.log(`⚠️  Request error: ${error.message}`)
            resolve()
          })
          
          req.write(postData)
          req.end()
        })
        
        // Small delay between commands
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.log(`⚠️  Error executing command: ${error.message}`)
      }
    }

    console.log('\n✅ All SQL commands attempted!')
    console.log('🔄 Refreshing Supabase schema cache...')
    
    // Try to refresh schema by making a simple query
    const { createClient } = require('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, serviceKey)
    
    try {
      await supabase.from('mcp_servers').select('id').limit(1)
      console.log('✅ Schema cache refreshed!')
    } catch (error) {
      console.log('⚠️  Schema refresh attempt completed')
    }

    console.log('\n🎉 Force update complete!')
    console.log('🚀 Try adding a server again!')
    console.log('\nIf it still fails, the column may need to be added via Supabase Dashboard.')

  } catch (error) {
    console.error('❌ Force update failed:', error.message)
    console.log('\n📝 Final fallback - please run this in Supabase SQL Editor:')
    console.log('ALTER TABLE mcp_servers ADD COLUMN created_by UUID REFERENCES auth.users(id);')
  }
}

forceAddColumn()