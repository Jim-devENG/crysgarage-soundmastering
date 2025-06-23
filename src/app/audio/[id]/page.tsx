'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../lib/api';
import { AudioEndpoints } from '../../../lib/api-docs';
import type { AudioFile } from '../../../lib/api-docs';

interface AudioResponse {
  audio_file: AudioFile;
}

export default function AudioDetail() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const pollingIntervalRef = useRef<number | null>(null);

  // Set mounted state
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Fetch audio file data
  useEffect(() => {
    if (!mounted || !id || !user) return;

    const fetchAudioFile = async () => {
      try {
        const response = await api.get<AudioResponse>(AudioEndpoints.GET(Number(id)));
        setAudioFile(response.data.audio_file);

        // If the file is still processing, start polling
        if (response.data.audio_file.status === 'pending' || response.data.audio_file.status === 'processing') {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
          pollingIntervalRef.current = window.setInterval(fetchAudioFile, 2000);
        } else if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch audio file');
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      }
    };

    fetchAudioFile();

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [id, mounted, user]);

  // Test API routes when audio file is ready
  useEffect(() => {
    if (!mounted || !audioFile?.mastered_path || audioFile.status !== 'completed') {
      return;
    }

    const testApiRoutes = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const audioPath = audioFile.mastered_path;
        console.log('Testing API routes for:', audioPath);

        // Test the debug route
        const testUrl = `http://localhost:8000/api/test-storage/${audioPath}`;
        console.log('Testing debug route:', testUrl);
        
        const testResponse = await fetch(testUrl, {
          method: 'GET',
          mode: 'cors',
          credentials: 'include'
        });
        
        if (testResponse.ok) {
          const testData = await testResponse.json();
          setTestResults(testData);
          console.log('Test results:', testData);
        } else {
          console.error('Test route failed:', testResponse.status, testResponse.statusText);
        }

        // Test the actual storage route
        const audioUrl = `http://localhost:8000/api/storage/${audioPath}`;
        console.log('Testing storage route:', audioUrl);
        
        const response = await fetch(audioUrl, { 
          method: 'HEAD',
          mode: 'cors',
          credentials: 'include'
        });
        
        console.log('Storage route response:', response.status, response.statusText);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          throw new Error(`Audio file not accessible: ${response.status} ${response.statusText}`);
        }
        
        console.log('Audio file accessibility check passed');
        setIsLoading(false);

      } catch (err) {
        console.error('API test failed:', err);
        setError(`API test failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setIsLoading(false);
      }
    };

    testApiRoutes();
  }, [audioFile?.mastered_path, audioFile?.status, mounted]);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  if (!mounted || !user) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto">
          <div className="p-4 bg-red-50 text-red-700 rounded-lg">
            <h3 className="font-semibold mb-2">Error</h3>
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!audioFile) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Audio File #{audioFile.id}</h1>

        {audioFile.status === 'pending' && (
          <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg mb-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-700 mr-2"></div>
              Processing your audio file...
            </div>
          </div>
        )}

        {audioFile.status === 'processing' && (
          <div className="p-4 bg-blue-50 text-blue-700 rounded-lg mb-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
              Mastering your audio file...
            </div>
          </div>
        )}

        {audioFile.status === 'failed' && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Processing Failed</h3>
            <p>{audioFile.error_message || 'Processing failed'}</p>
          </div>
        )}

        {audioFile.status === 'completed' && audioFile.mastered_path && (
          <div className="space-y-4">
            {isLoading && (
              <div className="p-4 bg-blue-50 text-blue-700 rounded-lg mb-4">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
                  Testing API routes...
                </div>
              </div>
            )}

            {testResults && (
              <div className="p-4 bg-green-50 text-green-700 rounded-lg mb-4">
                <h3 className="font-semibold mb-2">API Test Results</h3>
                <pre className="text-xs overflow-auto">{JSON.stringify(testResults, null, 2)}</pre>
              </div>
            )}

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-4">HTML5 Audio Player (Test)</h3>
              <audio
                ref={audioRef}
                src={`http://localhost:8000/api/storage/${audioFile.mastered_path}`}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                onError={(e) => {
                  console.error('Audio error:', e);
                  setError('Failed to load audio with HTML5 player');
                }}
                controls
                className="w-full"
              />
            </div>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={handlePlayPause}
                disabled={isLoading}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Testing...
                  </>
                ) : isPlaying ? (
                  '⏸️ Pause'
                ) : (
                  '▶️ Play'
                )}
              </button>
            </div>

            <div className="text-sm text-gray-600 text-center space-y-1">
              <p><strong>File:</strong> {audioFile.mastered_path}</p>
              <p><strong>Status:</strong> {audioFile.status}</p>
              <p><strong>API URL:</strong> <code>http://localhost:8000/api/storage/{audioFile.mastered_path}</code></p>
              <p><strong>Test URL:</strong> <code>http://localhost:8000/api/test-storage/{audioFile.mastered_path}</code></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 