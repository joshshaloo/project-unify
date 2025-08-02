#!/usr/bin/env tsx

import { spawn } from 'child_process'
import { existsSync } from 'fs'
import path from 'path'

interface TestOptions {
  type: 'unit' | 'integration' | 'e2e' | 'all'
  watch: boolean
  coverage: boolean
  verbose: boolean
  grep?: string
}

function parseArgs(): TestOptions {
  const args = process.argv.slice(2)
  const options: TestOptions = {
    type: 'all',
    watch: false,
    coverage: false,
    verbose: false,
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    switch (arg) {
      case '--unit':
        options.type = 'unit'
        break
      case '--integration':
        options.type = 'integration'
        break
      case '--e2e':
        options.type = 'e2e'
        break
      case '--watch':
      case '-w':
        options.watch = true
        break
      case '--coverage':
      case '-c':
        options.coverage = true
        break
      case '--verbose':
      case '-v':
        options.verbose = true
        break
      case '--grep':
      case '-g':
        options.grep = args[i + 1]
        i++ // Skip next argument
        break
    }
  }

  return options
}

function runCommand(command: string, args: string[]): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd(),
    })

    child.on('close', (code) => {
      resolve(code || 0)
    })

    child.on('error', (error) => {
      reject(error)
    })
  })
}

async function runUnitTests(options: TestOptions): Promise<number> {
  console.log('🧪 Running unit tests...')
  
  const args = ['test']
  
  if (options.watch) args.push('--watch')
  if (options.coverage) args.push('--coverage')
  if (options.verbose) args.push('--reporter=verbose')
  if (options.grep) args.push(`--testNamePattern="${options.grep}"`)
  
  // Only run unit tests (exclude e2e and integration)
  args.push('--testPathIgnorePatterns=e2e,integration')
  
  return runCommand('pnpm', args)
}

async function runIntegrationTests(options: TestOptions): Promise<number> {
  console.log('🔗 Running integration tests...')
  
  const args = ['test', '--run']
  
  if (options.verbose) args.push('--reporter=verbose')
  if (options.grep) args.push(`--testNamePattern="${options.grep}"`)
  
  // Only run integration tests
  args.push('--testNamePattern="integration|api"')
  
  return runCommand('pnpm', args)
}

async function runE2ETests(options: TestOptions): Promise<number> {
  console.log('🎭 Running E2E tests...')
  
  const args = ['test:e2e']
  
  if (options.verbose) args.push('--reporter=html')
  if (options.grep) args.push(`--grep="${options.grep}"`)
  
  return runCommand('pnpm', args)
}

async function checkPrerequisites(): Promise<boolean> {
  console.log('🔍 Checking prerequisites...')
  
  // Check if database is running (for integration tests)
  try {
    const { execSync } = require('child_process')
    execSync('pnpm db:push', { stdio: 'pipe' })
    console.log('✅ Database is ready')
  } catch (error) {
    console.log('⚠️  Database not ready - integration tests may fail')
  }
  
  // Check if Playwright browsers are installed
  const playwrightConfig = path.join(process.cwd(), 'playwright.config.ts')
  if (existsSync(playwrightConfig)) {
    console.log('✅ Playwright configuration found')
  } else {
    console.log('⚠️  Playwright not configured - E2E tests will be skipped')
  }
  
  return true
}

async function main() {
  const options = parseArgs()
  
  console.log('🚀 Soccer App Test Runner')
  console.log('================================')
  console.log(`Test type: ${options.type}`)
  console.log(`Watch mode: ${options.watch}`)
  console.log(`Coverage: ${options.coverage}`)
  console.log(`Verbose: ${options.verbose}`)
  if (options.grep) console.log(`Filter: ${options.grep}`)
  console.log('================================\n')
  
  await checkPrerequisites()
  
  let exitCode = 0
  
  try {
    switch (options.type) {
      case 'unit':
        exitCode = await runUnitTests(options)
        break
        
      case 'integration':
        exitCode = await runIntegrationTests(options)
        break
        
      case 'e2e':
        exitCode = await runE2ETests(options)
        break
        
      case 'all':
        console.log('🔄 Running all test suites...\n')
        
        // Run unit tests first
        exitCode = await runUnitTests({ ...options, watch: false })
        if (exitCode !== 0) break
        
        // Run integration tests
        exitCode = await runIntegrationTests(options)
        if (exitCode !== 0) break
        
        // Run E2E tests last
        exitCode = await runE2ETests(options)
        break
    }
    
    if (exitCode === 0) {
      console.log('\n✅ All tests passed!')
    } else {
      console.log('\n❌ Some tests failed')
    }
    
  } catch (error) {
    console.error('Error running tests:', error)
    exitCode = 1
  }
  
  process.exit(exitCode)
}

// Show help if requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Soccer App Test Runner

Usage: tsx scripts/test-runner.ts [options]

Options:
  --unit              Run only unit tests
  --integration       Run only integration tests  
  --e2e               Run only E2E tests
  --watch, -w         Run in watch mode (unit tests only)
  --coverage, -c      Generate coverage report
  --verbose, -v       Verbose output
  --grep, -g <pattern> Filter tests by pattern
  --help, -h          Show this help

Examples:
  tsx scripts/test-runner.ts --unit --watch
  tsx scripts/test-runner.ts --integration --verbose
  tsx scripts/test-runner.ts --e2e --grep="login"
  tsx scripts/test-runner.ts --coverage
`)
  process.exit(0)
}

if (require.main === module) {
  main()
}