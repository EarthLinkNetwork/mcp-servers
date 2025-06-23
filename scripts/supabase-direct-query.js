#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

async function supabaseDirectQuery() {
  console.log('🔧 Adding created_by column via direct Supabase client...')
  
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
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false
      }
    })

    console.log('📡 Testing connection...')
    
    // First test basic connection
    const { data: testData, error: testError } = await supabase
      .from('mcp_servers')
      .select('id')
      .limit(1)

    if (testError) {
      console.log('❌ Connection test failed:', testError.message)
      return
    }
    
    console.log('✅ Connection successful')

    // Use the rpc function to execute raw SQL
    console.log('🔧 Attempting to add column via SQL...')
    
    const { data, error } = await supabase.rpc('sql', {
      query: `
        -- Add column if it doesn't exist
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'mcp_servers' AND column_name = 'created_by'
            ) THEN
                ALTER TABLE mcp_servers ADD COLUMN created_by UUID REFERENCES auth.users(id);
                RAISE NOTICE 'Column created_by added to mcp_servers';
            ELSE
                RAISE NOTICE 'Column created_by already exists';
            END IF;
        END $$;
      `
    })

    if (error) {
      console.log('⚠️  SQL execution failed:', error.message)
      
      // Fallback: try a different approach using direct table manipulation
      console.log('🔄 Trying alternative approach...')
      
      // Try to query the column to see if it exists
      try {
        const { data: columnTest, error: columnError } = await supabase
          .from('mcp_servers')
          .select('created_by')
          .limit(0) // Don't actually fetch any rows
          
        if (columnError && columnError.message.includes('column "created_by" does not exist')) {
          console.log('❌ Column definitely does not exist')
          console.log('💡 This requires direct database access via Supabase dashboard')
          console.log('📝 Please execute this SQL in the Supabase SQL Editor:')
          console.log('')
          console.log('ALTER TABLE mcp_servers ADD COLUMN created_by UUID REFERENCES auth.users(id);')
          console.log('')
          console.log('Then restart the application.')
          return false
        } else if (!columnError) {
          console.log('✅ Column exists and is accessible!')
          return true
        } else {
          console.log('⚠️  Unexpected error:', columnError.message)
          return false
        }
      } catch (err) {
        console.log('❌ Column test failed:', err.message)
        return false
      }
    } else {
      console.log('✅ SQL executed successfully!')
      console.log('📊 Result:', data)
      
      // Verify the column was created
      console.log('🔍 Verifying column creation...')
      try {
        const { data: verifyData, error: verifyError } = await supabase
          .from('mcp_servers')
          .select('created_by')
          .limit(1)
          
        if (verifyError) {
          console.log('⚠️  Verification failed:', verifyError.message)
          return false
        } else {
          console.log('✅ Column verified successfully!')
          return true
        }
      } catch (err) {
        console.log('❌ Verification error:', err.message)
        return false
      }
    }

  } catch (error) {
    console.error('❌ Operation failed:', error.message)
    return false
  }
}

supabaseDirectQuery().then(success => {
  if (success) {
    console.log('\n🎉 Column creation successful!')
    console.log('🚀 You can now try adding a server in the application.')
  } else {
    console.log('\n💥 Automatic column creation failed.')
    console.log('🛠️  Manual intervention required via Supabase dashboard.')
  }
})