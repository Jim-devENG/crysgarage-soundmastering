'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import TestUpload from '@/components/TestUpload'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-red-900 flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-6 bg-transparent">
        <div className="flex items-center space-x-2">
          <span className="text-3xl font-extrabold text-white tracking-tight">Crysgarage</span>
        </div>
        <div className="space-x-4">
          {session ? (
            <Link href="/ai-mastering" className="text-white hover:text-red-400 font-medium transition">
              AI Mastering
            </Link>
          ) : (
            <>
          <Link href="/login" className="text-white hover:text-red-400 font-medium transition">Sign In</Link>
          <Link href="/signup" className="text-white hover:text-red-400 font-medium transition">Sign Up</Link>
            </>
          )}
        </div>
      </nav>

      {/* Test Upload Section */}
      <div className="flex-1 p-8">
        <TestUpload />
      </div>

      {/* Footer */}
      <footer className="text-center text-gray-400 py-8 text-sm opacity-70 border-t border-white/10">
        <div className="mb-4">
          <span className="text-white font-semibold">Crysgarage</span> - Professional Audio Mastering
        </div>
        &copy; {new Date().getFullYear()} Crysgarage. All rights reserved.
      </footer>
    </div>
  )
}
