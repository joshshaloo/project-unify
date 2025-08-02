#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

async function applyRLSPolicies() {
  console.log('Applying Row Level Security policies...')
  
  try {
    // Read the SQL file
    const sqlPath = join(process.cwd(), 'prisma', 'migrations', 'rls-policies.sql')
    const sql = readFileSync(sqlPath, 'utf8')
    
    // Split into individual statements and execute
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)
    
    for (const statement of statements) {
      try {
        await prisma.$executeRawUnsafe(statement + ';')
        console.log('✓ Applied:', statement.split('\n')[0].substring(0, 60) + '...')
      } catch (error: any) {
        // Skip if policy already exists
        if (error.message.includes('already exists')) {
          console.log('⚠️  Policy already exists:', statement.split('\n')[0].substring(0, 60) + '...')
        } else {
          console.error('✗ Failed:', statement.split('\n')[0].substring(0, 60) + '...')
          console.error('  Error:', error.message)
        }
      }
    }
    
    console.log('\n✅ RLS policies applied successfully!')
    console.log('\nIMPORTANT: These policies are now active and will enforce access control.')
    console.log('Make sure to test all functionality to ensure proper access.')
    
  } catch (error) {
    console.error('Failed to apply RLS policies:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

applyRLSPolicies()