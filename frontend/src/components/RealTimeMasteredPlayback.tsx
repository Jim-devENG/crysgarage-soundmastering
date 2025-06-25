import React, { useRef, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Download, 
  Volume2, 
  Music, 
  Headphones, 
  BarChart3,
  X,
  Zap,
  Sparkles,
  Settings
} from 'lucide-react';
import type { AudioFile } from '../types/audio'

interface RealTimeMasteredPlaybackProps {
  isVisible: boolean;
  audioFile: AudioFile
  masteringType: 'automatic' | 'advanced';
  masteredPath?: string;
  masteringAnalysis?: any;
  onClose: () => void
  onDownload: (masteringType: 'automatic' | 'advanced') => void
  onDelete: () => void
}

const masteringTypeConfig = {
  'automatic': {
    title: 'Automatic Mastered',
    icon: Sparkles,
    color: 'from-red-500 to-purple-600',
    description: 'AI-powered mastering with genre presets'
  },
  'advanced': {
    title: 'Advanced Studio Mastered',
    icon: Settings,
    color: 'from-blue-500 to-cyan-600',
    description: 'Professional controls with real-time processing'
  }
};

const RealTimeMasteredPlayback: React.FC<RealTimeMasteredPlaybackProps> = ({
  isVisible,
  masteringType,
  audioFile,
  masteredPath,
  masteringAnalysis,
  onClose,
  onDownload,
  onDelete
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isLoading, setIsLoading] = useState(false);

  const config = masteringTypeConfig[masteringType];
  const IconComponent = config.icon;

  useEffect(() => {
    if (isVisible && masteredPath && audioRef.current) {
      const audioUrl = `${process.env.NEXT_PUBLIC_API_URL}/storage/${masteredPath}`;
      audioRef.current.src = audioUrl;
      console.log(`Setting ${masteringType} real-time audio source to:`, audioUrl);
      setIsLoading(true);
    }
  }, [isVisible, masteredPath, masteringType]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoading(false);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return duration > 0 ? (currentTime / duration) * 100 : 0;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed left-4 top-4 bottom-4 w-96 z-40">
      <Card className="h-full bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 shadow-2xl">
        <CardHeader className="border-b border-gray-700 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 bg-gradient-to-r ${config.color} rounded-full flex items-center justify-center`}>
                <IconComponent className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg text-white">{config.title}</CardTitle>
                <p className="text-gray-400 text-sm">{config.description}</p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4 h-full overflow-y-auto">
          {/* Audio File Info */}
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Headphones className="w-4 h-4 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{audioFile?.original_filename}</p>
                <p className="text-gray-400 text-xs">
                  {masteringType === 'automatic' && 'Automatic Mastered Version'}
                  {masteringType === 'advanced' && 'Advanced Studio Mastered Version'}
                </p>
              </div>
              <Badge variant="outline" className="bg-gray-800/50 text-xs">
                {masteringType.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Audio Player */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-center mb-4">
              <div className={`w-16 h-16 bg-gradient-to-r ${config.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                <Music className="w-8 h-8 text-white" />
              </div>
              <p className="text-white font-medium text-sm mb-1">
                {isLoading ? 'Loading mastered audio...' : 'Mastered Audio Ready'}
              </p>
              <p className="text-gray-400 text-xs">
                {masteredPath ? 'Click play to preview your mastered track' : 'No mastered audio available'}
              </p>
            </div>

            {/* Play/Pause Button */}
            <Button 
              onClick={togglePlayback} 
              disabled={!masteredPath || isLoading}
              className={`w-full h-12 text-base font-semibold bg-gradient-to-r ${config.color} hover:opacity-90 transition-all duration-300`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Loading...
                </>
              ) : isPlaying ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Play Mastered
                </>
              )}
            </Button>

            {/* Progress Bar */}
            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-xs text-gray-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <Progress 
                value={getProgressPercentage()} 
                className="h-2 bg-gray-700"
              />
            </div>

            {/* Volume Control */}
            <div className="space-y-2 mt-4">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400 text-xs font-medium">Volume</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* Download Button */}
            <Button 
              onClick={() => onDownload(masteringType)}
              variant="outline"
              className="w-full mt-4 border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Mastered
            </Button>
          </div>

          {/* Mastering Analysis Preview */}
          {masteringAnalysis && (
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-gray-400" />
                <h3 className="text-white font-semibold text-sm">Quick Analysis</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="text-center">
                  <p className="text-gray-400">Loudness</p>
                  <p className={`font-bold ${masteringAnalysis.changes?.loudness_change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {masteringAnalysis.changes?.loudness_change > 0 ? '+' : ''}{masteringAnalysis.changes?.loudness_change}dB
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400">Peak</p>
                  <p className={`font-bold ${masteringAnalysis.changes?.peak_change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {masteringAnalysis.changes?.peak_change > 0 ? '+' : ''}{masteringAnalysis.changes?.peak_change}dB
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400">Dynamic Range</p>
                  <p className={`font-bold ${masteringAnalysis.changes?.dynamic_range_change < 0 ? 'text-blue-400' : 'text-yellow-400'}`}>
                    {masteringAnalysis.changes?.dynamic_range_change > 0 ? '+' : ''}{masteringAnalysis.changes?.dynamic_range_change}dB
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400">Compression</p>
                  <p className="font-bold text-blue-400">
                    {masteringAnalysis.changes?.compression_ratio}x
                  </p>
                </div>
              </div>
              
              {/* Significant Changes */}
              {masteringAnalysis.significant_changes && masteringAnalysis.significant_changes.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <p className="text-gray-400 text-xs mb-2">Key Changes:</p>
                  <ul className="space-y-1">
                    {masteringAnalysis.significant_changes.slice(0, 3).map((change: string, index: number) => (
                      <li key={index} className="text-green-400 text-xs flex items-center gap-1">
                        <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={handleLoadedMetadata}
        onError={(e) => {
          console.error('Audio playback error:', e);
        }}
      />
    </div>
  );
};

export default RealTimeMasteredPlayback; 