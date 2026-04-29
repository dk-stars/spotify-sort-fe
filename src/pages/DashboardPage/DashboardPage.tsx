import { useState } from 'react'
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

function pluralizeTracks(count: number) {
  return `${count} track${count === 1 ? '' : 's'}`
}

function getTrackSubtitle(artistNames: string[]) {
  return artistNames.join(', ')
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

  if (!result) {
    navigate('/')
    return null
  }

  const { playlistsToUpdate, newIdeas } = result
  const nothingSelected = selectedUpdateIds.length === 0 && selectedIdeaTags.length === 0

  const handleApply = () => {
    dispatch(applyProposal())
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
          <h1 className="dashboard__summary-title">Done!</h1>
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
          <h1 className="dashboard__title">Your Proposal</h1>
          <p className="dashboard__subtitle">
            Review the suggested changes and approve what you want.
          </p>
        </div>
        <button
          className="btn btn--primary"
          onClick={handleApply}
          disabled={nothingSelected || executing}
        >
          {executing ? 'Applying…' : 'Apply Selected'}
        </button>
      </header>

      {error && <p className="error-text">{error}</p>}

      <div className="dashboard__panels">
        {/* Panel A: Playlists to Update */}
        <section className="panel">
          <h2 className="panel__title">Playlists to Update</h2>
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

                  return (
                    <li key={u.playlistId} className={`panel__item${expanded ? ' panel__item--expanded' : ''}`}>
                      <div className="panel__item-shell">
                        <label className="panel__item-label">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => dispatch(toggleUpdate(u.playlistId))}
                          />
                          <span className="panel__item-copy">
                            <span className="panel__item-name">{u.playlistName}</span>
                            <span className="panel__item-hint">
                              Add selected tracks to this existing playlist.
                            </span>
                          </span>
                        </label>

                        <div className="panel__item-meta">
                          <span className="panel__item-count">{pluralizeTracks(includedCount)}</span>
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
                                    disabled={!isSelected}
                                    onChange={() => dispatch(toggleUpdateTrack({
                                      playlistId: u.playlistId,
                                      trackUri: track.trackUri,
                                    }))}
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

        {/* Panel B: New Ideas */}
        <section className="panel">
          <h2 className="panel__title">New Ideas</h2>
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

                  return (
                    <li key={idea.tag} className={`panel__item${expanded ? ' panel__item--expanded' : ''}`}>
                      <div className="panel__item-shell">
                        <label className="panel__item-label">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => dispatch(toggleIdea(idea.tag))}
                          />
                          <span className="panel__item-copy">
                            <span className="panel__item-name">{idea.tag}</span>
                            <span className="panel__item-hint">
                              Create a new &ldquo;{idea.tag}&rdquo; playlist from the selected tracks.
                            </span>
                          </span>
                        </label>

                        <div className="panel__item-meta">
                          <span className="panel__item-count">{pluralizeTracks(includedCount)}</span>
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
                                    disabled={!isSelected}
                                    onChange={() => dispatch(toggleIdeaTrack({
                                      tag: idea.tag,
                                      trackUri: track.trackUri,
                                    }))}
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
