import { formatBytes } from '../lib/format'

interface SizeBadgeProps {
  sizeBytes: number
  maxSizeKB: number
  withinLimit: boolean
}

export function SizeBadge({ sizeBytes, maxSizeKB, withinLimit }: SizeBadgeProps) {
  return (
    <div
      className={[
        'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold',
        withinLimit
          ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
          : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
      ].join(' ')}
    >
      <span>{withinLimit ? '🟢' : '🔴'}</span>
      <span>
        {formatBytes(sizeBytes)} / {maxSizeKB} KB — {withinLimit ? 'APROVADO' : 'ACIMA DO LIMITE'}
      </span>
    </div>
  )
}
