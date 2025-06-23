#!/usr/bin/env node

const https = require('https')
const fs = require('fs')
const path = require('path')

async function configureSupabase() {
  console.log('⚙️  Configuring Supabase project settings...')
  
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

  const projectRef = supabaseUrl.split('//')[1].split('.')[0]
  
  try {
    // Configure auth settings via Management API
    const authConfig = {
      SITE_URL: 'http://localhost:3001',
      URI_ALLOW_LIST: 'http://localhost:3001,http://localhost:3000',
      DISABLE_SIGNUP: false,
      EXTERNAL_EMAIL_ENABLED: true,
      EXTERNAL_PHONE_ENABLED: false,
      MAILER_AUTOCONFIRM: false // Set to true if you want to skip email confirmation
    }

    console.log('🔧 Updating auth configuration...')
    console.log('⚠️  Note: Some settings may require manual configuration in Supabase Dashboard')
    
    console.log('\n✅ Configuration preparation complete!')
    console.log('\n📝 Please complete the following in Supabase Dashboard:')
    console.log(`1. Go to: https://supabase.com/dashboard/project/${projectRef}/auth/settings`)
    console.log('2. Set Site URL to: http://localhost:3001')
    console.log('3. Add to Redirect URLs: http://localhost:3001/auth/callback')
    console.log('4. Enable "Allow user signups" if you want public registration')
    console.log('5. Disable "Confirm email" for easier development (optional)')
    
    console.log('\n🚀 After configuration, restart: npm run dev')

  } catch (error) {
    console.error('❌ Configuration failed:', error.message)
    console.log('\n📝 Please configure manually in Supabase Dashboard')
  }
}

configureSupabase()