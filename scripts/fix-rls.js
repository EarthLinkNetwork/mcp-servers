#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

async function fixRLS() {
  console.log('🔧 Fixing RLS policies for MCP servers...')
  
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

    console.log('🔗 Connecting to Supabase...')

    // First, make sure created_by column exists
    console.log('📋 Ensuring created_by column exists...')
    const { error: columnError } = await supabase.rpc('exec', {
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

    if (columnError) {
      console.log('⚠️  Column might already exist:', columnError.message)
    } else {
      console.log('✅ created_by column ready')
    }

    // Drop existing policies
    console.log('🗑️  Removing old policies...')
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Users can insert their own servers" ON mcp_servers',
      'DROP POLICY IF EXISTS "Users can update their own servers" ON mcp_servers',
      'DROP POLICY IF EXISTS "Users can delete their own servers" ON mcp_servers'
    ]

    for (const policy of dropPolicies) {
      try {
        await supabase.rpc('exec', { sql: policy })
      } catch (error) {
        console.log(`⚠️  Policy might not exist: ${policy}`)
      }
    }

    // Create new policies
    console.log('🔐 Creating new RLS policies...')
    const newPolicies = [
      // Allow authenticated users to insert servers
      `CREATE POLICY "Authenticated users can insert servers" ON mcp_servers
        FOR INSERT 
        TO authenticated 
        WITH CHECK (auth.uid() = created_by)`,
      
      // Allow users to update their own servers
      `CREATE POLICY "Users can update own servers" ON mcp_servers
        FOR UPDATE 
        TO authenticated 
        USING (auth.uid() = created_by)`,
      
      // Allow users to delete their own servers
      `CREATE POLICY "Users can delete own servers" ON mcp_servers
        FOR DELETE 
        TO authenticated 
        USING (auth.uid() = created_by)`,
    ]

    for (const policy of newPolicies) {
      try {
        await supabase.rpc('exec', { sql: policy })
        console.log('✅ Policy created successfully')
      } catch (error) {
        console.log('❌ Policy creation failed:', error.message)
        console.log('Policy:', policy.substring(0, 50) + '...')
      }
    }

    // Fix environment variables and config templates policies
    console.log('🔧 Fixing related table policies...')
    
    const relatedPolicies = [
      // Environment variables
      `DROP POLICY IF EXISTS "Users can manage env vars for their servers" ON environment_variables`,
      `CREATE POLICY "Users can manage env vars for their servers" ON environment_variables
        FOR ALL 
        TO authenticated 
        USING (
          EXISTS (
            SELECT 1 FROM mcp_servers 
            WHERE mcp_servers.id = environment_variables.server_id 
            AND mcp_servers.created_by = auth.uid()
          )
        )`,
      
      // Config templates  
      `DROP POLICY IF EXISTS "Users can manage config templates for their servers" ON config_templates`,
      `CREATE POLICY "Users can manage config templates for their servers" ON config_templates
        FOR ALL 
        TO authenticated 
        USING (
          EXISTS (
            SELECT 1 FROM mcp_servers 
            WHERE mcp_servers.id = config_templates.server_id 
            AND mcp_servers.created_by = auth.uid()
          )
        )`
    ]

    for (const policy of relatedPolicies) {
      try {
        await supabase.rpc('exec', { sql: policy })
      } catch (error) {
        console.log('⚠️  Related policy issue:', error.message)
      }
    }

    console.log('\n✅ RLS policies fixed!')
    console.log('🚀 Try adding a server again!')

  } catch (error) {
    console.error('❌ Failed to fix RLS:', error.message)
    console.log('\n📝 Manual fix required:')
    console.log('Go to Supabase Dashboard > SQL Editor and run:')
    console.log(`
ALTER TABLE mcp_servers ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

DROP POLICY IF EXISTS "Authenticated users can insert servers" ON mcp_servers;
CREATE POLICY "Authenticated users can insert servers" ON mcp_servers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
    `)
  }
}

fixRLS()