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
  const { jobId, status, error, currentStep, progressPercent, canceling } = useAppSelector(s => s.scan)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const activeStepIndex = useMemo(() => {
    const index = STEP_LABELS.findIndex(step => progressPercent <= step.threshold)
    return index === -1 ? STEP_LABELS.length - 1 : index
  }, [progressPercent])

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
        <>
          <p className="scan-progress__status scan-progress__status--error">Scan failed</p>
          {error && <p className="error-text">{error}</p>}
          <button className="btn btn--ghost" onClick={handleBackHome}>
            Try again
          </button>
        </>
      ) : status === 'CANCELLED' ? (
        <>
          <p className="scan-progress__status">Scan cancelled</p>
          <p className="scan-progress__hint">No proposal was generated.</p>
          <button className="btn btn--ghost" onClick={handleBackHome}>
            Back to source selection
          </button>
        </>
      ) : (
        <>
          <div className="scan-progress__card">
            <div className="scan-progress__eyebrow">Track scan in progress</div>
            <p className="scan-progress__status">
              {currentStep || (status === 'PENDING' ? 'Waiting to start…' : 'Analyzing your tracks…')}
            </p>
            <div className="scan-progress__bar" aria-label="Scan progress">
              <div
                className="scan-progress__bar-fill"
                style={{ width: `${Math.max(progressPercent, status === 'PENDING' ? 4 : 8)}%` }}
              />
            </div>
            <div className="scan-progress__bar-meta">
              <span>{progressPercent}%</span>
              <span>{canceling ? 'Cancellation requested' : status === 'PENDING' ? 'Preparing job' : 'Working through your library'}</span>
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

            <p className="scan-progress__hint">This can take a minute on larger playlists because tags are enriched and cached.</p>

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
