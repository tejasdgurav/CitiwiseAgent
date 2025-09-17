import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/db'
import { getEnv } from '@/lib/env'

const env = getEnv()

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().toLowerCase()
        const pwd = credentials?.password?.toString()

        // Demo-only auth: validate against env, then fetch user for role mapping
        if (!email || !pwd) return null
        if (env.DEMO_LOGIN_EMAIL && env.DEMO_LOGIN_PASSWORD) {
          if (email !== env.DEMO_LOGIN_EMAIL.toLowerCase() || pwd !== env.DEMO_LOGIN_PASSWORD) {
            return null
          }
        } else {
          // If demo creds not set, reject
          return null
        }

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) return null

        return {
          id: user.id,
          name: user.name || user.email,
          email: user.email,
          role: user.role,
        } as any
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      (session as any).role = (token as any).role
      return session
    },
  },
  secret: env.NEXTAUTH_SECRET,
}

export const { handlers: authHandlers } = NextAuth(authOptions)
