import type { CompressionResult, ConversionSettings, DimensionPresetKey } from '../types'

export const DIMENSION_PRESETS: Record<Exclude<DimensionPresetKey, 'original' | 'custom'>, { width: number; height: number }> = {
  '1920x1080': { width: 1920, height: 1080 },
  '1280x720': { width: 1280, height: 720 },
  '1024x768': { width: 1024, height: 768 },
  '800x600': { width: 800, height: 600 },
  '640x480': { width: 640, height: 480 },
}

export class UnsupportedImageError extends Error {}

const ACCEPTED_TYPE_PREFIX = 'image/'
const MIN_DIMENSION = 120
const MAX_SHRINK_ATTEMPTS = 9
const SHRINK_FACTOR = 0.85
const QUALITY_SEARCH_STEPS = 7
const MIN_QUALITY = 0.05
const MAX_QUALITY = 0.95

export function isImageFile(file: File): boolean {
  if (file.type && file.type.startsWith(ACCEPTED_TYPE_PREFIX)) return true
  return /\.(jpe?g|png|webp|bmp|gif|avif)$/i.test(file.name)
}

async function loadBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    // Fallback for browsers without full createImageBitmap support
    const url = URL.createObjectURL(file)
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image()
        el.onload = () => resolve(el)
        el.onerror = () => reject(new UnsupportedImageError('Não foi possível ler esta imagem.'))
        el.src = url
      })
      return await createImageBitmap(img)
    } finally {
      URL.revokeObjectURL(url)
    }
  }
}

export interface OriginalImageInfo {
  bitmap: ImageBitmap
  width: number
  height: number
}

export async function readOriginalImage(file: File): Promise<OriginalImageInfo> {
  if (!isImageFile(file)) {
    throw new UnsupportedImageError('Arquivo não é uma imagem suportada.')
  }
  let bitmap: ImageBitmap
  try {
    bitmap = await loadBitmap(file)
  } catch {
    throw new UnsupportedImageError('Não foi possível processar esta imagem. Ela pode estar corrompida ou em um formato não suportado.')
  }
  if (!bitmap.width || !bitmap.height) {
    throw new UnsupportedImageError('Imagem inválida ou corrompida.')
  }
  return { bitmap, width: bitmap.width, height: bitmap.height }
}

function computeTargetBox(
  origW: number,
  origH: number,
  settings: ConversionSettings,
): { width: number; height: number } {
  if (settings.dimensionPreset === 'original') {
    return { width: origW, height: origH }
  }

  let boxW: number
  let boxH: number
  if (settings.dimensionPreset === 'custom') {
    boxW = settings.customWidth > 0 ? settings.customWidth : origW
    boxH = settings.customHeight > 0 ? settings.customHeight : origH
  } else {
    const preset = DIMENSION_PRESETS[settings.dimensionPreset]
    boxW = preset.width
    boxH = preset.height
  }

  if (!settings.maintainAspectRatio && settings.dimensionPreset === 'custom') {
    // Explicit stretch only allowed when user disables "manter proporção" for a custom box.
    return { width: Math.round(boxW), height: Math.round(boxH) }
  }

  const scale = Math.min(boxW / origW, boxH / origH, 1)
  return {
    width: Math.max(1, Math.round(origW * scale)),
    height: Math.max(1, Math.round(origH * scale)),
  }
}

function drawToCanvas(bitmap: ImageBitmap, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Não foi possível criar o canvas de desenho.')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, width, height)
  return canvas
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Falha ao gerar a imagem convertida.'))
      },
      mime,
      quality,
    )
  })
}

interface BestCandidate {
  blob: Blob
  width: number
  height: number
  quality: number | null
}

function isBetter(candidate: BestCandidate, current: BestCandidate | null): boolean {
  if (!current) return true
  return candidate.blob.size < current.blob.size
}

export async function compressImage(
  original: OriginalImageInfo,
  settings: ConversionSettings,
): Promise<CompressionResult> {
  const mime = settings.format === 'jpeg' ? 'image/jpeg' : 'image/png'
  const maxBytes = Math.max(1, Math.round(settings.maxSizeKB * 1024))

  let { width, height } = computeTargetBox(original.width, original.height, settings)

  let attempts = 0
  let smallestOverall: BestCandidate | null = null

  for (let shrink = 0; shrink < MAX_SHRINK_ATTEMPTS; shrink++) {
    const canvas = drawToCanvas(original.bitmap, width, height)

    if (settings.format === 'jpeg') {
      // First check the floor (lowest acceptable quality) to see if this
      // dimension can possibly fit within the limit at all.
      attempts++
      const floorBlob = await canvasToBlob(canvas, mime, MIN_QUALITY)
      const floorCandidate: BestCandidate = { blob: floorBlob, width, height, quality: MIN_QUALITY }
      if (isBetter(floorCandidate, smallestOverall)) smallestOverall = floorCandidate

      if (floorBlob.size <= maxBytes) {
        // Binary search upward for the best quality that still fits.
        let lo = MIN_QUALITY
        let hi = MAX_QUALITY
        let best: BestCandidate = floorCandidate
        for (let i = 0; i < QUALITY_SEARCH_STEPS; i++) {
          const mid = (lo + hi) / 2
          attempts++
          const blob = await canvasToBlob(canvas, mime, mid)
          if (blob.size <= maxBytes) {
            best = { blob, width, height, quality: mid }
            lo = mid
          } else {
            hi = mid
          }
        }
        return {
          blob: best.blob,
          width,
          height,
          sizeBytes: best.blob.size,
          format: settings.format,
          qualityUsed: best.quality,
          withinLimit: true,
          attempts,
        }
      }
    } else {
      // PNG has no quality knob; size depends only on resolution/content.
      attempts++
      const blob = await canvasToBlob(canvas, mime)
      const candidate: BestCandidate = { blob, width, height, quality: null }
      if (isBetter(candidate, smallestOverall)) smallestOverall = candidate

      if (blob.size <= maxBytes) {
        return {
          blob,
          width,
          height,
          sizeBytes: blob.size,
          format: settings.format,
          qualityUsed: null,
          withinLimit: true,
          attempts,
        }
      }
    }

    const nextWidth = Math.round(width * SHRINK_FACTOR)
    const nextHeight = Math.round(height * SHRINK_FACTOR)
    if (nextWidth < MIN_DIMENSION || nextHeight < MIN_DIMENSION) break
    width = nextWidth
    height = nextHeight
  }

  if (!smallestOverall) {
    throw new Error('Não foi possível converter esta imagem.')
  }

  return {
    blob: smallestOverall.blob,
    width: smallestOverall.width,
    height: smallestOverall.height,
    sizeBytes: smallestOverall.blob.size,
    format: settings.format,
    qualityUsed: smallestOverall.quality,
    withinLimit: false,
    attempts,
  }
}

export function buildOutputFilename(originalName: string, format: 'jpeg' | 'png'): string {
  const dot = originalName.lastIndexOf('.')
  const base = dot > 0 ? originalName.slice(0, dot) : originalName
  const ext = format === 'jpeg' ? 'jpg' : 'png'
  return `${base}_hikvision.${ext}`
}
