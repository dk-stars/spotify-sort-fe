export function startSequentialPolling(poll: () => Promise<boolean>, intervalMs: number) {
  let cancelled = false
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const run = async () => {
    if (cancelled) return

    const shouldContinue = await poll()
    if (cancelled || !shouldContinue) return

    timeoutId = setTimeout(run, intervalMs)
  }

  void run()

  return () => {
    cancelled = true
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}