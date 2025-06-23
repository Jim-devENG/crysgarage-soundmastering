'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Home() {
  const [mounted, setMounted] = useState(false)

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
          <Link href="/login" className="text-white hover:text-red-400 font-medium transition">Sign In</Link>
          <Link href="/signup" className="text-white hover:text-red-400 font-medium transition">Sign Up</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 drop-shadow-lg">
          Welcome to <span className="text-red-400">Crysgarage</span>
        </h1>
        <p className="text-lg md:text-2xl text-gray-200 mb-10 max-w-2xl mx-auto">
          Master your sound with Crysgarage. Upload, process, and perfect your audio files with our advanced AI-powered mastering tools.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login">
            <span className="inline-block px-8 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-lg shadow-lg transition">Sign In</span>
          </Link>
          <Link href="/signup">
            <span className="inline-block px-8 py-3 rounded-lg bg-white text-red-700 font-semibold text-lg shadow-lg border border-red-600 hover:bg-red-50 transition">Sign Up</span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-gray-400 py-6 text-sm opacity-70">
        &copy; {new Date().getFullYear()} Crysgarage. All rights reserved.
      </footer>
    </div>
  )
}
