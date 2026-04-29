import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadPlaylists } from '../../features/playlists/playlistsSlice'
import { submitScan } from '../../features/scan/scanSlice'
import { useAppDispatch, useAppSelector } from '../../hooks'
import '../../styles/pages/source-select.scss'

const LIKED_SONGS_SOURCE_ID = '__liked_songs__'

function formatTrackCount(count: number) {
  return `${count} track${count === 1 ? '' : 's'}`
}

export default function SourceSelectPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { items, loading, error } = useAppSelector(s => s.playlists)
  const scanLoading = useAppSelector(s => s.scan.loading)

  const [selectedId, setSelectedId] = useState<string>('')
  const [threshold, setThreshold] = useState<number>(10)

  useEffect(() => {
    dispatch(loadPlaylists())
  }, [dispatch])

  useEffect(() => {
    if (!selectedId && items.length > 0) {
      setSelectedId(items[0].id)
    }
  }, [items, selectedId])

  const selectedPlaylist = items.find(item => item.id === selectedId) ?? null
  const totalTrackCount = items.reduce((sum, item) => sum + item.totalTracks, 0)

  const handleStart = async () => {
    if (!selectedId) return
    const result = await dispatch(submitScan({ sourcePlaylistId: selectedId, threshold }))
    if (submitScan.fulfilled.match(result)) {
      navigate('/scan-progress')
    }
  }

  return (
    <div className="source-select">
      <header className="source-select__hero">
        <div>
          <p className="source-select__eyebrow">Source selection</p>
          <h1 className="source-select__title">Choose the collection that should drive this scan.</h1>
          <p className="source-select__subtitle">
            Liked Songs stays first because it gives the broadest signal, but every owned playlist is available with its own track count.
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
              <p className="source-select__panel-copy">Every playlist shows its track total before you commit.</p>
            </div>
            <span className="pill">{items.length} options</span>
          </div>

          {loading ? (
            <p className="loading-text">Loading playlists…</p>
          ) : (
            <div className="source-select__playlist-list" role="radiogroup" aria-label="Source playlist">
              {items.map(p => (
                <label
                  key={p.id}
                  className={`source-select__playlist${selectedId === p.id ? ' source-select__playlist--selected' : ''}`}
                >
                  <span className="selection-switch selection-switch--radio">
                    <input
                      type="radio"
                      name="playlist"
                      value={p.id}
                      checked={selectedId === p.id}
                      onChange={e => setSelectedId(e.target.value)}
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
                    <span className="source-select__playlist-count">{formatTrackCount(p.totalTracks)}</span>
                    {selectedId === p.id ? <span className="pill">Selected</span> : null}
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
            max={50}
            value={threshold}
            onChange={e => setThreshold(Number(e.target.value))}
          />
          <p className="form-hint">
            Proposed tags with fewer than {threshold} tracks will be ignored instead of creating a fresh playlist.
          </p>

          {selectedPlaylist ? (
            <div className="source-select__selection-summary">
              <p className="source-select__selection-label">Current source</p>
              <p className="source-select__selection-name">{selectedPlaylist.name}</p>
              <p className="source-select__selection-copy">
                This scan will analyze {formatTrackCount(selectedPlaylist.totalTracks)} from the selected source.
              </p>
            </div>
          ) : null}

          <button
            className="btn btn--primary source-select__start"
            onClick={handleStart}
            disabled={items.length === 0 || !selectedId || scanLoading}
          >
            {scanLoading ? 'Starting…' : 'Start Scan'}
          </button>
        </aside>
      </div>
    </div>
  )
}
