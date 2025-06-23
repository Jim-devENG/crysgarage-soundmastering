import axios from 'axios'
import { getSession } from 'next-auth/react'
import { MasteringSettings } from '@/components/MasteringOptions'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for CORS with credentials
})

// Add request interceptor to include auth token
apiClient.interceptors.request.use(async (config) => {
  let token = undefined
  if (typeof window !== 'undefined') {
    try {
      const session = await getSession()
      token = session?.user?.token
    } catch {}
    if (!token) {
      token = localStorage.getItem('token')
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Helper to get token for manual header injection
async function getAuthHeader() {
  let token = undefined
  try {
    const session = await getSession()
    token = session?.user?.token
  } catch {}
  if (!token && typeof window !== 'undefined') {
    token = localStorage.getItem('token')
  }
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const audioApi = {
  // Upload audio file
  uploadAudio: async (file: File) => {
    const formData = new FormData()
    formData.append('audio', file)
    const authHeader = await getAuthHeader()
    const response = await apiClient.post('/audio/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...authHeader,
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || 1)
        )
        console.log('Upload progress:', percentCompleted)
      },
    })
    return response.data
  },

  // Get all audio files
  getAudioFiles: async () => {
    const response = await apiClient.get('/audio')
    return response.data
  },

  // Get specific audio file
  getAudioFile: async (audioFileId: string) => {
    console.log('API: Getting audio file with ID:', audioFileId)
    console.log('API: Base URL:', API_BASE_URL)
    
    try {
      const response = await apiClient.get(`/audio/${audioFileId}`)
      console.log('API: Response received:', response)
    return response.data
    } catch (error: any) {
      console.error('API: Error getting audio file:', error)
      console.error('API: Error response:', error.response?.data)
      console.error('API: Error status:', error.response?.status)
      throw error
    }
  },

  // Get audio file versions
  getAudioVersions: async (audioFileId: string) => {
    const response = await apiClient.get(`/audio/${audioFileId}/versions`)
    return response.data
  },

  // Apply EQ to audio file
  applyEQ: async (audioFileId: string, eqSettings: any) => {
    const response = await apiClient.post(`/audio/${audioFileId}/eq`, eqSettings)
    return response.data
  },

  // Convert audio to MP3 for browser compatibility
  convertToMP3: async (audioFileId: string) => {
    const response = await apiClient.post(`/audio/${audioFileId}/convert-mp3`)
    return response.data
  },

  // Apply advanced mastering settings
  applyAdvancedMastering: async (audioFileId: string, settings: MasteringSettings) => {
    const response = await apiClient.post(`/audio/${audioFileId}/mastering`, {
      mastering_settings: settings,
    })
    return response.data
  },

  // Get processing presets
  getPresets: async () => {
    const response = await apiClient.get('/presets')
    return response.data
  },

  // Create custom preset
  createPreset: async (presetData: any) => {
    const response = await apiClient.post('/presets', presetData)
    return response.data
  },

  // Update preset
  updatePreset: async (presetId: string, presetData: any) => {
    const response = await apiClient.put(`/presets/${presetId}`, presetData)
    return response.data
  },

  // Delete preset
  deletePreset: async (presetId: string) => {
    const response = await apiClient.delete(`/presets/${presetId}`)
    return response.data
  },

  // Get audio analysis
  getAudioAnalysis: async (audioFileId: string) => {
    const response = await apiClient.get(`/audio/${audioFileId}/analysis`)
    return response.data
  },

  // Download processed audio
  downloadAudio: async (audioFileId: string, format: string = 'wav') => {
    const response = await apiClient.get(`/audio/${audioFileId}/download`, {
      params: { format },
      responseType: 'blob',
    })
    return response.data
  },

  // Get processing status
  getProcessingStatus: async (audioFileId: string) => {
    const response = await apiClient.get(`/audio/${audioFileId}/status`)
    return response.data
  },

  // Retry failed processing
  retryProcessing: async (audioFileId: string) => {
    const response = await apiClient.post(`/audio/${audioFileId}/retry`)
    return response.data
  },

  // Get available genres and quality presets
  getAvailablePresets: async () => {
    const response = await apiClient.get('/audio/presets/available')
    return response.data
  },

  // Chunked upload endpoints
  uploadChunk: async (chunk: Blob, chunkIndex: number, totalChunks: number, fileId: string) => {
    const formData = new FormData()
    formData.append('chunk', chunk)
    formData.append('chunkIndex', chunkIndex.toString())
    formData.append('totalChunks', totalChunks.toString())
    formData.append('fileId', fileId)
    const authHeader = await getAuthHeader()
    const response = await apiClient.post('/audio/upload-chunk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...authHeader,
      },
    })
    return response.data
  },

  cancelUpload: async (fileId: string) => {
    const response = await apiClient.post('/audio/cancel-upload', { fileId })
    return response.data
  },
}

