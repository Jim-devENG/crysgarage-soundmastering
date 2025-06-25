export interface AudioFile {
  id: string
  original_filename: string
  status: string
  file_size: number
  created_at: string
  mastered_path?: string
  automatic_mastered_path?: string
  advanced_mastered_path?: string
  original_path?: string
  mastering_changes?: any
} 