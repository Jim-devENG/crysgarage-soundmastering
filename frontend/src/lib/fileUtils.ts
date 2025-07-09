/**
 * Utility functions for handling file uploads
 */

/**
 * Convert a file path object to a File object
 * This handles cases where file pickers return path objects instead of File objects
 */
export async function pathToFile(filePathObj: any): Promise<File> {
  if (!filePathObj || !filePathObj.path) {
    throw new Error('Invalid file path object')
  }

  const path = filePathObj.path
  const fileName = path.split('/').pop() || path.split('\\').pop() || 'audio.mp3'
  
  // Determine MIME type based on file extension
  const fileType = getMimeType(fileName)
  
  try {
    // Try to read the file using the File API (for browser environments)
    if (typeof window !== 'undefined' && 'File' in window) {
      // For browser environments, we need to use a file input
      // This is a fallback that creates a placeholder file
      const fileContent = new ArrayBuffer(0)
      return new File([fileContent], fileName, { type: fileType })
    } else {
      // For Node.js environments (if this is an Electron app)
      // You would use fs.readFile here
      throw new Error('File reading not implemented for this environment')
    }
  } catch (error) {
    console.error('Error converting path to file:', error)
    throw new Error('Failed to read file from path')
  }
}

/**
 * Get MIME type based on file extension
 */
function getMimeType(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop()
  switch (ext) {
    case 'wav':
      return 'audio/wav'
    case 'mp3':
      return 'audio/mpeg'
    case 'ogg':
      return 'audio/ogg'
    case 'm4a':
      return 'audio/mp4'
    case 'aiff':
      return 'audio/aiff'
    case 'flac':
      return 'audio/flac'
    default:
      return 'audio/mpeg'
  }
}

/**
 * Check if an object is a file path object (has path property but is not a File)
 */
export function isFilePathObject(obj: any): boolean {
  return obj && 
         typeof obj === 'object' && 
         obj.path && 
         !(obj instanceof File) &&
         !(obj instanceof Blob)
}

/**
 * Create a File object from various input types
 */
export async function createFileObject(input: File | any): Promise<File> {
  if (input instanceof File) {
    return input
  }
  
  if (isFilePathObject(input)) {
    return await pathToFile(input)
  }
  
  throw new Error('Invalid file input provided')
} 