import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  toggleUpdate,
  toggleIdea,
  toggleUpdateTrack,
  toggleIdeaTrack,
  selectSingleUpdateTrack,
  selectSingleIdeaTrack,
  initSelection,
  restoreSelectionFromExecution,
  setDeleteFromSources,
  applyProposal,
  resetProposal,
} from '../../features/proposal/proposalSlice'
import { fetchScanStatus } from '../../api/apiClient'
import { hydrateScan, resetScan } from '../../features/scan/scanSlice'
import { useAppDispatch, useAppSelector } from '../../hooks'
import { findMatchingSelectionKey, formatPlaylistName, formatSuggestedCount, formatTrackCount, getTopArtists, getTrackSubtitle } from '../../utils/scanView'
import '../../styles/pages/dashboard.scss'

export default function DashboardPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { jobId: routeJobId } = useParams()
  const {
    selectedUpdateIds,
    selectedIdeaTags,
    excludedUpdateTrackUris,
    excludedIdeaTrackUris,
    executing,
    deleteFromSources,
    summary,
    error,
  } =
    useAppSelector(s => s.proposal)
  const result = useAppSelector(s => s.scan.result)
  const scanJobId = useAppSelector(s => s.scan.jobId)
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})
  const [loadingSavedProposal, setLoadingSavedProposal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const getSelectedIdeaKey = (tag: string) => findMatchingSelectionKey(selectedIdeaTags, tag)
  const isIdeaSelected = (tag: string) => getSelectedIdeaKey(tag) !== undefined

  useEffect(() => {
    if (!routeJobId) {
      if (!result) {
        navigate('/')
      }
      return
    }

    let cancelled = false

    const loadSavedProposal = async () => {
      setLoadingSavedProposal(true)
      try {
        const details = await fetchScanStatus(Number(routeJobId))
        if (cancelled) return

        if (details.status !== 'DONE' || !details.result) {
          navigate(`/scan-progress/${routeJobId}`)
          return
        }

        dispatch(hydrateScan(details))
        if (details.executionRequest) {
          dispatch(restoreSelectionFromExecution({ result: details.result, executionRequest: details.executionRequest }))
        } else {
          dispatch(initSelection(details.result))
        }
      } catch {
        if (!cancelled) {
          navigate('/')
        }
      } finally {
        if (!cancelled) {
          setLoadingSavedProposal(false)
        }
      }
    }

    if (Number(routeJobId) !== scanJobId || !result) {
      void loadSavedProposal()
    }

    return () => {
      cancelled = true
    }
  }, [dispatch, navigate, result, routeJobId, scanJobId])

  // All hooks must be called before any conditional returns
  const sortedIdeas = useMemo(
    () => result ? [...result.newIdeas].sort((left, right) => right.tracks.length - left.tracks.length) : [],
    [result?.newIdeas],
  )

  const selectedTracksForDeletion = useMemo(() => {
    if (!result) return []
    const { playlistsToUpdate } = result
    const selectedTracks = new Map<string, { trackName: string; artistNames: string[]; albumImageUrl: string | null | undefined }>()

    playlistsToUpdate
      .filter(item => selectedUpdateIds.includes(item.playlistId))
      .forEach(item => {
        const excluded = new Set(excludedUpdateTrackUris[item.playlistId] ?? [])
        item.tracks
          .filter(track => !excluded.has(track.trackUri))
          .forEach(track => selectedTracks.set(track.trackUri, { trackName: track.trackName, artistNames: track.artistNames, albumImageUrl: track.albumImageUrl }))
      })

    sortedIdeas
      .filter(item => isIdeaSelected(item.tag))
      .forEach(item => {
        const selectedKey = getSelectedIdeaKey(item.tag)
        const excluded = new Set((selectedKey ? excludedIdeaTrackUris[selectedKey] : undefined) ?? [])
        item.tracks
          .filter(track => !excluded.has(track.trackUri))
          .forEach(track => selectedTracks.set(track.trackUri, { trackName: track.trackName, artistNames: track.artistNames, albumImageUrl: track.albumImageUrl }))
      })

    return [...selectedTracks.entries()]
      .map(([trackUri, details]) => ({ trackUri, ...details }))
      .sort((left, right) => left.trackName.localeCompare(right.trackName))
  }, [excludedIdeaTrackUris, excludedUpdateTrackUris, result, selectedIdeaTags, selectedUpdateIds, sortedIdeas])

  // Now safe to use early returns after all hooks are called
  if (routeJobId && (loadingSavedProposal || Number(routeJobId) !== scanJobId || !result)) {
    return (
      <div className="dashboard">
        <p className="loading-text">Loading saved proposal…</p>
      </div>
    )
  }

  if (!result) return null

  const { playlistsToUpdate } = result
  const nothingSelected = selectedUpdateIds.length === 0 && selectedIdeaTags.length === 0
  const totalUpdateTracks = playlistsToUpdate.reduce((sum, item) => sum + item.tracks.length, 0)
  const totalIdeaTracks = sortedIdeas.reduce((sum, item) => sum + item.tracks.length, 0)
  const selectedTrackCount = playlistsToUpdate
    .filter(item => selectedUpdateIds.includes(item.playlistId))
    .reduce((sum, item) => sum + item.tracks.length - (excludedUpdateTrackUris[item.playlistId] ?? []).length, 0)
    + sortedIdeas
      .filter(item => isIdeaSelected(item.tag))
      .reduce((sum, item) => {
        const selectedKey = getSelectedIdeaKey(item.tag)
        return sum + item.tracks.length - ((selectedKey ? excludedIdeaTrackUris[selectedKey] : undefined) ?? []).length
      }, 0)

  const handleApply = () => {
    if (deleteFromSources) {
      setShowDeleteModal(true)
      return
    }
    dispatch(applyProposal())
  }

  const handleConfirmDeleteApply = () => {
    setShowDeleteModal(false)
    dispatch(applyProposal())
  }

  const handleUpdateTrackToggle = (
    playlistId: string,
    trackUri: string,
    trackUris: string[],
    isPlaylistSelected: boolean,
  ) => {
    if (!isPlaylistSelected) {
      dispatch(selectSingleUpdateTrack({ groupKey: playlistId, trackUri, allTrackUris: trackUris }))
      return
    }

    dispatch(toggleUpdateTrack({ playlistId, trackUri }))
  }

  const handleIdeaTrackToggle = (
    tag: string,
    trackUri: string,
    trackUris: string[],
    isPlaylistSelected: boolean,
  ) => {
    if (!isPlaylistSelected) {
      dispatch(selectSingleIdeaTrack({ groupKey: tag, trackUri, allTrackUris: trackUris }))
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
          <button className="btn btn--primary" onClick={handleApply} disabled={nothingSelected || executing}>
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
          <span className="dashboard__stat-value">{sortedIdeas.length}</span>
          <span className="dashboard__stat-label">new playlist ideas</span>
        </div>
        <div className="dashboard__stat-card">
          <span className="dashboard__stat-value">{totalUpdateTracks + totalIdeaTracks}</span>
          <span className="dashboard__stat-label">tracks in this proposal</span>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className={`dashboard__delete-zone${deleteFromSources ? ' dashboard__delete-zone--active' : ''}`}>
        <label className="dashboard__delete-label">
          <span className="selection-switch">
            <input
              type="checkbox"
              checked={deleteFromSources}
              onChange={event => dispatch(setDeleteFromSources(event.target.checked))}
            />
            <span className="selection-switch__track">
              <span className="selection-switch__thumb" />
            </span>
          </span>
          <span className="dashboard__delete-copy">
            <span className="dashboard__delete-title">
              {deleteFromSources ? '\u26a0\ufe0f Remove tracks from source after applying' : 'Remove tracks from source after applying'}
            </span>
            <span className="dashboard__delete-hint">
              {deleteFromSources
                ? 'Enabled \u2014 selected tracks will be permanently removed from the source playlists used for this scan.'
                : 'Off by default. When enabled, selected tracks are removed from the source playlists used for this scan.'}
            </span>
          </span>
        </label>
        {deleteFromSources && selectedTrackCount > 0 && (
          <span className="dashboard__delete-count">
            <span className="dashboard__delete-count-value">{selectedTrackCount}</span>
            <span className="dashboard__delete-count-label">tracks to remove</span>
          </span>
        )}
      </div>

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
                            <span className="panel__item-name">
                              {u.playlistName} <span className="panel__item-count-inline">({formatSuggestedCount(includedCount, u.tracks.length)})</span>
                            </span>
                            <span className="panel__item-hint">{topArtists}</span>
                          </span>
                        </label>

                        <div className="panel__item-meta">
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
                                      onChange={() => handleUpdateTrackToggle(u.playlistId, track.trackUri, u.tracks.map(item => item.trackUri), isSelected)}
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
          {sortedIdeas.length === 0 ? (
            <p className="panel__empty">No new playlists to suggest.</p>
          ) : (
            <ul className="panel__list">
              {sortedIdeas.map(idea => (
                (() => {
                  const cardKey = `idea:${idea.tag}`
                  const selectedKey = getSelectedIdeaKey(idea.tag)
                  const isSelected = selectedKey !== undefined
                  const excluded = (selectedKey ? excludedIdeaTrackUris[selectedKey] : undefined) ?? []
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
                            <span className="panel__item-name">
                              {formatPlaylistName(idea.tag)} <span className="panel__item-count-inline">({formatTrackCount(includedCount, idea.tracks.length)})</span>
                            </span>
                            <span className="panel__item-hint">{topArtists}</span>
                          </span>
                        </label>

                        <div className="panel__item-meta">
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
                                      onChange={() => handleIdeaTrackToggle(idea.tag, track.trackUri, idea.tracks.map(item => item.trackUri), isSelected)}
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

      <nav className="dashboard__nav-back">
        <button
          className="dashboard__back-button"
          onClick={handleReset}
          aria-label="Back to selection"
          title="Back to source selection"
        >
          <span className="dashboard__back-icon">‹</span>
        </button>
      </nav>

      <footer className="dashboard__footer" />

      {showDeleteModal ? (
        <div className="dashboard__modal-backdrop" role="presentation" onClick={() => setShowDeleteModal(false)}>
          <div className="dashboard__modal" role="dialog" aria-modal="true" aria-labelledby="delete-source-modal-title" onClick={event => event.stopPropagation()}>
            <p className="dashboard__eyebrow">Source cleanup</p>
            <h2 id="delete-source-modal-title" className="dashboard__modal-title">Delete {selectedTracksForDeletion.length} selected track{selectedTracksForDeletion.length === 1 ? '' : 's'} from the source libraries?</h2>
            <p className="dashboard__modal-copy">
              After the playlists are updated, these same tracks will be removed from the sources used to build this scan. You can restore them later with Undo from scan history.
            </p>
            <ul className="dashboard__modal-list">
              {selectedTracksForDeletion.map(track => (
                <li key={track.trackUri} className="dashboard__modal-item">
                  {track.albumImageUrl ? (
                    <img
                      className="dashboard__modal-item-image"
                      src={track.albumImageUrl}
                      alt=""
                      loading="lazy"
                    />
                  ) : (
                    <span className="dashboard__modal-item-image dashboard__modal-item-image--placeholder" aria-hidden="true">
                      {track.trackName.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <div className="dashboard__modal-item-content">
                    <span className="dashboard__modal-item-title">{track.trackName}</span>
                    <span className="dashboard__modal-item-copy">{getTrackSubtitle(track.artistNames)}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="dashboard__modal-actions">
              <button className="btn btn--ghost" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="btn btn--danger" onClick={handleConfirmDeleteApply}>
                Delete {selectedTracksForDeletion.length} Track{selectedTracksForDeletion.length === 1 ? '' : 's'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
