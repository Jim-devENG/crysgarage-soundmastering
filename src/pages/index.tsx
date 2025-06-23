export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-black to-gray-900">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">Welcome to Your Modern App</h1>
        <p className="text-xl text-gray-300 mb-8">This is a beautiful, modern Next.js + Tailwind starter.</p>
        <a href="/login" className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition">Go to Login</a>
      </div>
    </div>
  );
} 