#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

async function verifySchema() {
  console.log('🔍 Verifying database schema...')
  
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

    // Test basic connection
    console.log('📡 Testing Supabase connection...')
    const { data: health, error: healthError } = await supabase
      .from('mcp_servers')
      .select('count')
      .limit(0)

    if (healthError) {
      console.log('❌ Connection failed:', healthError.message)
      return
    }
    
    console.log('✅ Connection successful')

    // Check if created_by column exists by attempting to select it
    console.log('🔍 Checking for created_by column...')
    try {
      const { data, error } = await supabase
        .from('mcp_servers')
        .select('id, name, created_by')
        .limit(1)

      if (error) {
        if (error.message.includes('column "created_by" does not exist')) {
          console.log('❌ created_by column does not exist')
          return false
        } else {
          throw error
        }
      }

      console.log('✅ created_by column exists and is accessible')
      
      // Test insertion with created_by
      console.log('🧪 Testing insert with created_by...')
      const testId = '12345678-1234-1234-1234-123456789012' // Dummy UUID
      
      const { data: insertTest, error: insertError } = await supabase
        .from('mcp_servers')
        .insert({
          name: 'test-server-' + Date.now(),
          display_name: 'Test Server',
          description: 'Test server for schema verification',
          category: 'other',
          package_name: 'test-package',
          is_official: false,
          is_active: false, // Set to false so it won't show up publicly
          created_by: testId
        })
        .select()

      if (insertError) {
        if (insertError.message.includes('violates foreign key constraint')) {
          console.log('⚠️  Insert failed due to foreign key constraint (expected for test UUID)')
          console.log('✅ But the created_by column is properly defined!')
          return true
        } else {
          console.log('❌ Insert failed:', insertError.message)
          return false
        }
      }

      // If insert succeeded, clean up
      if (insertTest && insertTest.length > 0) {
        await supabase
          .from('mcp_servers')
          .delete()
          .eq('id', insertTest[0].id)
        console.log('✅ Test insert succeeded and cleaned up')
      }

      return true

    } catch (error) {
      console.log('❌ Column check failed:', error.message)
      return false
    }

  } catch (error) {
    console.error('❌ Schema verification failed:', error.message)
    return false
  }
}

verifySchema().then(success => {
  if (success) {
    console.log('\n🎉 Schema verification passed!')
    console.log('💡 The database should now work with user authentication.')
  } else {
    console.log('\n💥 Schema verification failed!')
    console.log('📝 Manual intervention may be required.')
  }
})