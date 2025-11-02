import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // Try a simple query
    const userCount = await prisma.user.count();
    console.log(`✅ Found ${userCount} users in database`);
    
    await prisma.$disconnect();
    console.log('✅ Disconnected from database');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
}

testConnection();
