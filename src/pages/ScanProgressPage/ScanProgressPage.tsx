import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { pollScan } from '../../features/scan/scanSlice'
import { initSelection } from '../../features/proposal/proposalSlice'
import { useAppDispatch, useAppSelector } from '../../hooks'
import '../../styles/pages/scan-progress.scss'

const POLL_INTERVAL_MS = 2500

export default function ScanProgressPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { jobId, status, error } = useAppSelector(s => s.scan)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
        } else if (nextStatus === 'FAILED') {
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

  return (
    <div className="scan-progress">
      {status === 'FAILED' ? (
        <>
          <p className="scan-progress__status scan-progress__status--error">Scan failed</p>
          {error && <p className="error-text">{error}</p>}
          <button className="btn btn--ghost" onClick={() => navigate('/')}>
            Try again
          </button>
        </>
      ) : (
        <>
          <div className="scan-progress__spinner" aria-label="Scanning" />
          <p className="scan-progress__status">
            {status === 'PENDING' ? 'Waiting to start…' : 'Analyzing your tracks…'}
          </p>
          <p className="scan-progress__hint">This may take a minute for large playlists.</p>
        </>
      )}
    </div>
  )
}
