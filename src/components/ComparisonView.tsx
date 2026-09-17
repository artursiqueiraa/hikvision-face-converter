import { formatBytes, formatPercent, reductionPercent } from '../lib/format'
import type { ManagedImage } from '../types'
import { SizeBadge } from './SizeBadge'

interface ComparisonViewProps {
  image: ManagedImage
  maxSizeKB: number
  onDownload: () => void
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-800 dark:text-slate-200">{value}</span>
    </div>
  )
}

export function ComparisonView({ image, maxSizeKB, onDownload }: ComparisonViewProps) {
  const { result } = image
  const reduction = result ? reductionPercent(image.originalSizeBytes, result.sizeBytes) : 0

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Resultado</h2>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Original */}
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Original
          </p>
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
            {image.status === 'error' ? (
              <span className="px-4 text-center text-sm text-red-500">{image.errorMessage}</span>
            ) : (
              <img src={image.originalUrl} alt="Original" className="h-full w-full object-contain" />
            )}
          </div>
          <div className="space-y-1 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
            <InfoRow label="Formato" value={image.originalFormat.toUpperCase()} />
            <InfoRow
              label="Dimensões"
              value={image.originalWidth ? `${image.originalWidth} × ${image.originalHeight}` : '—'}
            />
            <InfoRow label="Tamanho" value={formatBytes(image.originalSizeBytes)} />
          </div>
        </div>

        {/* Converted */}
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Convertida
          </p>
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
            {image.resultUrl ? (
              <img src={image.resultUrl} alt="Convertida" className="h-full w-full object-contain" />
            ) : image.status === 'processing' ? (
              <span className="text-sm text-slate-400">Processando...</span>
            ) : image.status === 'error' ? (
              <span className="px-4 text-center text-sm text-red-500">{image.errorMessage}</span>
            ) : (
              <span className="text-sm text-slate-400">Aguardando conversão</span>
            )}
          </div>
          {result ? (
            <div className="space-y-1 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
              <InfoRow label="Formato" value={result.format.toUpperCase()} />
              <InfoRow label="Dimensões" value={`${result.width} × ${result.height}`} />
              <InfoRow label="Tamanho" value={formatBytes(result.sizeBytes)} />
              <InfoRow
                label="Qualidade utilizada"
                value={result.qualityUsed != null ? `${Math.round(result.qualityUsed * 100)}%` : '—'}
              />
              <InfoRow label="Redução" value={formatPercent(reduction)} />
            </div>
          ) : (
            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-400 dark:bg-slate-800/60">
              Ajuste as configurações e clique em converter.
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className="mt-5 flex flex-col items-start gap-4 border-t border-slate-100 pt-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <SizeBadge sizeBytes={result.sizeBytes} maxSizeKB={maxSizeKB} withinLimit={result.withinLimit} />
          <button
            type="button"
            onClick={onDownload}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:w-auto"
          >
            ⬇ Baixar imagem convertida
          </button>
        </div>
      )}

      {result && !result.withinLimit && (
        <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
          Não foi possível atingir {maxSizeKB} KB sem degradar excessivamente a imagem. Este é o menor tamanho
          possível mantendo qualidade aceitável — tente reduzir as dimensões manualmente para um resultado menor.
        </p>
      )}
    </div>
  )
}
