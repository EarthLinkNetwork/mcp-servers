#!/usr/bin/env node

const https = require('https')
const fs = require('fs')
const path = require('path')

async function directSqlFix() {
  console.log('🔧 Executing SQL directly via Supabase REST API...')
  
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

  const sql = `
-- First check if column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mcp_servers' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE mcp_servers ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Public servers are viewable by everyone" ON mcp_servers;
DROP POLICY IF EXISTS "Authenticated users can insert servers" ON mcp_servers;
DROP POLICY IF EXISTS "Users can update own servers" ON mcp_servers;
DROP POLICY IF EXISTS "Users can delete own servers" ON mcp_servers;

-- Create new policies
CREATE POLICY "Public servers are viewable by everyone" ON mcp_servers
  FOR SELECT USING (is_active = true);
  
CREATE POLICY "Authenticated users can insert servers" ON mcp_servers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
  
CREATE POLICY "Users can update own servers" ON mcp_servers
  FOR UPDATE TO authenticated USING (auth.uid() = created_by);
  
CREATE POLICY "Users can delete own servers" ON mcp_servers
  FOR DELETE TO authenticated USING (auth.uid() = created_by);
`

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

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => data += chunk)
      res.on('end', () => {
        console.log(`📡 Response status: ${res.statusCode}`)
        if (res.statusCode === 200) {
          console.log('✅ SQL executed successfully')
        } else {
          console.log(`⚠️  Response: ${data}`)
        }
        resolve(res.statusCode === 200)
      })
    })
    
    req.on('error', (error) => {
      console.log(`❌ Request error: ${error.message}`)
      resolve(false)
    })
    
    req.write(postData)
    req.end()
  })
}

directSqlFix().then(success => {
  if (success) {
    console.log('\n✅ Direct SQL execution completed!')
    console.log('🔄 Now running schema verification...')
    
    // Run verification script
    const { spawn } = require('child_process')
    const verify = spawn('node', ['scripts/verify-schema.js'], { stdio: 'inherit' })
    
    verify.on('close', (code) => {
      if (code === 0) {
        console.log('\n🎉 Everything looks good!')
      } else {
        console.log('\n⚠️  Verification had issues, but SQL was executed.')
      }
    })
  } else {
    console.log('\n❌ Direct SQL execution failed')
  }
})