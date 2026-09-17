export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 KB'
  const kb = bytes / 1024
  if (kb < 1024) {
    return `${kb.toLocaleString('pt-BR', { maximumFractionDigits: kb < 10 ? 1 : 0 })} KB`
  }
  const mb = kb / 1024
  return `${mb.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} MB`
}

export function formatPercent(value: number): string {
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
}

export function reductionPercent(originalBytes: number, newBytes: number): number {
  if (originalBytes <= 0) return 0
  return Math.max(0, ((originalBytes - newBytes) / originalBytes) * 100)
}