// Processing preset endpoints
export const presetApi = {
  getPresets: async () => {
    const response = await apiClient.get('/processing-presets')
    return response.data
  },

  createPreset: async (preset: any) => {
    const response = await apiClient.post('/processing-presets', preset)
    return response.data
  },

  getPreset: async (presetId: string) => {
    const response = await apiClient.get(`/processing-presets/${presetId}`)
    return response.data
  },

  updatePreset: async (presetId: string, preset: any) => {
    const response = await apiClient.put(`/processing-presets/${presetId}`, preset)
    return response.data
  },

  deletePreset: async (presetId: string) => {
    const response = await apiClient.delete(`/processing-presets/${presetId}`)
    return response.data
  },

  getEQBands: async () => {
    const response = await apiClient.get('/eq/bands')
    return response.data
  },

  getEQStats: async () => {
    const response = await apiClient.get('/eq/stats')
    return response.data
  },
}

// Monitoring endpoints
export const monitoringApi = {
  getSystemStatus: async () => {
    const response = await apiClient.get('/monitoring/system')
    return response.data
  },

  getQueueStatus: async () => {
    const response = await apiClient.get('/monitoring/queues')
    return response.data
  },

  getAudioFileStats: async () => {
    const response = await apiClient.get('/monitoring/audio-files')
    return response.data
  },
}

// Health check endpoints
export const healthApi = {
  checkHealth: async () => {
    const response = await apiClient.get('/health')
    return response.data
  },

  checkDetailedHealth: async () => {
    const response = await apiClient.get('/health/detailed')
    return response.data
  },
}

export const authApi = {
  // Login
  login: async (credentials: { email: string; password: string }) => {
    const response = await apiClient.post('/auth/login', credentials)
    return response.data
  },

  // Register
  register: async (userData: { name: string; email: string; password: string; password_confirmation: string }) => {
    const response = await apiClient.post('/auth/register', userData)
    return response.data
  },

  // Logout
  logout: async () => {
    const response = await apiClient.post('/auth/logout')
    return response.data
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/user')
    return response.data
  },

  // Forgot password
  forgotPassword: async (email: string) => {
    const response = await apiClient.post('/auth/forgot-password', { email })
    return response.data
  },

  // Reset password
  resetPassword: async (token: string, password: string, password_confirmation: string) => {
    const response = await apiClient.post('/auth/reset-password', {
      token,
      password,
      password_confirmation,
    })
    return response.data
  },
}

export const userApi = {
  // Get user profile
  getProfile: async () => {
    const response = await apiClient.get('/user/profile')
    return response.data
  },

  // Update user profile
  updateProfile: async (profileData: any) => {
    const response = await apiClient.put('/user/profile', profileData)
    return response.data
  },

  // Change password
  changePassword: async (passwordData: {
    current_password: string
    password: string
    password_confirmation: string
  }) => {
    const response = await apiClient.put('/user/password', passwordData)
    return response.data
  },

  // Get user statistics
  getStats: async () => {
    const response = await apiClient.get('/user/stats')
    return response.data
  },

  // Get user usage
  getUsage: async () => {
    const response = await apiClient.get('/user/usage')
    return response.data
  },
}

export const paymentApi = {
  // Create payment intent
  createPaymentIntent: async (amount: number, currency: string = 'usd') => {
    const response = await apiClient.post('/payments/create-intent', {
      amount,
      currency,
    })
    return response.data
  },

  // Confirm payment
  confirmPayment: async (paymentIntentId: string) => {
    const response = await apiClient.post('/payments/confirm', {
      payment_intent_id: paymentIntentId,
    })
    return response.data
  },

  // Get payment history
  getPaymentHistory: async () => {
    const response = await apiClient.get('/payments/history')
    return response.data
  },

  // Get subscription status
  getSubscriptionStatus: async () => {
    const response = await apiClient.get('/payments/subscription')
    return response.data
  },
}

// Utility function to handle file downloads
export const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

// Utility function to format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Utility function to format duration
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export default apiClient