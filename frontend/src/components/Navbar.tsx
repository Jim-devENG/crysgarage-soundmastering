'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Sparkles, Music, LogOut, User, BookOpen, DollarSign } from 'lucide-react'

export default function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Sparkles className="text-red-400 w-8 h-8" />
            <span className="text-xl font-bold text-white">Crysgarage</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="/mastering" className="text-gray-300 hover:text-white transition flex items-center gap-2">
              <Music className="w-4 h-4" />
              Mastering
            </Link>
            <Link href="/courses" className="text-gray-300 hover:text-white transition flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Courses
            </Link>
            <Link href="/pricing" className="text-gray-300 hover:text-white transition flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Pricing
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {session ? (
              <>
                <div className="flex items-center space-x-2 text-gray-300">
                  <User className="w-4 h-4" />
                  <span className="text-sm">{session.user?.email}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut()}
                  className="text-gray-300 border-gray-600 hover:bg-gray-800"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="bg-red-600 hover:bg-red-700">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
} 