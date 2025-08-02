import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Test database connection by fetching clubs
    const { data: clubs, error } = await supabase
      .from('Club')
      .select('id, name, createdAt')
      .limit(5)
    
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Database connection failed', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      status: 'connected',
      message: 'Successfully connected to Supabase!',
      clubs: clubs || [],
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Unexpected error occurred' },
      { status: 500 }
    )
  }
}