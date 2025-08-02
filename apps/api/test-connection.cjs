const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

async function testConnection() {
  console.log('Testing database connection...')
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'))
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  })
  
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully!')
    
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Query successful:', result)
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
    console.error('Error code:', error.code)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()