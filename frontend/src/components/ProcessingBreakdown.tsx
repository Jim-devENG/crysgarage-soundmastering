'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, Volume2, Waves } from 'lucide-react'

interface ProcessingBreakdownProps {
  results: any
}

export default function ProcessingBreakdown({ results }: ProcessingBreakdownProps) {
  return (
    <Card className="bg-gray-800/60 border-gray-700/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <BarChart3 className="text-red-400" />
          Processing Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-700/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Volume2 className="w-4 h-4 text-red-400" />
              <h4 className="text-sm font-medium text-white">Loudness</h4>
            </div>
            <p className="text-2xl font-bold text-red-400">
              {results.target_loudness || '-14'} dB
            </p>
          </div>
          
          <div className="p-4 bg-gray-700/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-red-400" />
              <h4 className="text-sm font-medium text-white">Dynamic Range</h4>
            </div>
            <p className="text-2xl font-bold text-red-400">
              {results.dynamic_range || 'Natural'}
            </p>
          </div>
          
          <div className="p-4 bg-gray-700/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Waves className="w-4 h-4 text-red-400" />
              <h4 className="text-sm font-medium text-white">Stereo Width</h4>
            </div>
            <p className="text-2xl font-bold text-red-400">
              {results.stereo_width || '0'}%
            </p>
          </div>
          
          <div className="p-4 bg-gray-700/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-red-400" />
              <h4 className="text-sm font-medium text-white">Processing Time</h4>
            </div>
            <p className="text-2xl font-bold text-red-400">
              {results.processing_time ? `${results.processing_time.toFixed(2)}s` : 'N/A'}
            </p>
          </div>
        </div>
        
        {results.analysis && (
          <div className="mt-6 p-4 bg-gray-700/30 rounded-lg">
            <h4 className="text-sm font-medium text-white mb-3">Audio Analysis</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Peak Level:</span>
                <span className="text-white ml-2">{results.analysis.peak_level || 'N/A'} dB</span>
              </div>
              <div>
                <span className="text-gray-400">RMS Level:</span>
                <span className="text-white ml-2">{results.analysis.rms_level || 'N/A'} dB</span>
              </div>
              <div>
                <span className="text-gray-400">Dynamic Range:</span>
                <span className="text-white ml-2">{results.analysis.dynamic_range || 'N/A'} dB</span>
              </div>
              <div>
                <span className="text-gray-400">Crest Factor:</span>
                <span className="text-white ml-2">{results.analysis.crest_factor || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 