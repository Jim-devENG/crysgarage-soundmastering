'use client'

interface QualityMetricsProps {
  analysis?: any
}

export default function QualityMetrics({ analysis }: QualityMetricsProps) {
  if (!analysis) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-gray-800/60 to-gray-700/60 border border-gray-600/50 backdrop-blur-sm rounded-xl p-6">
      <h3 className="text-xl font-bold text-white mb-6 text-center">Mastering Analysis</h3>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="text-2xl font-bold text-green-400 mb-1">
            {analysis.loudness ? `+${analysis.loudness}dB` : 'N/A'}
          </div>
          <div className="text-gray-400 text-sm">Loudness</div>
        </div>
        <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="text-2xl font-bold text-blue-400 mb-1">
            {analysis.dynamic_range ? `${analysis.dynamic_range}dB` : 'N/A'}
          </div>
          <div className="text-gray-400 text-sm">Dynamic Range</div>
        </div>
        <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="text-2xl font-bold text-purple-400 mb-1">
            {analysis.peak ? `${analysis.peak}dB` : 'N/A'}
          </div>
          <div className="text-gray-400 text-sm">Peak Level</div>
        </div>
      </div>
      
      {analysis.eq_changes && (
        <div className="mt-6">
          <h4 className="text-lg font-semibold text-white mb-3">EQ Adjustments</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(analysis.eq_changes).map(([frequency, gain]: [string, any]) => (
              <div key={frequency} className="text-center p-3 bg-white/5 rounded-lg">
                <div className="text-sm text-gray-400">{frequency}Hz</div>
                <div className={`text-lg font-bold ${gain > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {gain > 0 ? '+' : ''}{gain}dB
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 