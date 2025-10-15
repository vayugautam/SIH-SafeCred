import 'next-auth'
import { UserRole } from '@prisma/client'

declare module 'next-auth' {
  interface User {
    id: string
    role: UserRole
    mobile: string
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: UserRole
      mobile: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    mobile: string
  }
}
