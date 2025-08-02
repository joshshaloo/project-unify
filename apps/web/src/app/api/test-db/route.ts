import { prisma } from '../../../lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test database connection by fetching clubs
    const clubs = await prisma.club.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            teams: true,
            userClubs: true
          }
        }
      }
    })
    
    return NextResponse.json({
      status: 'connected',
      message: 'Successfully connected to database via Prisma!',
      clubs,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { 
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}