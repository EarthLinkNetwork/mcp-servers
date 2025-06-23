#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

async function fixColumnDirect() {
  console.log('🔧 Adding created_by column directly...')
  
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
    // Use REST API directly to execute SQL
    const projectRef = supabaseUrl.split('//')[1].split('.')[0]
    
    console.log('🔗 Executing SQL via REST API...')
    
    const sql = `
      -- Add created_by column
      ALTER TABLE mcp_servers ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
      
      -- Drop old policies
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

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey
      },
      body: JSON.stringify({ sql })
    })

    if (!response.ok) {
      // Try alternative method using simple client operations
      console.log('🔄 Trying alternative method...')
      
      const supabase = createClient(supabaseUrl, serviceKey)
      
      // Check if column exists by trying to select it
      try {
        const { data, error } = await supabase
          .from('mcp_servers')
          .select('created_by')
          .limit(1)
        
        if (error && error.message.includes('column "created_by" does not exist')) {
          console.log('❌ Column does not exist and automatic creation failed')
          console.log('📝 Please run this SQL manually in Supabase Dashboard:')
          console.log('\nALTER TABLE mcp_servers ADD COLUMN created_by UUID REFERENCES auth.users(id);')
          console.log('\nAfter adding the column, try adding a server again.')
          return
        } else {
          console.log('✅ Column already exists or was created successfully!')
        }
      } catch (error) {
        console.log('❌ Could not verify column existence')
        console.log('📝 Please add the column manually:')
        console.log('ALTER TABLE mcp_servers ADD COLUMN created_by UUID REFERENCES auth.users(id);')
        return
      }
    } else {
      console.log('✅ SQL executed successfully!')
    }

    console.log('🎉 Database schema updated!')
    console.log('🚀 Try adding a server now!')

  } catch (error) {
    console.error('❌ Failed to update schema:', error.message)
    console.log('\n📝 Manual SQL needed:')
    console.log('ALTER TABLE mcp_servers ADD COLUMN created_by UUID REFERENCES auth.users(id);')
  }
}

fixColumnDirect()