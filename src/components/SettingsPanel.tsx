import type { ConversionSettings, DimensionPresetKey } from '../types'

interface SettingsPanelProps {
  settings: ConversionSettings
  onChange: (settings: ConversionSettings) => void
  hikvisionMode: boolean
  onToggleHikvisionMode: (enabled: boolean) => void
}

const SIZE_PRESETS = [50, 100, 150, 200, 250, 500]

const DIMENSION_OPTIONS: { value: DimensionPresetKey; label: string }[] = [
  { value: 'original', label: 'Manter dimensões originais' },
  { value: '1920x1080', label: '1920 × 1080' },
  { value: '1280x720', label: '1280 × 720' },
  { value: '1024x768', label: '1024 × 768' },
  { value: '800x600', label: '800 × 600' },
  { value: '640x480', label: '640 × 480' },
  { value: 'custom', label: 'Personalizado' },
]

export function SettingsPanel({ settings, onChange, hikvisionMode, onToggleHikvisionMode }: SettingsPanelProps) {
  const update = (patch: Partial<ConversionSettings>) => onChange({ ...settings, ...patch })

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Configurações da imagem</h2>
      </div>

      {/* Hikvision quick action */}
      <button
        type="button"
        onClick={() => onToggleHikvisionMode(!hikvisionMode)}
        className={[
          'flex w-full items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 text-left transition',
          hikvisionMode
            ? 'border-blue-600 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/40'
            : 'border-dashed border-blue-300 bg-blue-50/40 hover:border-blue-500 dark:border-blue-800 dark:bg-blue-950/10',
        ].join(' ')}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300">
          ⚡ Otimizar para Hikvision — 200 KB
        </span>
        <span
          className={[
            'flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
            hikvisionMode ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start dark:bg-slate-600',
          ].join(' ')}
        >
          <span className="mx-0.5 h-4 w-4 rounded-full bg-white shadow" />
        </span>
      </button>

      {/* Format */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Formato de saída
        </label>
        <select
          value={settings.format}
          onChange={(e) => update({ format: e.target.value as ConversionSettings['format'] })}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <option value="jpeg">JPEG</option>
          <option value="png">PNG</option>
        </select>
        {settings.format === 'png' && (
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
            PNG é sem perdas: para atingir tamanhos pequenos a aplicação precisará reduzir as dimensões da imagem.
          </p>
        )}
      </div>

      {/* Max size */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Tamanho máximo do arquivo
        </label>
        <select
          value={settings.maxSizePreset}
          onChange={(e) => {
            const value = e.target.value
            if (value === 'custom') {
              update({ maxSizePreset: 'custom' })
            } else {
              const kb = Number(value)
              update({ maxSizePreset: kb, maxSizeKB: kb })
            }
          }}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          {SIZE_PRESETS.map((kb) => (
            <option key={kb} value={kb}>
              {kb} KB
            </option>
          ))}
          <option value="custom">Personalizado</option>
        </select>
        {settings.maxSizePreset === 'custom' && (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              min={5}
              max={20000}
              value={settings.maxSizeKB}
              onChange={(e) => update({ maxSizeKB: Math.max(5, Number(e.target.value) || 0) })}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <span className="text-sm text-slate-500 dark:text-slate-400">KB</span>
          </div>
        )}
      </div>

      {/* Dimensions */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Dimensões</label>
        <select
          value={settings.dimensionPreset}
          onChange={(e) => update({ dimensionPreset: e.target.value as DimensionPresetKey })}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          {DIMENSION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {settings.dimensionPreset === 'custom' && (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              min={16}
              placeholder="Largura"
              value={settings.customWidth || ''}
              onChange={(e) => update({ customWidth: Number(e.target.value) || 0 })}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <span className="text-slate-400">×</span>
            <input
              type="number"
              min={16}
              placeholder="Altura"
              value={settings.customHeight || ''}
              onChange={(e) => update({ customHeight: Number(e.target.value) || 0 })}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        )}
      </div>

      {/* Maintain aspect ratio */}
      <label className="flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={settings.maintainAspectRatio}
          onChange={(e) => update({ maintainAspectRatio: e.target.checked })}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600"
        />
        <span className="text-sm text-slate-700 dark:text-slate-300">
          Manter proporção
          <span className="block text-xs text-slate-400 dark:text-slate-500">
            Recomendado — evita distorcer o rosto da pessoa
          </span>
        </span>
      </label>

      {/* Remove EXIF */}
      <label className="flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={settings.removeExif}
          onChange={(e) => update({ removeExif: e.target.checked })}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600"
        />
        <span className="text-sm text-slate-700 dark:text-slate-300">
          Remover metadados EXIF
          <span className="block text-xs text-slate-400 dark:text-slate-500">
            Os metadados são sempre removidos, pois a imagem é redesenhada durante o processamento
          </span>
        </span>
      </label>

      {hikvisionMode && (
        <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
          <p className="mb-1 font-semibold">👤 Modo Cadastro Facial Hikvision</p>
          <p className="text-blue-800/90 dark:text-blue-300/90">
            Preparar a foto para cadastro facial no equipamento: JPEG, até 200 KB, proporção preservada e
            qualidade ajustada automaticamente.
          </p>
          <p className="mt-2 text-xs text-blue-700/80 dark:text-blue-300/70">
            Para maior compatibilidade, utilize uma imagem JPEG com tamanho inferior ao limite permitido pelo
            equipamento.
          </p>
        </div>
      )}
    </div>
  )
}
