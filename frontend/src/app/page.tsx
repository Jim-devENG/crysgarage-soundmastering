'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

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

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Professional Audio Mastering
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl">
            Transform your music with AI-powered mastering technology. 
            Get professional-quality results in minutes.
          </p>
          <div className="space-x-4">
            {session ? (
              <Link 
                href="/mastering" 
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition"
              >
                Start Mastering
              </Link>
            ) : (
              <>
                <Link 
                  href="/signup" 
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition"
                >
                  Get Started
                </Link>
                <Link 
                  href="/pricing" 
                  className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition"
                >
                  View Pricing
                </Link>
              </>
            )}
          </div>
        </div>
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
