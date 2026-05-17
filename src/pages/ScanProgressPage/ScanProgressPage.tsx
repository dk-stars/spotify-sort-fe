import { useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { pollScan, requestScanCancel, resetScan } from '../../features/scan/scanSlice'
import { initSelection, resetProposal } from '../../features/proposal/proposalSlice'
import { useAppDispatch, useAppSelector } from '../../hooks'
import { startSequentialPolling } from '../../utils/scanPolling'
import '../../styles/pages/scan-progress.scss'

const POLL_INTERVAL_MS = 2500

const STEP_LABELS = [
  { threshold: 10, label: 'Queue' },
  { threshold: 30, label: 'Tracks' },
  { threshold: 55, label: 'Tags' },
  { threshold: 80, label: 'Playlists' },
  { threshold: 100, label: 'Proposal' },
]

export default function ScanProgressPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const routeJobId = useParams().jobId
  const {
    jobId,
    status,
    error,
    progressPercent,
    currentItem,
    totalItems,
    canceling,
  } = useAppSelector(s => s.scan)
  const activeJobId = routeJobId ? Number(routeJobId) : jobId

  const activeStepIndex = useMemo(() => {
    const index = STEP_LABELS.findIndex(step => progressPercent <= step.threshold)
    return index === -1 ? STEP_LABELS.length - 1 : index
  }, [progressPercent])
  const hasItemProgress = totalItems > 0
  const itemProgressLabel = hasItemProgress ? `${currentItem}/${totalItems} tracks` : null

  const getStepProgress = (index: number) => {
    const start = index === 0 ? 0 : STEP_LABELS[index - 1].threshold
    const end = STEP_LABELS[index].threshold
    const active = index === activeStepIndex

    if (progressPercent >= end) return 100
    if (progressPercent <= start) return 0

    // For active Tracks or Tags step with item progress, show item-level progress
    if (active && hasItemProgress && (STEP_LABELS[index].label === 'Tracks' || STEP_LABELS[index].label === 'Tags')) {
      return Math.round((currentItem / totalItems) * 100)
    }

    return Math.max(8, Math.round(((progressPercent - start) / (end - start)) * 100))
  }

  const getStepMeta = (label: string, index: number) => {
    const complete = index < activeStepIndex || progressPercent >= STEP_LABELS[index].threshold
    const active = index === activeStepIndex

    if ((label === 'Tracks' || label === 'Tags') && active && itemProgressLabel) {
      return itemProgressLabel
    }
    if (complete) {
      return 'Done'
    }
    if (active) {
      if (status === 'CANCELLING') return 'Cancelling'
      if (label === 'Queue') return 'Queued'
      if (label === 'Playlists') return 'Matching playlists'
      if (label === 'Proposal') return 'Finalizing'
      return 'In progress'
    }
    return 'Pending'
  }

  useEffect(() => {
    if (!activeJobId || Number.isNaN(activeJobId)) {
      navigate('/')
      return
    }

    return startSequentialPolling(async () => {
      const result = await dispatch(pollScan(activeJobId))
      if (pollScan.fulfilled.match(result)) {
        const { status: nextStatus, result: scanResult } = result.payload
        if (nextStatus === 'DONE' && scanResult) {
          await dispatch(initSelection(scanResult))
          navigate(`/dashboard/${activeJobId}`)
          return false
        }
        if (nextStatus === 'FAILED' || nextStatus === 'CANCELLED') {
          return false
        }
        return true
      }

      if (pollScan.rejected.match(result)) {
        navigate('/')
        return false
      }
      return true
    }, POLL_INTERVAL_MS)
  }, [activeJobId, dispatch, navigate])

  const handleCancel = async () => {
    if (!activeJobId || canceling || status === 'CANCELLING' || status === 'CANCELLED' || status === 'DONE') return
    await dispatch(requestScanCancel(activeJobId))
  }

  const handleBackHome = () => {
    dispatch(resetProposal())
    dispatch(resetScan())
    navigate('/')
  }

  const handleLeavePage = () => {
    navigate('/history')
  }

  return (
    <div className="scan-progress">
      {status === 'FAILED' ? (
        <div className="scan-progress__card scan-progress__card--state">
          <p className="scan-progress__eyebrow">Scan interrupted</p>
          <h1 className="scan-progress__title">Scan failed</h1>
          {error && <p className="error-text">{error}</p>}
          <div className="scan-progress__actions">
            <button className="btn btn--ghost" onClick={handleBackHome}>
              Try again
            </button>
          </div>
        </div>
      ) : status === 'CANCELLED' ? (
        <div className="scan-progress__card scan-progress__card--state">
          <p className="scan-progress__eyebrow">Scan cancelled</p>
          <h1 className="scan-progress__title">No proposal was generated.</h1>
          <p className="scan-progress__hint">You can start a new scan from source selection when you're ready.</p>
          <div className="scan-progress__actions">
            <button className="btn btn--ghost" onClick={handleBackHome}>
              Back to source selection
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="scan-progress__card">
            {(canceling || status === 'CANCELLING') && (
              <div className="scan-progress__cancel-overlay">
                <div className="scan-progress__cancel-spinner" />
                <p className="scan-progress__cancel-label">Stopping current step…</p>
              </div>
            )}
            <div className="scan-progress__hero-row">
              <div>
                <div className="scan-progress__eyebrow">Track scan in progress</div>
                <h1 className="scan-progress__title">Building your sorting proposal</h1>
                <p className="scan-progress__status">
                  {status === 'CANCELLING'
                    ? 'Cancellation in progress. The current operation will stop shortly.'
                    : status === 'PENDING'
                      ? 'Your scan is queued and about to begin.'
                      : 'Each stage fills as the scan moves through your library.'}
                </p>
              </div>
              <div className="scan-progress__counter">
                <span className="scan-progress__counter-value">{itemProgressLabel ?? `${progressPercent}%`}</span>
                <span className="scan-progress__counter-label">
                  {itemProgressLabel ? 'current step progress' : 'overall progress'}
                </span>
              </div>
            </div>

            <ol className="scan-progress__steps">
              {STEP_LABELS.map((step, index) => {
                const complete = index < activeStepIndex || progressPercent >= step.threshold
                const active = index === activeStepIndex
                return (
                  <li
                    key={step.label}
                    className={`scan-progress__step${complete ? ' scan-progress__step--complete' : ''}${active ? ' scan-progress__step--active' : ''}`}
                  >
                    <div className="scan-progress__step-fill" style={{ width: `${complete ? 100 : getStepProgress(index)}%` }} />
                    <div className="scan-progress__step-shell">
                      <div className="scan-progress__step-head">
                        <span className="scan-progress__step-dot" />
                        <span>{step.label}</span>
                      </div>
                      <span className="scan-progress__step-meta">{getStepMeta(step.label, index)}</span>
                    </div>
                  </li>
                )
              })}
            </ol>

            <p className="scan-progress__hint">This can take a minute on larger playlists because tags are enriched, normalized, and cached before proposal building.</p>

            <div className="scan-progress__actions">
              <button className="btn btn--ghost" onClick={handleLeavePage}>
                Leave page
              </button>
              <button
                className="btn btn--primary"
                onClick={handleCancel}
                disabled={canceling || status === 'CANCELLING'}
              >
                {canceling ? 'Cancelling…' : 'Cancel scan'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
