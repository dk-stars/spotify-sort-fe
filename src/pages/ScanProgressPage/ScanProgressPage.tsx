import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { pollScan, requestScanCancel, resetScan } from '../../features/scan/scanSlice'
import { resetProposal } from '../../features/proposal/proposalSlice'
import { initSelection } from '../../features/proposal/proposalSlice'
import { useAppDispatch, useAppSelector } from '../../hooks'
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
  const {
    jobId,
    status,
    error,
    currentStep,
    progressPercent,
    currentItem,
    totalItems,
    currentFetchRequest,
    totalFetchRequests,
    canceling,
  } = useAppSelector(s => s.scan)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const activeStepIndex = useMemo(() => {
    const index = STEP_LABELS.findIndex(step => progressPercent <= step.threshold)
    return index === -1 ? STEP_LABELS.length - 1 : index
  }, [progressPercent])
  const activeStage = STEP_LABELS[activeStepIndex]?.label ?? STEP_LABELS[STEP_LABELS.length - 1].label
  const hasItemProgress = totalItems > 0
  const itemProgressLabel = hasItemProgress ? `${currentItem}/${totalItems} tracks` : 'Preparing track iteration'
  const hasFetchProgress = totalFetchRequests > 0
  const fetchProgressPercent = hasFetchProgress ? Math.round((currentFetchRequest / totalFetchRequests) * 100) : 0
  const fetchProgressLabel = hasFetchProgress
    ? `${currentFetchRequest}/${totalFetchRequests} requests`
    : 'Waiting for first track request'

  useEffect(() => {
    if (!jobId) {
      navigate('/')
      return
    }

    const poll = async () => {
      const result = await dispatch(pollScan(jobId))
      if (pollScan.fulfilled.match(result)) {
        const { status: nextStatus, result: scanResult } = result.payload
        if (nextStatus === 'DONE' && scanResult) {
          clearInterval(intervalRef.current!)
          await dispatch(initSelection(scanResult))
          navigate('/dashboard')
        } else if (nextStatus === 'FAILED' || nextStatus === 'CANCELLED') {
          clearInterval(intervalRef.current!)
        }
      }
    }

    poll()
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [jobId, dispatch, navigate])

  const handleCancel = async () => {
    if (!jobId || canceling || status === 'CANCELLED' || status === 'DONE') return
    await dispatch(requestScanCancel(jobId))
  }

  const handleBackHome = () => {
    dispatch(resetProposal())
    dispatch(resetScan())
    navigate('/')
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
          <p className="scan-progress__hint">No proposal was generated.</p>
          <div className="scan-progress__actions">
            <button className="btn btn--ghost" onClick={handleBackHome}>
              Back to source selection
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="scan-progress__card">
            <div className="scan-progress__hero-row">
              <div>
                <div className="scan-progress__eyebrow">Track scan in progress</div>
                <h1 className="scan-progress__title">Building your sorting proposal</h1>
              </div>
              <span className="pill pill--accent">
                Stage {Math.min(activeStepIndex + 1, STEP_LABELS.length)} / {STEP_LABELS.length}
              </span>
            </div>
            <p className="scan-progress__status">
              {currentStep || (status === 'PENDING' ? 'Waiting to start…' : 'Analyzing your tracks…')}
            </p>

            <div className="scan-progress__subsection">
              <div className="scan-progress__subsection-head">
                <span className="scan-progress__subsection-title">Track fetch API requests</span>
                <span className="scan-progress__subsection-meta">{fetchProgressLabel}</span>
              </div>
              <div className="scan-progress__bar scan-progress__bar--fetch" aria-label="Track fetch request progress">
                <div
                  className="scan-progress__bar-fill scan-progress__bar-fill--fetch"
                  style={{ width: `${Math.max(fetchProgressPercent, hasFetchProgress ? 8 : 4)}%` }}
                />
              </div>
            </div>

            <div className="scan-progress__bar" aria-label="Scan progress">
              <div
                className="scan-progress__bar-fill"
                style={{ width: `${Math.max(progressPercent, status === 'PENDING' ? 4 : 8)}%` }}
              />
            </div>
            <div className="scan-progress__bar-meta">
              <span>{progressPercent}%</span>
              <span>
                {canceling
                  ? 'Cancellation requested'
                  : hasItemProgress
                    ? itemProgressLabel
                    : status === 'PENDING'
                      ? 'Preparing job'
                      : 'Working through your library'}
              </span>
            </div>

            <div className="scan-progress__snapshot-grid">
              <div className="scan-progress__snapshot-card">
                <span className="scan-progress__snapshot-label">Active stage</span>
                <strong>{activeStage}</strong>
              </div>
              <div className="scan-progress__snapshot-card">
                <span className="scan-progress__snapshot-label">Current action</span>
                <strong>{currentStep || 'Preparing scan'}</strong>
              </div>
              <div className="scan-progress__snapshot-card">
                <span className="scan-progress__snapshot-label">Track iteration</span>
                <strong>{itemProgressLabel}</strong>
              </div>
              <div className="scan-progress__snapshot-card">
                <span className="scan-progress__snapshot-label">Fetch requests</span>
                <strong>{fetchProgressLabel}</strong>
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
                    <span className="scan-progress__step-dot" />
                    <span>{step.label}</span>
                  </li>
                )
              })}
            </ol>

            <p className="scan-progress__hint">This can take a minute on larger playlists because tags are enriched, normalized, and cached before proposal building.</p>

            <div className="scan-progress__actions">
              <button className="btn btn--ghost" onClick={handleBackHome}>
                Leave page
              </button>
              <button
                className="btn btn--primary"
                onClick={handleCancel}
                disabled={canceling}
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
