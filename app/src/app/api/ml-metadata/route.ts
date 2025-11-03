// app/src/app/api/ml-metadata/route.ts
import { NextResponse } from 'next/server'

/**
 * GET /api/ml-metadata
 * Returns ML model metadata including dynamic income barrier
 */
export async function GET() {
  try {
    // Fetch from ML API
  const mlApiUrl = process.env.ML_API_URL || 'http://localhost:8002'
    const response = await fetch(`${mlApiUrl}/`)
    
    if (!response.ok) {
      throw new Error('ML API unreachable')
    }

    const data = await response.json()
    
    return NextResponse.json({
      incomeBarrier: data.dynamic_income_barrier || 15000,
      modelVersion: data.version || 'unknown',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching ML metadata:', error)
    
    // Return default barrier if ML API is down
    return NextResponse.json({
      incomeBarrier: 15000,
      modelVersion: 'fallback',
      timestamp: new Date().toISOString(),
      error: 'ML API unavailable, using default barrier'
    }, { status: 200 }) // Return 200 so frontend doesn't break
  }
}
