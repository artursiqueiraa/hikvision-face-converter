import { useCallback, useMemo, useState } from 'react'
import { Header } from './components/Header'
import { ImageUploader } from './components/ImageUploader'
import { SettingsPanel } from './components/SettingsPanel'
import { ComparisonView } from './components/ComparisonView'
import { BatchTable } from './components/BatchTable'
import { ProgressBar } from './components/ProgressBar'
import { PrivacyBanner } from './components/PrivacyBanner'
import { useDarkMode } from './hooks/useDarkMode'
import {
  buildOutputFilename,
  compressImage,
  readOriginalImage,
  UnsupportedImageError,
  type OriginalImageInfo,
} from './lib/imageProcessing'
import type { ConversionSettings, ManagedImage } from './types'

const DEFAULT_SETTINGS: ConversionSettings = {
  format: 'jpeg',
  maxSizeKB: 200,
  maxSizePreset: 200,
  dimensionPreset: 'original',
  customWidth: 0,
  customHeight: 0,
  maintainAspectRatio: true,
  removeExif: true,
}

const HIKVISION_SETTINGS: ConversionSettings = DEFAULT_SETTINGS

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `img-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default function App() {
  const [isDark, toggleDark] = useDarkMode()
  const [settings, setSettings] = useState<ConversionSettings>(DEFAULT_SETTINGS)
  const [hikvisionMode, setHikvisionMode] = useState(true)
  const [images, setImages] = useState<ManagedImage[]>([])
  const [originalsMap] = useState(() => new Map<string, OriginalImageInfo>())
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  const handleFilesSelected = useCallback((files: File[]) => {
    for (const file of files) {
      const id = createId()
      const originalUrl = URL.createObjectURL(file)
      const initial: ManagedImage = {
        id,
        file,
        originalUrl,
        originalWidth: 0,
        originalHeight: 0,
        originalSizeBytes: file.size,
        originalFormat: file.type ? file.type.replace('image/', '') : (file.name.split('.').pop() ?? '?'),
        status: 'pending',
      }
      setImages((prev) => [...prev, initial])

      readOriginalImage(file)
        .then((info) => {
          originalsMap.set(id, info)
          setImages((prev) =>
            prev.map((img) =>
              img.id === id ? { ...img, originalWidth: info.width, originalHeight: info.height } : img,
            ),
          )
        })
        .catch((err: unknown) => {
          const message =
            err instanceof UnsupportedImageError
              ? err.message
              : 'Não foi possível processar esta imagem. Ela pode estar corrompida ou em um formato não suportado.'
          setImages((prev) =>
            prev.map((img) => (img.id === id ? { ...img, status: 'error', errorMessage: message } : img)),
          )
        })
    }
  }, [originalsMap])

  const handleToggleHikvisionMode = useCallback((enabled: boolean) => {
    setHikvisionMode(enabled)
    if (enabled) {
      setSettings((prev) => ({ ...HIKVISION_SETTINGS, dimensionPreset: prev.dimensionPreset }))
    }
  }, [])

  const runConversion = useCallback(
    async (currentSettings: ConversionSettings) => {
      const targets = images.filter((img) => img.status !== 'error')
      if (targets.length === 0) return

      setIsProcessing(true)
      setProgress({ current: 0, total: targets.length })

      for (let i = 0; i < targets.length; i++) {
        const target = targets[i]
        const original = originalsMap.get(target.id)

        if (!original) {
          setImages((prev) =>
            prev.map((img) =>
              img.id === target.id
                ? { ...img, status: 'error', errorMessage: 'Imagem ainda não está pronta para conversão.' }
                : img,
            ),
          )
          setProgress((p) => ({ ...p, current: p.current + 1 }))
          continue
        }

        setImages((prev) => prev.map((img) => (img.id === target.id ? { ...img, status: 'processing' } : img)))

        try {
          const result = await compressImage(original, currentSettings)
          const resultUrl = URL.createObjectURL(result.blob)
          const outputFilename = buildOutputFilename(target.file.name, currentSettings.format)

          setImages((prev) =>
            prev.map((img) => {
              if (img.id !== target.id) return img
              if (img.resultUrl) URL.revokeObjectURL(img.resultUrl)
              return { ...img, status: 'done', result, resultUrl, outputFilename }
            }),
          )
        } catch {
          setImages((prev) =>
            prev.map((img) =>
              img.id === target.id
                ? { ...img, status: 'error', errorMessage: 'Falha ao converter esta imagem.' }
                : img,
            ),
          )
        }

        setProgress((p) => ({ ...p, current: p.current + 1 }))
      }

      setIsProcessing(false)
    },
    [images, originalsMap],
  )

  const handleOptimizeHikvision = useCallback(() => {
    const next = { ...HIKVISION_SETTINGS, dimensionPreset: settings.dimensionPreset }
    setHikvisionMode(true)
    setSettings(next)
    void runConversion(next)
  }, [runConversion, settings.dimensionPreset])

  const handleConvertClick = useCallback(() => {
    void runConversion(settings)
  }, [runConversion, settings])

  const handleDownload = useCallback((image: ManagedImage) => {
    if (!image.resultUrl || !image.outputFilename) return
    triggerDownload(image.resultUrl, image.outputFilename)
  }, [])

  const handleDownloadAll = useCallback(async () => {
    const done = images.filter((img) => img.status === 'done' && img.resultUrl && img.outputFilename)
    for (const img of done) {
      triggerDownload(img.resultUrl as string, img.outputFilename as string)
      // eslint-disable-next-line no-await-in-loop
      await delay(350)
    }
  }, [images])

  const handleRemove = useCallback(
    (id: string) => {
      setImages((prev) => {
        const target = prev.find((img) => img.id === id)
        if (target) {
          URL.revokeObjectURL(target.originalUrl)
          if (target.resultUrl) URL.revokeObjectURL(target.resultUrl)
        }
        return prev.filter((img) => img.id !== id)
      })
      originalsMap.delete(id)
    },
    [originalsMap],
  )

  const handleNewImages = useCallback(() => {
    images.forEach((img) => {
      URL.revokeObjectURL(img.originalUrl)
      if (img.resultUrl) URL.revokeObjectURL(img.resultUrl)
    })
    originalsMap.clear()
    setImages([])
    setProgress({ current: 0, total: 0 })
  }, [images, originalsMap])

  const handleResetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
    setHikvisionMode(true)
  }, [])

  const isBatch = images.length > 1
  const singleImage = images.length === 1 ? images[0] : null
  const hasImages = images.length > 0

  const readyCount = useMemo(() => images.filter((img) => img.status !== 'error').length, [images])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header isDark={isDark} onToggleDark={toggleDark} />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-5">
          <PrivacyBanner />
        </div>

        {!hasImages && (
          <div className="mx-auto max-w-2xl">
            <ImageUploader onFilesSelected={handleFilesSelected} />
          </div>
        )}

        {hasImages && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {images.length} {images.length === 1 ? 'imagem carregada' : 'imagens carregadas'} · {readyCount}{' '}
                pronta{readyCount === 1 ? '' : 's'} para conversão
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleResetSettings}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Redefinir
                </button>
                <button
                  type="button"
                  onClick={handleNewImages}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Nova imagem
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-6 lg:order-1">
                {singleImage && (
                  <ComparisonView image={singleImage} maxSizeKB={settings.maxSizeKB} onDownload={() => handleDownload(singleImage)} />
                )}

                {isBatch && (
                  <BatchTable
                    images={images}
                    maxSizeKB={settings.maxSizeKB}
                    onDownload={handleDownload}
                    onDownloadAll={handleDownloadAll}
                    onRemove={handleRemove}
                  />
                )}

                <ImageUploader onFilesSelected={handleFilesSelected} compact />

                {isProcessing && <ProgressBar current={progress.current} total={progress.total} />}
              </div>

              <div className="space-y-4 lg:order-2">
                <SettingsPanel
                  settings={settings}
                  onChange={setSettings}
                  hikvisionMode={hikvisionMode}
                  onToggleHikvisionMode={handleToggleHikvisionMode}
                />

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleOptimizeHikvision}
                    disabled={isProcessing || readyCount === 0}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    ⚡ Otimizar para Hikvision — 200 KB
                  </button>
                  <button
                    type="button"
                    onClick={handleConvertClick}
                    disabled={isProcessing || readyCount === 0}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Converter com estas configurações
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 pt-2 text-center text-xs text-slate-400 dark:text-slate-600 sm:px-6">
        Processamento 100% local no navegador · nenhuma imagem é enviada a servidores
      </footer>
    </div>
  )
}
