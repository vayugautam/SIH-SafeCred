import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@safecred.com' },
    update: {},
    create: {
      email: 'admin@safecred.com',
      mobile: '9999999999',
      password: adminPassword,
      name: 'System Administrator',
      role: UserRole.ADMIN,
      isActive: true,
      isVerified: true,
      emailVerified: new Date(),
    },
  })
  console.log('✅ Created admin user:', admin.email)

  // Create loan officer
  const officerPassword = await bcrypt.hash('Officer@123', 10)
  const officer = await prisma.user.upsert({
    where: { email: 'officer@safecred.com' },
    update: {},
    create: {
      email: 'officer@safecred.com',
      mobile: '9999999998',
      password: officerPassword,
      name: 'Loan Officer',
      role: UserRole.LOAN_OFFICER,
      isActive: true,
      isVerified: true,
      emailVerified: new Date(),
    },
  })
  console.log('✅ Created loan officer:', officer.email)

  // Create demo user
  const userPassword = await bcrypt.hash('User@123', 10)
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@safecred.com' },
    update: {},
    create: {
      email: 'demo@safecred.com',
      mobile: '9876543210',
      password: userPassword,
      name: 'Ramesh Kumar',
      role: UserRole.USER,
      age: 35,
      hasChildren: true,
      isSociallyDisadvantaged: false,
      address: '123 Main Street',
      state: 'Maharashtra',
      district: 'Mumbai',
      pincode: '400001',
      isActive: true,
      isVerified: true,
      emailVerified: new Date(),
    },
  })
  console.log('✅ Created demo user:', demoUser.email)

  // Create system configuration
  const configs = [
    {
      key: 'min_loan_amount',
      value: '5000',
      description: 'Minimum loan amount in INR',
    },
    {
      key: 'max_loan_amount',
      value: '100000',
      description: 'Maximum loan amount in INR',
    },
    {
      key: 'min_tenure_months',
      value: '3',
      description: 'Minimum loan tenure in months',
    },
    {
      key: 'max_tenure_months',
      value: '36',
      description: 'Maximum loan tenure in months',
    },
    {
      key: 'low_risk_interest_rate',
      value: '8.5',
      description: 'Interest rate for low risk borrowers (%)',
    },
    {
      key: 'medium_risk_interest_rate',
      value: '10.5',
      description: 'Interest rate for medium risk borrowers (%)',
    },
    {
      key: 'high_risk_interest_rate',
      value: '12.5',
      description: 'Interest rate for high risk borrowers (%)',
    },
    {
      key: 'auto_approve_threshold',
      value: '80',
      description: 'Minimum SCI score for auto-approval',
    },
  ]

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value, description: config.description },
      create: config,
    })
  }
  console.log('✅ Created system configuration')

  console.log('🎉 Database seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
