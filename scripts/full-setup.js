#!/usr/bin/env node

const { execSync } = require('child_process')
const path = require('path')

async function fullSetup() {
  console.log('🚀 Starting full MCP Hub setup...\n')

  try {
    // Step 1: Database setup
    console.log('📊 Step 1: Setting up database...')
    execSync('node scripts/simple-setup.js', { stdio: 'inherit', cwd: process.cwd() })
    console.log('✅ Database setup complete\n')

    // Step 2: Auth setup
    console.log('🔐 Step 2: Setting up authentication...')
    execSync('node scripts/setup-auth.js', { stdio: 'inherit', cwd: process.cwd() })
    console.log('✅ Authentication setup complete\n')

    // Step 3: Supabase configuration
    console.log('⚙️  Step 3: Configuring Supabase...')
    execSync('node scripts/configure-supabase.js', { stdio: 'inherit', cwd: process.cwd() })
    console.log('✅ Supabase configuration complete\n')

    console.log('🎉 MCP Hub setup complete!')
    console.log('\n📝 Final steps:')
    console.log('1. Check Supabase Dashboard auth settings (URLs should be configured)')
    console.log('2. Start development server: npm run dev')
    console.log('3. Create an account and start adding MCP servers!')

  } catch (error) {
    console.error('\n❌ Setup failed at some step')
    console.error('Error:', error.message)
    console.log('\n🔧 Try running individual setup scripts:')
    console.log('- npm run db:setup')
    console.log('- npm run auth:setup')
    console.log('- npm run config:supabase')
  }
}

fullSetup()