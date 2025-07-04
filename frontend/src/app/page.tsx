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

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 drop-shadow-lg leading-tight">
          Master Your<br />
          <span className="text-red-400">Track,</span><br />
          <span className="text-purple-400">Instantly</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-200 mb-6 max-w-3xl mx-auto leading-relaxed">
          Professional AI-powered mastering that sounds incredible. Upload, process, and perfect your audio files with industry-leading technology.
        </p>
        <p className="text-lg text-purple-300 mb-10 font-medium">
          Made by audio engineers, powered by AI
        </p>
        
        {/* Primary CTA */}
        <div className="mb-16">
          {session ? (
            <Link href="/ai-mastering">
              <span className="inline-block px-12 py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold text-xl shadow-2xl transition-all duration-300 transform hover:scale-105">
                Upload Your Track
              </span>
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <span className="inline-block px-12 py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold text-xl shadow-2xl transition-all duration-300 transform hover:scale-105">
                  Upload Your Track
                </span>
              </Link>
              <Link href="/login">
                <span className="inline-block px-8 py-4 rounded-xl bg-white/10 backdrop-blur-sm text-white font-semibold text-lg border border-white/20 hover:bg-white/20 transition-all duration-300">
                  Sign In
                </span>
              </Link>
            </div>
          )}
        </div>

        {/* Trust Elements */}
        <div className="w-full max-w-4xl mx-auto">
          {/* Social Proof */}
          <div className="mb-12">
            <p className="text-gray-400 text-sm uppercase tracking-wider mb-6">Trusted by Musicians Worldwide</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="text-gray-300 font-semibold">🎵 Independent Artists</div>
              <div className="text-gray-300 font-semibold">🎤 Podcasters</div>
              <div className="text-gray-300 font-semibold">🎧 Content Creators</div>
              <div className="text-gray-300 font-semibold">🎼 Music Producers</div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-white mb-2">Lightning Fast</h3>
              <p className="text-gray-300">Get professional mastering results in minutes, not hours</p>
            </div>
            <div className="text-center p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-white mb-2">Studio Quality</h3>
              <p className="text-gray-300">AI-powered algorithms trained on professional mastering techniques</p>
            </div>
            <div className="text-center p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-bold text-white mb-2">Secure & Private</h3>
              <p className="text-gray-300">Your music stays private with enterprise-grade security</p>
            </div>
          </div>

          {/* Quality Guarantee */}
          <div className="text-center p-8 rounded-2xl bg-gradient-to-r from-purple-500/10 to-red-500/10 border border-purple-500/20">
            <h3 className="text-2xl font-bold text-white mb-4">Quality Guarantee</h3>
            <p className="text-gray-300 text-lg">
              Not satisfied with your mastering? We'll process it again or provide a full refund.
            </p>
          </div>
        </div>
      </main>

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
