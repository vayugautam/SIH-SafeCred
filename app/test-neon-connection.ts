// Test Neon Database Connection
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

async function testConnection() {
  try {
    console.log('🔍 Testing Neon database connection...')
    console.log('Database URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'))
    
    // Test connection
    await prisma.$connect()
    console.log('✅ Successfully connected to Neon database!')
    
    // Test query
    const result = await prisma.$queryRaw`SELECT version()`
    console.log('✅ PostgreSQL version:', result)
    
    // Check existing tables
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
    console.log('📊 Existing tables:', tables)
    
  } catch (error: any) {
    console.error('❌ Connection failed:', error.message)
    console.error('Error code:', error.code)
    
    if (error.message.includes('P1001')) {
      console.log('\n💡 Troubleshooting tips:')
      console.log('1. Check if Neon project is active in dashboard')
      console.log('2. Verify the connection string is correct')
      console.log('3. Ensure your IP is not blocked')
      console.log('4. Try using the direct (non-pooler) connection string')
      console.log('5. Check if Neon project is in the correct region')
    }
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()
  .catch(console.error)
  .finally(() => process.exit())
