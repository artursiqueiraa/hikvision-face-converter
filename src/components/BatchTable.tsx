import { formatBytes } from '../lib/format'
import type { ManagedImage } from '../types'

interface BatchTableProps {
  images: ManagedImage[]
  maxSizeKB: number
  onDownload: (image: ManagedImage) => void
  onDownloadAll: () => void
  onRemove: (id: string) => void
}

function StatusCell({ image }: { image: ManagedImage }) {
  if (image.status === 'processing') {
    return <span className="text-slate-400">⏳ Processando</span>
  }
  if (image.status === 'error') {
    return <span title={image.errorMessage} className="text-red-600 dark:text-red-400">🔴 Erro</span>
  }
  if (image.status === 'done' && image.result) {
    return (
      <span className={image.result.withinLimit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
        {image.result.withinLimit ? '🟢' : '🔴'}
      </span>
    )
  }
  return <span className="text-slate-400">⏸ Pendente</span>
}

export function BatchTable({ images, maxSizeKB, onDownload, onDownloadAll, onRemove }: BatchTableProps) {
  const doneCount = images.filter((img) => img.status === 'done').length

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          Conversão em lote
          <span className="ml-2 text-sm font-normal text-slate-400">
            ({doneCount}/{images.length} concluídas · limite {maxSizeKB} KB)
          </span>
        </h2>
        <button
          type="button"
          onClick={onDownloadAll}
          disabled={doneCount === 0}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ⬇ Baixar todas
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
              <th className="py-2 pr-3 font-medium">Arquivo</th>
              <th className="py-2 pr-3 font-medium">Original</th>
              <th className="py-2 pr-3 font-medium">Convertido</th>
              <th className="py-2 pr-3 font-medium">Status</th>
              <th className="py-2 pr-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {images.map((image) => (
              <tr key={image.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800/60">
                <td className="max-w-[180px] truncate py-2.5 pr-3 font-medium text-slate-700 dark:text-slate-200" title={image.file.name}>
                  {image.file.name}
                </td>
                <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400">{formatBytes(image.originalSizeBytes)}</td>
                <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400">
                  {image.result ? formatBytes(image.result.sizeBytes) : '—'}
                </td>
                <td className="py-2.5 pr-3">
                  <StatusCell image={image} />
                </td>
                <td className="py-2.5 pr-3">
                  <div className="flex items-center justify-end gap-3">
                    {image.status === 'done' && (
                      <button
                        type="button"
                        onClick={() => onDownload(image)}
                        className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Baixar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemove(image.id)}
                      className="text-sm font-medium text-slate-400 hover:text-red-500"
                    >
                      Remover
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
