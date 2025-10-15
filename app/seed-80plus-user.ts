// ================================================================
// SEED SCRIPT: Create Test User with 80+ Credit Score
// ================================================================
// Run this with: npx tsx seed-80plus-user.ts
// ================================================================

import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('\n🌱 Seeding test user with 80+ credit score profile...\n')

  // Hash password
  const hashedPassword = await bcrypt.hash('Test@123', 10)

  // Step 1: Create test user
  const user = await prisma.user.upsert({
    where: { email: 'testuser80@safecred.com' },
    update: {},
    create: {
      email: 'testuser80@safecred.com',
      name: 'Test User 80Plus',
      password: hashedPassword,
      role: 'USER',
      mobile: '8800112233',
      age: 20,
      hasChildren: false,
      isSociallyDisadvantaged: false,
      isActive: true,
      isVerified: true,
    },
  })

  console.log('✅ Created user:', user.email)
  console.log('   Password: Test@123')
  console.log('   Mobile: 8800112233')
  console.log('   Age: 20')
  console.log('   Has Children: No\n')

  console.log('✅ Test user created successfully!')
  console.log('\n================================================================')
  console.log('  NOTE: Database Schema Limitation')
  console.log('================================================================\n')
  console.log('The current database schema stores transaction-level data only,')
  console.log('not aggregated statistics like monthlyCredits, salaryStd, etc.\n')
  console.log('The ML model will use DEFAULT values for new users without history.\n')
  console.log('To achieve 80+ score, we need to update scoring.py to give better')
  console.log('defaults for new users based on declared income.\n')
  
  console.log('================================================================')
  console.log('  HOW TO GET 80+ SCORE ON YOUR SCREEN')
  console.log('================================================================\n')
  
  console.log('1. Login Credentials:')
  console.log('   Email:    testuser80@safecred.com')
  console.log('   Password: Test@123\n')
  
  console.log('2. Navigate to "Apply for Loan"\n')
  
  console.log('3. Fill in the form:')
  console.log('   Monthly Income:        ₹35,000')
  console.log('   Loan Amount:           ₹8,500  (24% of income)')
  console.log('   Tenure:                12 months')
  console.log('   Purpose:               Business expansion\n')
  
  console.log('4. Check ALL consent boxes:')
  console.log('   ✅ Mobile Recharge Data')
  console.log('   ✅ Electricity Bill Data')
  console.log('   ✅ Education Fee Data')
  console.log('   ✅ Bank Statement Data\n')
  
  console.log('5. Submit Application\n')
  
  console.log('6. Expected Results (NEW USER):')
  console.log('   Risk Band:       Medium Risk (first-time user)')
  console.log('   Credit Score:    70-78/100')
  console.log('   Composite Score: 65-75/100 (no history penalty)')
  console.log('   Loan Offer:      ₹12,000-₹16,000')
  console.log('   Status:          MANUAL_REVIEW')
  console.log('   Interest Rate:   NONE (0% - Non-Profit)\n')
  
  console.log('  To get 80+: Update scoring.py with new user optimization')
  console.log('  Or: Add previous loan records to database\n')
  
  console.log('================================================================\n')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Error:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
