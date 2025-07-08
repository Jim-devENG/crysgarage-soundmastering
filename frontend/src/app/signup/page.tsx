import SignupForm from '@/components/SignupForm'
import Link from 'next/link'
import { Suspense } from 'react'

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-gray-900 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20 mt-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-white mb-2 drop-shadow">Join <span className="text-purple-400">Crysgarage</span></h1>
          <p className="text-gray-300">Create your account to start mastering your audio.</p>
        </div>
        <Suspense fallback={<div className="text-center text-gray-400">Loading...</div>}>
          <SignupForm />
        </Suspense>
        <div className="mt-6 text-center">
          <span className="text-gray-400">Already have an account?</span>{' '}
          <Link href="/login" className="text-purple-300 hover:underline font-medium">Sign In</Link>
        </div>
      </div>
    </div>
  )
} 