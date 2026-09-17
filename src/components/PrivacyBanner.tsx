export function PrivacyBanner() {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">
      <span>🔒</span>
      <span>
        Suas imagens são processadas localmente no navegador e não são enviadas para um servidor.
      </span>
    </div>
  )
}
