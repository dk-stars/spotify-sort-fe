import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  toggleUpdate,
  toggleIdea,
  toggleUpdateTrack,
  toggleIdeaTrack,
  applyProposal,
  resetProposal,
} from '../../features/proposal/proposalSlice'
import { resetScan } from '../../features/scan/scanSlice'
import { useAppDispatch, useAppSelector } from '../../hooks'
import '../../styles/pages/dashboard.scss'

function formatTrackCount(selectedCount: number, totalCount: number) {
  return `${selectedCount}/${totalCount} tracks`
}

function getTrackSubtitle(artistNames: string[]) {
  return artistNames.join(', ')
}

function getTopArtists(tracks: { artistNames: string[] }[]) {
  const counts = new Map<string, number>()

  tracks.forEach(track => {
    track.artistNames.forEach(artistName => {
      const normalized = artistName.trim()
      if (!normalized) return
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1)
    })
  })

  const topArtists = [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 3)
    .map(([artistName]) => artistName)

  return topArtists.length > 0 ? topArtists.join(', ') : 'No artist data'
}

function formatPlaylistName(name: string) {
  if (!name) return name
  return name.charAt(0).toUpperCase() + name.slice(1)
}

export default function DashboardPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const {
    selectedUpdateIds,
    selectedIdeaTags,
    excludedUpdateTrackUris,
    excludedIdeaTrackUris,
    executing,
    summary,
    error,
  } =
    useAppSelector(s => s.proposal)
  const result = useAppSelector(s => s.scan.result)
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!result) {
      navigate('/')
    }
  }, [navigate, result])

  if (!result) return null

  const { playlistsToUpdate, newIdeas } = result
  const nothingSelected = selectedUpdateIds.length === 0 && selectedIdeaTags.length === 0
  const totalUpdateTracks = playlistsToUpdate.reduce((sum, item) => sum + item.tracks.length, 0)
  const totalIdeaTracks = newIdeas.reduce((sum, item) => sum + item.tracks.length, 0)
  const selectedTrackCount = playlistsToUpdate
    .filter(item => selectedUpdateIds.includes(item.playlistId))
    .reduce((sum, item) => sum + item.tracks.length - (excludedUpdateTrackUris[item.playlistId] ?? []).length, 0)
    + newIdeas
      .filter(item => selectedIdeaTags.includes(item.tag))
      .reduce((sum, item) => sum + item.tracks.length - (excludedIdeaTrackUris[item.tag] ?? []).length, 0)

  const handleApply = () => {
    dispatch(applyProposal())
  }

  const handleUpdateTrackToggle = (playlistId: string, trackUri: string, isPlaylistSelected: boolean, isTrackSelected: boolean) => {
    if (!isPlaylistSelected) {
      dispatch(toggleUpdate(playlistId))
      if (!isTrackSelected) {
        dispatch(toggleUpdateTrack({ playlistId, trackUri }))
      }
      return
    }

    dispatch(toggleUpdateTrack({ playlistId, trackUri }))
  }

  const handleIdeaTrackToggle = (tag: string, trackUri: string, isPlaylistSelected: boolean, isTrackSelected: boolean) => {
    if (!isPlaylistSelected) {
      dispatch(toggleIdea(tag))
      if (!isTrackSelected) {
        dispatch(toggleIdeaTrack({ tag, trackUri }))
      }
      return
    }

    dispatch(toggleIdeaTrack({ tag, trackUri }))
  }

  const toggleExpanded = (key: string) => {
    setExpandedItems(current => ({ ...current, [key]: !current[key] }))
  }

  const handleReset = () => {
    dispatch(resetProposal())
    dispatch(resetScan())
    navigate('/')
  }

  if (summary) {
    return (
      <div className="dashboard">
        <div className="dashboard__summary">
          <p className="dashboard__eyebrow">Execution complete</p>
          <h1 className="dashboard__summary-title">Your library update is live.</h1>
          <ul className="dashboard__summary-list">
            <li>{summary.playlistsUpdated} playlist(s) updated</li>
            <li>{summary.playlistsCreated} new playlist(s) created</li>
            <li>{summary.totalTracksAdded} track(s) added total</li>
          </ul>
          <button className="btn btn--primary" onClick={handleReset}>
            Organize another playlist
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <p className="dashboard__eyebrow">Proposal review</p>
          <h1 className="dashboard__title">Shape the final library changes.</h1>
          <p className="dashboard__subtitle">
            Review every suggested playlist move, then apply only the tracks and playlists you actually want.
          </p>
        </div>
        <div className="dashboard__header-actions">
          <div className="dashboard__selection-chip">
            <span className="dashboard__selection-chip-value">{selectedTrackCount}</span>
            <span className="dashboard__selection-chip-label">selected tracks</span>
          </div>
          <button
            className="btn btn--primary"
            onClick={handleApply}
            disabled={nothingSelected || executing}
          >
            {executing ? 'Applying…' : 'Apply Selected'}
          </button>
        </div>
      </header>

      <div className="dashboard__stats">
        <div className="dashboard__stat-card">
          <span className="dashboard__stat-value">{playlistsToUpdate.length}</span>
          <span className="dashboard__stat-label">existing playlists to update</span>
        </div>
        <div className="dashboard__stat-card">
          <span className="dashboard__stat-value">{newIdeas.length}</span>
          <span className="dashboard__stat-label">new playlist ideas</span>
        </div>
        <div className="dashboard__stat-card">
          <span className="dashboard__stat-value">{totalUpdateTracks + totalIdeaTracks}</span>
          <span className="dashboard__stat-label">tracks in this proposal</span>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="dashboard__panels">
        <section className="panel">
          <div className="panel__header">
            <div>
              <h2 className="panel__title">Playlists to Update</h2>
              <p className="panel__subtitle">Add strong tag matches into playlists you already own.</p>
            </div>
            <span className="pill">{totalUpdateTracks} tracks</span>
          </div>
          {playlistsToUpdate.length === 0 ? (
            <p className="panel__empty">No matching playlists found.</p>
          ) : (
            <ul className="panel__list">
              {playlistsToUpdate.map(u => (
                (() => {
                  const cardKey = `update:${u.playlistId}`
                  const isSelected = selectedUpdateIds.includes(u.playlistId)
                  const excluded = excludedUpdateTrackUris[u.playlistId] ?? []
                  const includedCount = isSelected ? u.tracks.length - excluded.length : 0
                  const expanded = !!expandedItems[cardKey]
                  const topArtists = getTopArtists(u.tracks)

                  return (
                    <li key={u.playlistId} className={`panel__item${expanded ? ' panel__item--expanded' : ''}`}>
                      <div className="panel__item-shell">
                        <label className="panel__item-label">
                          <span className="selection-switch">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => dispatch(toggleUpdate(u.playlistId))}
                            />
                            <span className="selection-switch__track">
                              <span className="selection-switch__thumb" />
                            </span>
                          </span>
                          <span className="panel__item-copy">
                            <span className="panel__item-name">{u.playlistName}</span>
                            <span className="panel__item-hint">{topArtists}</span>
                          </span>
                        </label>

                        <div className="panel__item-meta">
                          <span className="panel__item-count">{formatTrackCount(includedCount, u.totalTracks)}</span>
                          <button
                            type="button"
                            className="panel__expand"
                            aria-expanded={expanded}
                            aria-label={expanded ? 'Collapse track list' : 'Expand track list'}
                            onClick={() => toggleExpanded(cardKey)}
                          >
                            <span className="panel__expand-icon" aria-hidden="true">⌄</span>
                          </button>
                        </div>
                      </div>

                      {expanded && (
                        <ul className="panel__tracks">
                          {u.tracks.map(track => {
                            const isTrackSelected = !excluded.includes(track.trackUri)
                            return (
                              <li key={track.trackUri} className="panel__track-row">
                                <label className={`panel__track${!isSelected ? ' panel__track--disabled' : ''}`}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected && isTrackSelected}
                                    onChange={() => handleUpdateTrackToggle(u.playlistId, track.trackUri, isSelected, isTrackSelected)}
                                  />
                                  {track.albumImageUrl ? (
                                    <img
                                      className="panel__track-cover"
                                      src={track.albumImageUrl}
                                      alt=""
                                      loading="lazy"
                                    />
                                  ) : (
                                    <span className="panel__track-cover panel__track-cover--placeholder" aria-hidden="true">
                                      {track.trackName.slice(0, 1).toUpperCase()}
                                    </span>
                                  )}
                                  <span className="panel__track-copy">
                                    <span className="panel__track-name">{track.trackName}</span>
                                    <span className="panel__track-artist">{getTrackSubtitle(track.artistNames)}</span>
                                  </span>
                                </label>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </li>
                  )
                })()
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="panel__header">
            <div>
              <h2 className="panel__title">New Ideas</h2>
              <p className="panel__subtitle">Create clean, focused playlists from tags that crossed your threshold.</p>
            </div>
            <span className="pill">{totalIdeaTracks} tracks</span>
          </div>
          {newIdeas.length === 0 ? (
            <p className="panel__empty">No new playlists to suggest.</p>
          ) : (
            <ul className="panel__list">
              {newIdeas.map(idea => (
                (() => {
                  const cardKey = `idea:${idea.tag}`
                  const isSelected = selectedIdeaTags.includes(idea.tag)
                  const excluded = excludedIdeaTrackUris[idea.tag] ?? []
                  const includedCount = isSelected ? idea.tracks.length - excluded.length : 0
                  const expanded = !!expandedItems[cardKey]
                  const topArtists = getTopArtists(idea.tracks)

                  return (
                    <li key={idea.tag} className={`panel__item${expanded ? ' panel__item--expanded' : ''}`}>
                      <div className="panel__item-shell">
                        <label className="panel__item-label">
                          <span className="selection-switch">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => dispatch(toggleIdea(idea.tag))}
                            />
                            <span className="selection-switch__track">
                              <span className="selection-switch__thumb" />
                            </span>
                          </span>
                          <span className="panel__item-copy">
                            <span className="panel__item-name">{formatPlaylistName(idea.tag)}</span>
                            <span className="panel__item-hint">{topArtists}</span>
                          </span>
                        </label>

                        <div className="panel__item-meta">
                          <span className="panel__item-count">{formatTrackCount(includedCount, idea.tracks.length)}</span>
                          <button
                            type="button"
                            className="panel__expand"
                            aria-expanded={expanded}
                            aria-label={expanded ? 'Collapse track list' : 'Expand track list'}
                            onClick={() => toggleExpanded(cardKey)}
                          >
                            <span className="panel__expand-icon" aria-hidden="true">⌄</span>
                          </button>
                        </div>
                      </div>

                      {expanded && (
                        <ul className="panel__tracks">
                          {idea.tracks.map(track => {
                            const isTrackSelected = !excluded.includes(track.trackUri)
                            return (
                              <li key={track.trackUri} className="panel__track-row">
                                <label className={`panel__track${!isSelected ? ' panel__track--disabled' : ''}`}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected && isTrackSelected}
                                    onChange={() => handleIdeaTrackToggle(idea.tag, track.trackUri, isSelected, isTrackSelected)}
                                  />
                                  {track.albumImageUrl ? (
                                    <img
                                      className="panel__track-cover"
                                      src={track.albumImageUrl}
                                      alt=""
                                      loading="lazy"
                                    />
                                  ) : (
                                    <span className="panel__track-cover panel__track-cover--placeholder" aria-hidden="true">
                                      {track.trackName.slice(0, 1).toUpperCase()}
                                    </span>
                                  )}
                                  <span className="panel__track-copy">
                                    <span className="panel__track-name">{track.trackName}</span>
                                    <span className="panel__track-artist">{getTrackSubtitle(track.artistNames)}</span>
                                  </span>
                                </label>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </li>
                  )
                })()
              ))}
            </ul>
          )}
        </section>
      </div>

      <footer className="dashboard__footer">
        <button className="btn btn--ghost" onClick={handleReset}>
          Start over
        </button>
      </footer>
    </div>
  )
}
