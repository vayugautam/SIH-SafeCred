/**
 * Comprehensive User Seeding Script
 * Creates diverse user profiles across income spectrum with various consent patterns
 * 
 * Income Segments:
 * - Low-income (<₹10k): Full access to alternative proxies
 * - Middle-income (₹10k-₹15k): Near barrier, alternative proxies available
 * - High-income (>₹15k): No alternative proxies, repayment-only evaluation
 * 
 * Consent Patterns:
 * - No consents (0)
 * - Bank only (1)
 * - Bank + 1 alternative (2)
 * - Bank + 2 alternatives (3)
 * - All consents (4)
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// NBCFDC barrier from model metadata
const INCOME_BARRIER = 9764

interface UserProfile {
  name: string
  mobile: string
  email: string
  password: string
  income: number
  segment: 'low' | 'middle' | 'high'
  consentPattern: 'none' | 'bank-only' | 'bank-one-alt' | 'bank-two-alt' | 'all'
  hasPreviousLoans: boolean
  isGoodBorrower: boolean
}

const users: UserProfile[] = [
  // === LOW INCOME SEGMENT (<₹10k) ===
  {
    name: 'Ramesh Kumar',
    mobile: '9100000001',
    email: '9100000001@safecred.com',
    password: 'test123',
    income: 6000,
    segment: 'low',
    consentPattern: 'none',
    hasPreviousLoans: false,
    isGoodBorrower: true,
  },
  {
    name: 'Lakshmi Devi',
    mobile: '9100000002',
    email: '9100000002@safecred.com',
    password: 'test123',
    income: 7500,
    segment: 'low',
    consentPattern: 'bank-only',
    hasPreviousLoans: false,
    isGoodBorrower: true,
  },
  {
    name: 'Suresh Yadav',
    mobile: '9100000003',
    email: '9100000003@safecred.com',
    password: 'test123',
    income: 8000,
    segment: 'low',
    consentPattern: 'bank-one-alt',
    hasPreviousLoans: true,
    isGoodBorrower: true,
  },
  {
    name: 'Anita Singh',
    mobile: '9100000004',
    email: '9100000004@safecred.com',
    password: 'test123',
    income: 8500,
    segment: 'low',
    consentPattern: 'bank-two-alt',
    hasPreviousLoans: true,
    isGoodBorrower: true,
  },
  {
    name: 'Rajesh Patel',
    mobile: '9100000005',
    email: '9100000005@safecred.com',
    password: 'test123',
    income: 9000,
    segment: 'low',
    consentPattern: 'all',
    hasPreviousLoans: true,
    isGoodBorrower: true,
  },

  // === MIDDLE INCOME SEGMENT (₹10k-₹15k) ===
  {
    name: 'Priya Sharma',
    mobile: '9100000006',
    email: '9100000006@safecred.com',
    password: 'test123',
    income: 11000,
    segment: 'middle',
    consentPattern: 'none',
    hasPreviousLoans: false,
    isGoodBorrower: true,
  },
  {
    name: 'Vijay Reddy',
    mobile: '9100000007',
    email: '9100000007@safecred.com',
    password: 'test123',
    income: 12500,
    segment: 'middle',
    consentPattern: 'bank-only',
    hasPreviousLoans: true,
    isGoodBorrower: true,
  },
  {
    name: 'Meena Nair',
    mobile: '9100000008',
    email: '9100000008@safecred.com',
    password: 'test123',
    income: 13500,
    segment: 'middle',
    consentPattern: 'bank-two-alt',
    hasPreviousLoans: true,
    isGoodBorrower: false, // Has defaults
  },
  {
    name: 'Arun Kumar',
    mobile: '9100000009',
    email: '9100000009@safecred.com',
    password: 'test123',
    income: 14000,
    segment: 'middle',
    consentPattern: 'all',
    hasPreviousLoans: true,
    isGoodBorrower: true,
  },

  // === HIGH INCOME SEGMENT (>₹15k) - NO ALTERNATIVE PROXIES ===
  {
    name: 'Amit Verma',
    mobile: '9100000010',
    email: '9100000010@safecred.com',
    password: 'test123',
    income: 18000,
    segment: 'high',
    consentPattern: 'none',
    hasPreviousLoans: false,
    isGoodBorrower: true,
  },
  {
    name: 'Sneha Gupta',
    mobile: '9100000011',
    email: '9100000011@safecred.com',
    password: 'test123',
    income: 22000,
    segment: 'high',
    consentPattern: 'bank-only',
    hasPreviousLoans: false,
    isGoodBorrower: true,
  },
  {
    name: 'Karthik Iyer',
    mobile: '9100000012',
    email: '9100000012@safecred.com',
    password: 'test123',
    income: 25000,
    segment: 'high',
    consentPattern: 'bank-only',
    hasPreviousLoans: true,
    isGoodBorrower: true,
  },
  {
    name: 'Deepa Menon',
    mobile: '9100000013',
    email: '9100000013@safecred.com',
    password: 'test123',
    income: 30000,
    segment: 'high',
    consentPattern: 'bank-only',
    hasPreviousLoans: true,
    isGoodBorrower: false, // Has some defaults
  },
  {
    name: 'Rohan Kapoor',
    mobile: '9100000014',
    email: '9100000014@safecred.com',
    password: 'test123',
    income: 50000,
    segment: 'high',
    consentPattern: 'bank-only',
    hasPreviousLoans: true,
    isGoodBorrower: true,
  },
]

async function main() {
  console.log('🌱 Starting comprehensive user seeding...\n')

  const hashedPassword = await bcrypt.hash('test123', 10)

  for (const profile of users) {
    console.log(`Creating user: ${profile.name} (${profile.segment.toUpperCase()}, ₹${profile.income})`)

    // Delete existing user if present
    await prisma.user.deleteMany({
      where: { mobile: profile.mobile },
    })

    const user = await prisma.user.create({
      data: {
        name: profile.name,
        mobile: profile.mobile,
        email: profile.email,
        password: hashedPassword,
        isSociallyDisadvantaged: profile.income < 10000,
        hasChildren: profile.consentPattern === 'all' || profile.consentPattern === 'bank-two-alt',
      },
    })

    console.log(`  ✓ Created user: ${user.id}`)

    // Create 1-3 previous applications based on borrower history
    if (profile.hasPreviousLoans) {
      const numLoans = profile.isGoodBorrower ? 3 : 2
      
      for (let i = 0; i < numLoans; i++) {
        const isOldest = i === 0
        const monthsAgo = isOldest ? 18 : (i === 1 ? 12 : 6)
        const createdAt = new Date()
        createdAt.setMonth(createdAt.getMonth() - monthsAgo)

        const status = profile.isGoodBorrower 
          ? 'APPROVED' 
          : (i === 1 ? 'REJECTED' : 'APPROVED')

        const loanAmount = profile.segment === 'high' ? 25000 : 10000

        await prisma.application.create({
          data: {
            userId: user.id,
            declaredIncome: profile.income,
            loanAmount,
            tenureMonths: 12,
            purpose: `Previous loan ${i + 1}`,
            status,
            riskCategory: profile.isGoodBorrower ? 'low_risk' : 'medium_risk',
            needCategory: 'business',
            finalSci: profile.isGoodBorrower ? 85.0 : 65.0,
            mlProbability: profile.isGoodBorrower ? 0.88 : 0.68,
            compositeScore: profile.isGoodBorrower ? 75.0 : 55.0,
            consentBankStatement: profile.consentPattern !== 'none',
            consentRecharge: false, // Previous loans didn't use alternative proxies
            consentElectricity: false,
            consentEducation: false,
            createdAt,
            updatedAt: createdAt,
          },
        })
      }

      console.log(`  ✓ Created ${numLoans} previous loan applications`)
    }

    console.log(`  → Segment: ${profile.segment} | Consent: ${profile.consentPattern} | Good borrower: ${profile.isGoodBorrower}\n`)
  }

  console.log('\n✅ Seeding complete!')
  console.log('\n📊 Summary:')
  console.log(`  Low-income users: ${users.filter(u => u.segment === 'low').length}`)
  console.log(`  Middle-income users: ${users.filter(u => u.segment === 'middle').length}`)
  console.log(`  High-income users: ${users.filter(u => u.segment === 'high').length}`)
  console.log(`\n  Total users: ${users.length}`)
  console.log(`\n🔐 All users have password: test123`)
  console.log(`\n📝 Test login examples:`)
  console.log(`  Low-income with all consents: 9100000005 / test123`)
  console.log(`  Middle-income with defaults: 9100000008 / test123`)
  console.log(`  High-income first-timer: 9100000010 / test123`)
  console.log(`  High-income with history: 9100000012 / test123`)
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
