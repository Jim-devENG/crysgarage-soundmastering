import LoginForm from '@/components/LoginForm'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-gray-900 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20 mt-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-white mb-2 drop-shadow">Sign in to <span className="text-purple-400">Crysgarage</span></h1>
          <p className="text-gray-300">Welcome back! Please enter your details to continue.</p>
        </div>
        <LoginForm />
        <div className="mt-6 text-center">
          <span className="text-gray-400">Don&apos;t have an account?</span>{' '}
          <Link href="/signup" className="text-purple-300 hover:underline font-medium">Sign Up</Link>
        </div>
      </div>
    </div>
  )
} 