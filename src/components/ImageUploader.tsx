import { useCallback, useRef, useState } from 'react'

interface ImageUploaderProps {
  onFilesSelected: (files: File[]) => void
  compact?: boolean
}

export function ImageUploader({ onFilesSelected, compact }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return
      onFilesSelected(Array.from(fileList))
    },
    [onFilesSelected],
  )

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles],
  )

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
      }}
      className={[
        'group cursor-pointer rounded-2xl border-2 border-dashed transition-colors',
        'flex flex-col items-center justify-center text-center',
        compact ? 'gap-2 p-6' : 'gap-3 p-10 sm:p-14',
        isDragging
          ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/40'
          : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/60 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-blue-500 dark:hover:bg-blue-950/20',
      ].join(' ')}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <div
        className={[
          'flex items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300',
          compact ? 'h-10 w-10' : 'h-16 w-16',
        ].join(' ')}
      >
        <svg viewBox="0 0 24 24" fill="none" className={compact ? 'h-5 w-5' : 'h-8 w-8'}>
          <path
            d="M12 16V4m0 0-4 4m4-4 4 4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p className={compact ? 'text-sm font-medium text-slate-700 dark:text-slate-200' : 'text-base font-semibold text-slate-800 dark:text-slate-100 sm:text-lg'}>
        📷 Arraste sua imagem aqui
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        ou <span className="font-medium text-blue-600 dark:text-blue-400">clique para selecionar</span>
      </p>
      <p className="text-xs text-slate-400 dark:text-slate-500">
        JPG, JPEG, PNG e outros formatos comuns · você pode selecionar várias imagens
      </p>
    </div>
  )
}
