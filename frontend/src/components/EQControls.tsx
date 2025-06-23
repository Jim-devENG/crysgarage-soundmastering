'use client'

import { useState, useEffect } from 'react'
import { presetApi } from '@/lib/api'

interface Band {
  frequency: number
  gain: number
  q: number
}

interface EQControlsProps {
  audioFileId: string
  onApply: (settings: any) => void
}

export default function EQControls({ audioFileId, onApply }: EQControlsProps) {
  const [bands, setBands] = useState<Band[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBands()
  }, [])

  const loadBands = async () => {
    try {
      setLoading(true)
      const response = await presetApi.getEQBands()
      setBands(response.data)
    } catch (err) {
      setError('Failed to load EQ bands')
    } finally {
      setLoading(false)
    }
  }

  const handleGainChange = (index: number, value: number) => {
    const newBands = [...bands]
    newBands[index].gain = value
    setBands(newBands)
  }

  const handleApply = () => {
    onApply({ bands })
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-40 bg-gray-700/50 rounded-lg"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
        {error}
      </div>
    )
  }

  return (
    <div className="bg-gray-800/60 rounded-lg p-6 border border-gray-700/50">
      <h3 className="text-white font-medium mb-6">Equalizer</h3>

      <div className="space-y-6">
        {bands.map((band, index) => (
          <div key={band.frequency} className="space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>{band.frequency}Hz</span>
              <span>{band.gain}dB</span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="0.1"
              value={band.gain}
              onChange={(e) => handleGainChange(index, parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleApply}
        className="mt-6 w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
      >
        Apply EQ
      </button>
    </div>
  )
} 