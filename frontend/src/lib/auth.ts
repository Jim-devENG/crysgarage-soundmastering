import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { JWT } from 'next-auth/jwt'

interface User {
  id: number
  email: string
  name: string
  token: string
}

interface Token extends JWT {
  id: number
  token: string
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required')
        }

        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
          const response = await fetch(`${apiUrl}/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Invalid credentials' }))
            console.error('Login error response:', error)
            throw new Error(error.message || 'Invalid credentials')
          }

          const data = await response.json()
          
          if (!data.user || !data.token) {
            console.error('Invalid response format:', data)
            throw new Error('Invalid server response')
          }

          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            token: data.token,
          } as User
        } catch (error) {
          console.error('Login error:', error)
          if (error instanceof Error) {
            throw new Error(error.message)
          }
          throw new Error('An unexpected error occurred')
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
        token.token = (user as User).token;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.token = token.token;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
} 