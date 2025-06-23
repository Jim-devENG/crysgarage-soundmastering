/**
 * Audio file data interface
 */
export interface AudioFile {
  /** Audio file's unique identifier */
  id: number;
  /** Original file path */
  original_path: string;
  /** Mastered file path */
  mastered_path: string | null;
  /** Processing status */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  /** Error message if processing failed */
  error_message: string | null;
  /** Original filename */
  original_filename: string;
  /** File MIME type */
  mime_type: string;
  /** File size in bytes */
  file_size: number;
  /** File hash for deduplication */
  hash: string | null;
  /** Additional metadata */
  metadata: Record<string, any> | null;
  /** Creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
}

/**
 * Audio file endpoints
 */
export const AudioEndpoints = {
  /** List audio files endpoint */
  LIST: '/api/audio-files',
  /** Get single audio file endpoint */
  GET: (id: number) => `/api/audio-files/${id}`,
  /** Upload audio file endpoint */
  UPLOAD: '/api/audio-files',
  /** Delete audio file endpoint */
  DELETE: (id: number) => `/api/audio-files/${id}`,
  /** Get audio file playback URL endpoint */
  PLAY: (id: number) => `/api/audio-files/${id}/play`,
} as const; 