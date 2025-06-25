'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Play, 
  Pause, 
  Volume2, 
  Download, 
  X, 
  Music, 
  Sparkles, 
  Zap, 
  Settings,
  Headphones,
  BarChart3
} from 'lucide-react';

interface AudioPlaybackPopupProps {
  isVisible: boolean;
  masteringType: 'automatic' | 'advanced';
  audioFile: any;
  masteredPath?: string;
  masteringAnalysis?: any;
  onClose: () => void;
  onDownload: (masteringType: 'automatic' | 'advanced') => void;
}

const AudioPlaybackPopup: React.FC<AudioPlaybackPopupProps> = ({
  isVisible,
  masteringType,
  audioFile,
  masteredPath,
  masteringAnalysis,
  onClose,
  onDownload
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  const masteringTypeConfig = {
    'automatic': {
      title: 'Automatic Mastering',
      icon: Sparkles,
      color: 'from-red-500 to-purple-600',
      description: 'AI-powered mastering with genre presets'
    },
    'advanced': {
      title: 'Advanced Studio Mastering',
      icon: Settings,
      color: 'from-blue-500 to-cyan-600',
      description: 'Professional controls with real-time processing'
    }
  };

  const config = masteringTypeConfig[masteringType];
  const IconComponent = config.icon;

  useEffect(() => {
    if (isVisible && masteredPath && audioRef.current) {
      const audioUrl = `${process.env.NEXT_PUBLIC_API_URL}/storage/${masteredPath}`;
      audioRef.current.src = audioUrl;
      console.log(`Setting ${masteringType} audio source to:`, audioUrl);
      setIsLoading(true);
    }
  }, [isVisible, masteredPath, masteringType]);

  console.log('AudioPlaybackPopup render:', { isVisible, masteringType, masteredPath, masteringAnalysis });

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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 shadow-2xl">
        <CardHeader className="border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 bg-gradient-to-r ${config.color} rounded-full flex items-center justify-center`}>
                <IconComponent className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">{config.title}</CardTitle>
                <p className="text-gray-400">{config.description}</p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Audio File Info */}
          <div className="bg-gray-800/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Headphones className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-white font-medium">{audioFile?.original_filename}</p>
                  <p className="text-gray-400 text-sm">
                    {masteringType === 'automatic' && 'Automatic Mastered Version'}
                    {masteringType === 'advanced' && 'Advanced Studio Mastered Version'}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-gray-800/50">
                {masteringType.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Audio Player */}
          <div className="bg-gray-800/50 rounded-xl p-6">
            <div className="text-center mb-6">
              <div className={`w-20 h-20 bg-gradient-to-r ${config.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <Music className="w-10 h-10 text-white" />
              </div>
              <p className="text-white font-medium text-lg mb-2">
                {isLoading ? 'Loading mastered audio...' : 'Mastered Audio Ready'}
              </p>
              <p className="text-gray-400 text-sm">
                {masteredPath ? 'Click play to preview your mastered track' : 'No mastered audio available'}
              </p>
            </div>

            {/* Play/Pause Button */}
            <Button 
              onClick={togglePlayback} 
              disabled={!masteredPath || isLoading}
              className={`w-full h-16 text-xl font-semibold bg-gradient-to-r ${config.color} hover:opacity-90 transition-all duration-300`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  Loading...
                </>
              ) : isPlaying ? (
                <>
                  <Pause className="w-6 h-6 mr-3" />
                  Pause Mastered Audio
                </>
              ) : (
                <>
                  <Play className="w-6 h-6 mr-3" />
                  Play Mastered Audio
                </>
              )}
            </Button>

            {/* Progress Bar */}
            <div className="space-y-3 mt-6">
              <div className="flex justify-between text-sm text-gray-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className={`bg-gradient-to-r ${config.color} h-3 rounded-full transition-all duration-300`}
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
            </div>

            {/* Volume Control */}
            <div className="space-y-3 mt-6">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-gray-400" />
                <span className="text-gray-400 font-medium">Volume</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>

          {/* Mastering Analysis Preview */}
          {masteringAnalysis && (
            <div className="bg-gray-800/50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-5 h-5 text-gray-400" />
                <h3 className="text-white font-semibold">Quick Analysis</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-gray-400">Loudness Change</p>
                  <p className={`font-bold ${masteringAnalysis.changes?.loudness_change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {masteringAnalysis.changes?.loudness_change > 0 ? '+' : ''}{masteringAnalysis.changes?.loudness_change}dB
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400">Peak Change</p>
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
                  <p className="font-bold text-purple-400">
                    {masteringAnalysis.changes?.compression_ratio}:1
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Download Button */}
          <Button 
            onClick={() => onDownload(masteringType)} 
            disabled={!masteredPath}
            className={`w-full h-14 text-lg font-semibold bg-gradient-to-r ${config.color} hover:opacity-90`}
          >
            <Download className="w-6 h-6 mr-3" />
            Download {config.title} Mastered Audio
          </Button>
        </CardContent>
      </Card>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={(e) => {
          console.error('Audio playback error:', e);
        }}
      />
    </div>
  );
};

export default AudioPlaybackPopup;