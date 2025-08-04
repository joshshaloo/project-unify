import { NextResponse } from 'next/server'
import { db } from '@/lib/prisma'

export async function GET() {
  try {
    // Check database connection
    await db.$queryRaw`SELECT 1`
    
    return NextResponse.json({
      status: 'healthy',
      service: 'web',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || 'unknown',
      environment: process.env.NODE_ENV,
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      {
        status: 'unhealthy',
        service: 'web',
        timestamp: new Date().toISOString(),
        error: 'Database connection failed',
      },
      { status: 503 }
    )
  }
}