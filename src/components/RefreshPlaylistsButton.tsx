import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../hooks'
import { refreshPlaylists } from '../api/apiClient'
import { loadPlaylists } from '../features/playlists/playlistsSlice'

export default function RefreshPlaylistsButton() {
  const dispatch = useAppDispatch()
  const loading = useAppSelector(s => s.playlists.loading)
  const itemsLength = useAppSelector(s => s.playlists.items.length)
  const [refreshing, setRefreshing] = useState(false)

  const disabled = refreshing || loading || itemsLength === 0

  const handleClick = async () => {
    if (disabled) return
    setRefreshing(true)
    try {
      await refreshPlaylists()
      dispatch(loadPlaylists())
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to refresh playlists', e)
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <button
      type="button"
      className={`source-select__refresh-button ${refreshing ? 'is-loading' : ''}`}
      onClick={handleClick}
      disabled={disabled}
      aria-label="Refresh playlists"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12a9 9 0 1 0-3.2 6.6" />
        <polyline points="21 3 21 9 15 9" />
      </svg>
    </button>
  )
}
