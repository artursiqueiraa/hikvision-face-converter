export type OutputFormat = 'jpeg' | 'png'

export type DimensionPresetKey =
  | 'original'
  | '1920x1080'
  | '1280x720'
  | '1024x768'
  | '800x600'
  | '640x480'
  | 'custom'

export interface ConversionSettings {
  format: OutputFormat
  maxSizeKB: number
  maxSizePreset: number | 'custom'
  dimensionPreset: DimensionPresetKey
  customWidth: number
  customHeight: number
  maintainAspectRatio: boolean
  removeExif: boolean
}

export interface CompressionResult {
  blob: Blob
  width: number
  height: number
  sizeBytes: number
  format: OutputFormat
  qualityUsed: number | null
  withinLimit: boolean
  attempts: number
}

export type ImageStatus = 'pending' | 'processing' | 'done' | 'error'

export interface ManagedImage {
  id: string
  file: File
  originalUrl: string
  originalWidth: number
  originalHeight: number
  originalSizeBytes: number
  originalFormat: string
  status: ImageStatus
  errorMessage?: string
  result?: CompressionResult
  resultUrl?: string
  outputFilename?: string
}
