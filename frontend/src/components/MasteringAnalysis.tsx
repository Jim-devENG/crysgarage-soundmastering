'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

interface MasteringChanges {
  original: {
    rms_level: number;
    peak_level: number;
    dynamic_range: number;
    crest_factor_db: number;
  };
  mastered: {
    rms_level: number;
    peak_level: number;
    dynamic_range: number;
    crest_factor_db: number;
  };
  changes: {
    loudness_change: number;
    peak_change: number;
    dynamic_range_change: number;
    compression_ratio: number;
  };
  significant_changes: string[];
  file_sizes: {
    original_bytes: number;
    mastered_bytes: number;
    size_change_percent: number;
  };
  summary: {
    loudness_increased: boolean;
    peak_increased: boolean;
    dynamic_range_reduced: boolean;
    compression_applied: boolean;
    changes_detected: boolean;
  };
}

interface MasteringAnalysisProps {
  analysis: MasteringChanges | null;
  isLoading?: boolean;
}

const MasteringAnalysis: React.FC<MasteringAnalysisProps> = ({ analysis, isLoading = false }) => {
  console.log('MasteringAnalysis component received:', { analysis, isLoading })
  
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            Analyzing Mastering Changes...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return null;
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getChangeColor = (change: number, isPositive: boolean) => {
    if (Math.abs(change) < 1) return 'text-gray-500';
    return isPositive ? 'text-green-600' : 'text-red-600';
  };

  const getChangeIcon = (change: number) => {
    if (Math.abs(change) < 1) return '→';
    return change > 0 ? '↗' : '↘';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Mastering Analysis</span>
          <Badge variant={analysis.summary.changes_detected ? "default" : "secondary"}>
            {analysis.summary.changes_detected ? 'Changes Detected' : 'No Significant Changes'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Significant Changes */}
        {analysis.significant_changes.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Key Changes:</h4>
            <div className="space-y-1">
              {analysis.significant_changes.map((change, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <span className="text-green-500">✓</span>
                  <span>{change}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audio Metrics Comparison */}
        <div>
          <h4 className="font-semibold mb-3">Audio Metrics Comparison</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Loudness */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Loudness (RMS)</span>
                <span className={getChangeColor(analysis.changes.loudness_change, analysis.summary.loudness_increased)}>
                  {getChangeIcon(analysis.changes.loudness_change)} {analysis.changes.loudness_change > 0 ? '+' : ''}{analysis.changes.loudness_change}dB
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Original: {analysis.original.rms_level}dB</span>
                <span>Mastered: {analysis.mastered.rms_level}dB</span>
              </div>
              <Progress 
                value={Math.max(0, Math.min(100, (analysis.mastered.rms_level + 60) * 1.67))} 
                className="h-2"
              />
            </div>

            {/* Peak Level */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Peak Level</span>
                <span className={getChangeColor(analysis.changes.peak_change, analysis.summary.peak_increased)}>
                  {getChangeIcon(analysis.changes.peak_change)} {analysis.changes.peak_change > 0 ? '+' : ''}{analysis.changes.peak_change}dB
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Original: {analysis.original.peak_level}dB</span>
                <span>Mastered: {analysis.mastered.peak_level}dB</span>
              </div>
              <Progress 
                value={Math.max(0, Math.min(100, (analysis.mastered.peak_level + 60) * 1.67))} 
                className="h-2"
              />
            </div>

            {/* Dynamic Range */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Dynamic Range</span>
                <span className={getChangeColor(analysis.changes.dynamic_range_change, !analysis.summary.dynamic_range_reduced)}>
                  {getChangeIcon(analysis.changes.dynamic_range_change)} {analysis.changes.dynamic_range_change > 0 ? '+' : ''}{analysis.changes.dynamic_range_change}dB
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Original: {analysis.original.dynamic_range}dB</span>
                <span>Mastered: {analysis.mastered.dynamic_range}dB</span>
              </div>
              <Progress 
                value={Math.max(0, Math.min(100, analysis.mastered.dynamic_range * 2))} 
                className="h-2"
              />
            </div>

            {/* Compression Ratio */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Compression Ratio</span>
                <span className={analysis.summary.compression_applied ? 'text-blue-600' : 'text-gray-500'}>
                  {analysis.changes.compression_ratio}:1
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Crest Factor</span>
                <span>{analysis.mastered.crest_factor_db}dB</span>
              </div>
              <Progress 
                value={Math.max(0, Math.min(100, analysis.changes.compression_ratio * 20))} 
                className="h-2"
              />
            </div>
          </div>
        </div>

        {/* File Size Comparison */}
        <div>
          <h4 className="font-semibold mb-2">File Size</h4>
          <div className="flex justify-between items-center">
            <div className="text-sm">
              <span className="text-gray-500">Original: </span>
              <span>{formatBytes(analysis.file_sizes.original_bytes)}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">Mastered: </span>
              <span>{formatBytes(analysis.file_sizes.mastered_bytes)}</span>
            </div>
            <div className={`text-sm font-medium ${analysis.file_sizes.size_change_percent > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {analysis.file_sizes.size_change_percent > 0 ? '+' : ''}{analysis.file_sizes.size_change_percent}%
            </div>
          </div>
        </div>

        {/* Processing Summary */}
        <div className="pt-4 border-t">
          <h4 className="font-semibold mb-2">Processing Summary</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${analysis.summary.loudness_increased ? 'bg-green-500' : 'bg-gray-300'}`}></span>
              <span>Loudness {analysis.summary.loudness_increased ? 'Increased' : 'Decreased'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${analysis.summary.peak_increased ? 'bg-green-500' : 'bg-gray-300'}`}></span>
              <span>Peak Level {analysis.summary.peak_increased ? 'Increased' : 'Decreased'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${analysis.summary.dynamic_range_reduced ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
              <span>Dynamic Range {analysis.summary.dynamic_range_reduced ? 'Reduced' : 'Increased'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${analysis.summary.compression_applied ? 'bg-purple-500' : 'bg-gray-300'}`}></span>
              <span>Compression {analysis.summary.compression_applied ? 'Applied' : 'Not Applied'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MasteringAnalysis; 