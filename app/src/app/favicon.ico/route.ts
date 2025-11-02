import { NextResponse } from 'next/server'

const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=='

export async function GET() {
  const body = Buffer.from(base64Png, 'base64')
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  })
}
