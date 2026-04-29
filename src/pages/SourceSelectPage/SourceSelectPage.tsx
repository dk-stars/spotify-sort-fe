import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadPlaylists } from '../../features/playlists/playlistsSlice'
import { submitScan } from '../../features/scan/scanSlice'
import { useAppDispatch, useAppSelector } from '../../hooks'
import '../../styles/pages/source-select.scss'

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

  const handleStart = async () => {
    if (!selectedId) return
    const result = await dispatch(submitScan({ sourcePlaylistId: selectedId, threshold }))
    if (submitScan.fulfilled.match(result)) {
      navigate('/scan-progress')
    }
  }

  return (
    <div className="source-select">
      <h1 className="source-select__title">Select Source Playlist</h1>
      <p className="source-select__subtitle">
        Liked Songs is preselected, but you can switch to any playlist you own.
      </p>

      {error && <p className="error-text">{error}</p>}

      <div className="source-select__form">
        <div className="form-group">
          <label className="form-label" htmlFor="playlist-select">
            Source Playlist
          </label>
          {loading ? (
            <p className="loading-text">Loading playlists…</p>
          ) : (
            <select
              id="playlist-select"
              className="form-select"
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
            >
              {items.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}{p.totalTracks > 0 ? ` (${p.totalTracks} tracks)` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="threshold">
            New Playlist Threshold: <strong>{threshold} tracks</strong>
          </label>
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
            Tags with fewer than {threshold} tracks will be ignored instead of creating a new playlist.
          </p>
        </div>

        <button
          className="btn btn--primary"
          onClick={handleStart}
          disabled={items.length === 0 || !selectedId || scanLoading}
        >
          {scanLoading ? 'Starting…' : 'Start Scan'}
        </button>
      </div>
    </div>
  )
}
