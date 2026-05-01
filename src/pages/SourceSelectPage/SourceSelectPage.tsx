import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loadPlaylists } from '../../features/playlists/playlistsSlice'
import { submitScan } from '../../features/scan/scanSlice'
import { useAppDispatch, useAppSelector } from '../../hooks'
import '../../styles/pages/source-select.scss'

const LIKED_SONGS_SOURCE_ID = '__liked_songs__'

function formatTrackCount(count: number) {
  return `${count} track${count === 1 ? '' : 's'}`
}

function normalizeTrackCount(count: number | null | undefined) {
  return typeof count === 'number' && count > 0 ? count : 0
}

export default function SourceSelectPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { items, loading, error } = useAppSelector(s => s.playlists)
  const scanLoading = useAppSelector(s => s.scan.loading)

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [threshold, setThreshold] = useState<number>(10)

  useEffect(() => {
    dispatch(loadPlaylists())
  }, [dispatch])

  useEffect(() => {
    if (selectedIds.length === 0 && items.length > 0) {
      setSelectedIds([items[0].id])
    }
  }, [items, selectedIds.length])

  const selectedPlaylists = items.filter(item => selectedIds.includes(item.id))
  const totalTrackCount = items.reduce((sum, item) => sum + normalizeTrackCount(item.totalTracks), 0)
  const selectedTrackCount = selectedPlaylists.reduce((sum, item) => sum + normalizeTrackCount(item.totalTracks), 0)
  const maxThreshold = Math.max(1, Math.min(100, selectedTrackCount))

  useEffect(() => {
    if (threshold > maxThreshold) {
      setThreshold(maxThreshold)
    }
  }, [maxThreshold, threshold])

  const toggleSource = (playlistId: string) => {
    setSelectedIds(current =>
      current.includes(playlistId)
        ? current.filter(id => id !== playlistId)
        : [...current, playlistId],
    )
  }

  const handleStart = async () => {
    if (selectedIds.length === 0 || selectedTrackCount <= 0) return
    const result = await dispatch(submitScan({ sourcePlaylistIds: selectedIds, threshold: Math.min(threshold, maxThreshold) }))
    if (submitScan.fulfilled.match(result)) {
      navigate(`/scan-progress/${result.payload.jobId}`)
    }
  }

  return (
    <div className="source-select">
      <header className="source-select__hero">
        <div>
          <p className="source-select__eyebrow">Source selection</p>
          <h1 className="source-select__title">Choose one or more collections that should drive this scan.</h1>
          <p className="source-select__subtitle">
            Mix Liked Songs with your owned playlists when you want a broader signal. The scan merges selected sources before tag discovery.
          </p>
        </div>

        <div className="source-select__hero-stats">
          <div className="source-select__stat-card">
            <span className="source-select__stat-value">{items.length}</span>
            <span className="source-select__stat-label">available sources</span>
          </div>
          <div className="source-select__stat-card">
            <span className="source-select__stat-value">{totalTrackCount}</span>
            <span className="source-select__stat-label">tracks across visible playlists</span>
          </div>
        </div>
      </header>

      {error && <p className="error-text">{error}</p>}

      <div className="source-select__grid">
        <section className="source-select__panel">
          <div className="source-select__panel-header">
            <div>
              <h2 className="source-select__panel-title">Source library</h2>
              <p className="source-select__panel-copy">Select one or more sources. Zero-track selections are ignored in the threshold cap.</p>
            </div>
            <span className="pill">{selectedIds.length}/{items.length} selected</span>
          </div>

          {loading ? (
            <p className="loading-text">Loading playlists…</p>
          ) : (
            <div className="source-select__playlist-list" role="group" aria-label="Source playlists">
              {items.map(p => (
                <label
                  key={p.id}
                  className={`source-select__playlist${selectedIds.includes(p.id) ? ' source-select__playlist--selected' : ''}`}
                >
                  <span className="selection-switch">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(p.id)}
                      onChange={() => toggleSource(p.id)}
                    />
                    <span className="selection-switch__track">
                      <span className="selection-switch__thumb" />
                    </span>
                  </span>

                  <span className="source-select__playlist-copy">
                    <span className="source-select__playlist-name-row">
                      <span className="source-select__playlist-name">{p.name}</span>
                      {p.id === LIKED_SONGS_SOURCE_ID ? <span className="pill pill--accent">Default</span> : null}
                    </span>
                    <span className="source-select__playlist-note">
                      {p.id === LIKED_SONGS_SOURCE_ID
                        ? 'Recommended for the broadest read on your listening habits.'
                        : 'Scan this owned playlist as the source collection.'}
                    </span>
                  </span>

                  <span className="source-select__playlist-meta">
                    <span className="source-select__playlist-count">{formatTrackCount(normalizeTrackCount(p.totalTracks))}</span>
                    {selectedIds.includes(p.id) ? <span className="pill">Selected</span> : null}
                  </span>
                </label>
              ))}
            </div>
          )}

        </section>

        <aside className="source-select__panel source-select__panel--controls">
          <div className="source-select__panel-header">
            <div>
              <h2 className="source-select__panel-title">Scan rules</h2>
              <p className="source-select__panel-copy">Set how selective the proposal should be.</p>
            </div>
          </div>

          <div className="source-select__setting-head">
            <label className="form-label" htmlFor="threshold">
              Minimum size for a new playlist
            </label>
            <span className="source-select__threshold-pill">{threshold} tracks</span>
          </div>
          <input
            id="threshold"
            type="range"
            className="form-range"
            min={1}
            max={maxThreshold}
            value={threshold}
            disabled={selectedTrackCount <= 0}
            onChange={e => setThreshold(Number(e.target.value))}
          />
          <p className="form-hint">
            Proposed tags with fewer than {Math.min(threshold, maxThreshold)} tracks will be ignored instead of creating a fresh playlist.
          </p>

          {selectedPlaylists.length > 0 ? (
            <div className="source-select__selection-summary">
              <p className="source-select__selection-label">Selected sources</p>
              <p className="source-select__selection-name">{selectedPlaylists.length} source{selectedPlaylists.length === 1 ? '' : 's'}</p>
              <p className="source-select__selection-copy">
                This scan will analyze {formatTrackCount(selectedTrackCount)} from the selected sources.
              </p>
            </div>
          ) : null}

          <div className="source-select__panel-actions">
            <Link className="btn btn--ghost source-select__history" to="/history">
              Scan history
            </Link>
            <button
              className="btn btn--primary source-select__start"
              onClick={handleStart}
              disabled={items.length === 0 || selectedIds.length === 0 || selectedTrackCount <= 0 || scanLoading}
            >
              {scanLoading ? 'Starting…' : 'Start Scan'}
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
