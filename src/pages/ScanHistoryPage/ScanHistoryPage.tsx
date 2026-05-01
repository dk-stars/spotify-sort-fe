import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchScanHistory, undoProposal } from '../../api/apiClient'
import type { ScanHistoryItem, ScanStatus } from '../../types'
import '../../styles/pages/scan-history.scss'

const POLL_INTERVAL_MS = 3000

function isActiveStatus(status: ScanStatus) {
  return status === 'PENDING' || status === 'RUNNING' || status === 'CANCELLING'
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatSourceSummary(sourcePlaylistIds: string[]) {
  if (sourcePlaylistIds.length === 0) return 'No source metadata'
  if (sourcePlaylistIds.length === 1) return '1 source'
  return `${sourcePlaylistIds.length} sources`
}

function getTargetHref(item: ScanHistoryItem) {
  return item.status === 'DONE' && item.hasResult
    ? `/results/${item.jobId}`
    : `/scan-progress/${item.jobId}`
}

export default function ScanHistoryPage() {
  const [items, setItems] = useState<ScanHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [undoingJobId, setUndoingJobId] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    let intervalId: ReturnType<typeof setInterval> | null = null

    const loadHistory = async () => {
      try {
        const history = await fetchScanHistory()
        if (cancelled) return
        setItems(history)
        setError(null)
        setLoading(false)

        const hasActiveJob = history.some(item => isActiveStatus(item.status))
        if (!intervalId && hasActiveJob) {
          intervalId = setInterval(() => {
            void loadHistory()
          }, POLL_INTERVAL_MS)
        }
        if (intervalId && !hasActiveJob) {
          clearInterval(intervalId)
          intervalId = null
        }
      } catch (loadError) {
        if (cancelled) return
        setError(loadError instanceof Error ? loadError.message : 'Failed to load scan history')
        setLoading(false)
      }
    }

    void loadHistory()

    return () => {
      cancelled = true
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [])

  const refreshHistory = async () => {
    const history = await fetchScanHistory()
    setItems(history)
  }

  const handleUndo = async (jobId: number) => {
    setUndoingJobId(jobId)
    try {
      await undoProposal(jobId)
      await refreshHistory()
      setError(null)
    } catch (undoError) {
      setError(undoError instanceof Error ? undoError.message : 'Failed to undo changes')
    } finally {
      setUndoingJobId(null)
    }
  }

  return (
    <div className="scan-history">
      <header className="scan-history__header">
        <div>
          <p className="scan-history__eyebrow">Scan history</p>
          <h1 className="scan-history__title">Re-open active scans, completed proposals, and applied results.</h1>
          <p className="scan-history__subtitle">
            Running jobs stay live here. Completed scans open a read-only result view where you can modify or undo applied changes.
          </p>
        </div>
        <Link className="btn btn--ghost" to="/">
          New scan
        </Link>
      </header>

      {error ? <p className="error-text">{error}</p> : null}

      {loading ? (
        <p className="loading-text">Loading scan history…</p>
      ) : items.length === 0 ? (
        <div className="scan-history__empty">
          <p className="scan-history__empty-title">No scans yet.</p>
          <p className="scan-history__empty-copy">Start a scan from the source selection page to build your first proposal.</p>
        </div>
      ) : (
        <ul className="scan-history__list">
          {items.map(item => {
            const active = isActiveStatus(item.status)
            return (
              <li key={item.jobId} className={`scan-history__item${active ? ' scan-history__item--active' : ''}`}>
                <div className="scan-history__item-head">
                  <div>
                    <div className="scan-history__status-row">
                      <span className={`pill${active ? ' pill--accent' : ''}`}>{item.status}</span>
                      {active ? <span className="scan-history__spinner" aria-hidden="true" /> : null}
                      {item.applied && !item.undone ? <span className="pill">Applied</span> : null}
                      {item.undone ? <span className="pill">Undone</span> : null}
                    </div>
                    <h2 className="scan-history__item-title">Scan #{item.jobId}</h2>
                    <p className="scan-history__item-copy">{item.currentStep || 'Waiting for status'}</p>
                  </div>

                  <div className="scan-history__actions">
                    <Link className="btn btn--primary" to={getTargetHref(item)}>
                      {active ? 'Open progress' : 'Open result'}
                    </Link>
                    {item.canUndo ? (
                      <button className="btn btn--ghost" onClick={() => handleUndo(item.jobId)} disabled={undoingJobId === item.jobId}>
                        {undoingJobId === item.jobId ? 'Undoing…' : 'Undo'}
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="scan-history__meta-grid">
                  <div className="scan-history__meta-card">
                    <span className="scan-history__meta-label">Created</span>
                    <strong>{formatDate(item.createdAt)}</strong>
                  </div>
                  <div className="scan-history__meta-card">
                    <span className="scan-history__meta-label">Sources</span>
                    <strong>{formatSourceSummary(item.sourcePlaylistIds)}</strong>
                  </div>
                  <div className="scan-history__meta-card">
                    <span className="scan-history__meta-label">Threshold</span>
                    <strong>{item.threshold} tracks</strong>
                  </div>
                  <div className="scan-history__meta-card">
                    <span className="scan-history__meta-label">Progress</span>
                    <strong>{item.progressPercent}%</strong>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}