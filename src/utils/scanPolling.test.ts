import { afterEach, describe, expect, it, vi } from 'vitest'
import { startSequentialPolling } from './scanPolling'

afterEach(() => {
  vi.useRealTimers()
})

describe('startSequentialPolling', () => {
  it('waits for each poll to settle before scheduling the next run', async () => {
    vi.useFakeTimers()

    const firstResolver: { current: ((value: boolean) => void) | null } = { current: null }
    const poll = vi.fn(
      () =>
        new Promise<boolean>(resolve => {
          firstResolver.current = resolve
        }),
    )

    const stop = startSequentialPolling(poll, 1000)

    expect(poll).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1000)
    expect(poll).toHaveBeenCalledTimes(1)

    if (firstResolver.current) {
      firstResolver.current(true)
    }
    await Promise.resolve()
    await vi.advanceTimersByTimeAsync(1000)

    expect(poll).toHaveBeenCalledTimes(2)
    stop()
  })

  it('stops scheduling when a poll returns false', async () => {
    vi.useFakeTimers()

    const poll = vi.fn().mockResolvedValue(false)
    const stop = startSequentialPolling(poll, 1000)

    expect(poll).toHaveBeenCalledTimes(1)

    await Promise.resolve()
    await vi.advanceTimersByTimeAsync(1000)

    expect(poll).toHaveBeenCalledTimes(1)
    stop()
  })
})
