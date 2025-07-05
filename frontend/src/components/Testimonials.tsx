'use client'

export default function Testimonials() {
  return (
    <div className="text-center p-8 rounded-2xl bg-gradient-to-r from-purple-500/10 to-red-500/10 border border-purple-500/20">
      <h3 className="text-2xl font-bold text-white mb-6">What Musicians Say</h3>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="p-6 bg-white/5 rounded-xl border border-white/10">
          <div className="text-3xl mb-3">⭐</div>
          <p className="text-gray-300 italic mb-4">"Professional quality mastering in minutes! The AI really understands my genre."</p>
          <p className="text-purple-400 font-semibold">- Sarah M., Independent Artist</p>
        </div>
        <div className="p-6 bg-white/5 rounded-xl border border-white/10">
          <div className="text-3xl mb-3">⭐</div>
          <p className="text-gray-300 italic mb-4">"Perfect for my podcast. Clean, clear audio that sounds professional."</p>
          <p className="text-purple-400 font-semibold">- Mike R., Content Creator</p>
        </div>
        <div className="p-6 bg-white/5 rounded-xl border border-white/10">
          <div className="text-3xl mb-3">⭐</div>
          <p className="text-gray-300 italic mb-4">"The advanced controls give me studio-quality results every time."</p>
          <p className="text-purple-400 font-semibold">- Alex K., Music Producer</p>
        </div>
      </div>
    </div>
  )
} 