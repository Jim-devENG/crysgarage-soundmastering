'use client'

import { useState } from 'react'
import { Play, Pause, Volume2 } from 'lucide-react'

interface AudioComparisonProps {
  originalPath?: string
  masteredPath?: string
  masteringType?: 'automatic' | 'advanced'
}

export default function AudioComparison({ originalPath, masteredPath, masteringType = 'automatic' }: AudioComparisonProps) {
  const [isPlayingOriginal, setIsPlayingOriginal] = useState(false)
  const [isPlayingMastered, setIsPlayingMastered] = useState(false)
  const [originalAudio, setOriginalAudio] = useState<HTMLAudioElement | null>(null)
  const [masteredAudio, setMasteredAudio] = useState<HTMLAudioElement | null>(null)

  const toggleOriginal = () => {
    if (!originalAudio) {
      const audio = new Audio(originalPath)
      audio.onended = () => setIsPlayingOriginal(false)
      setOriginalAudio(audio)
      audio.play()
      setIsPlayingOriginal(true)
    } else {
      if (isPlayingOriginal) {
        originalAudio.pause()
        setIsPlayingOriginal(false)
      } else {
        originalAudio.play()
        setIsPlayingOriginal(true)
      }
    }
  }

  const toggleMastered = () => {
    if (!masteredAudio) {
      const audio = new Audio(masteredPath)
      audio.onended = () => setIsPlayingMastered(false)
      setMasteredAudio(audio)
      audio.play()
      setIsPlayingMastered(true)
    } else {
      if (isPlayingMastered) {
        masteredAudio.pause()
        setIsPlayingMastered(false)
      } else {
        masteredAudio.play()
        setIsPlayingMastered(true)
      }
    }
  }

  return (
    <div className="bg-gradient-to-r from-gray-800/60 to-gray-700/60 border border-gray-600/50 backdrop-blur-sm rounded-xl p-6">
      <h3 className="text-xl font-bold text-white mb-6 text-center">Before & After Comparison</h3>
      <div className="grid md:grid-cols-2 gap-6">
        {/* Original */}
        <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10">
          <h4 className="text-lg font-semibold text-white mb-4">Original Track</h4>
          <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Volume2 className="w-8 h-8 text-white" />
          </div>
          <button
            onClick={toggleOriginal}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            {isPlayingOriginal ? (
              <>
                <Pause className="w-5 h-5 inline mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-5 h-5 inline mr-2" />
                Play Original
              </>
            )}
          </button>
        </div>

        {/* Mastered */}
        <div className="text-center p-6 bg-gradient-to-r from-red-500/10 to-purple-500/10 rounded-xl border border-red-500/20">
          <h4 className="text-lg font-semibold text-white mb-4">
            {masteringType === 'automatic' ? 'Automatic Master' : 'Advanced Master'}
          </h4>
          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Volume2 className="w-8 h-8 text-white" />
          </div>
          <button
            onClick={toggleMastered}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            {isPlayingMastered ? (
              <>
                <Pause className="w-5 h-5 inline mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-5 h-5 inline mr-2" />
                Play Mastered
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-gray-400 text-sm">
          Compare the original track with the mastered version to hear the difference
        </p>
      </div>
    </div>
  )
} 