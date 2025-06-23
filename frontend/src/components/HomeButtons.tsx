'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function HomeButtons() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="flex gap-4 justify-center">
      <Link 
        href="/login" 
        className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
      >
        Sign In
      </Link>
      <Link 
        href="/signup" 
        className="px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition"
      >
        Create Account
      </Link>
    </div>
  )
} 