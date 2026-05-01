import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchScanStatus, undoProposal } from '../../api/apiClient'
import { initSelection, restoreSelectionFromExecution } from '../../features/proposal/proposalSlice'
import { hydrateScan } from '../../features/scan/scanSlice'
import { useAppDispatch } from '../../hooks'
import type { PlaylistIdea, PlaylistUpdate, ScanStatusResponse, TrackRef } from '../../types'
import '../../styles/pages/dashboard.scss'

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

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 3)
    .map(([artistName]) => artistName)
    .join(', ') || 'No artist data'
}

function formatPlaylistName(name: string) {
  if (!name) return name
  return name.charAt(0).toUpperCase() + name.slice(1)
}

function formatSuggestedCount(selectedCount: number, suggestedCount: number) {
  return `${selectedCount}/${suggestedCount} suggested`
}

function formatTrackCount(selectedCount: number, totalCount: number) {
  return `${selectedCount}/${totalCount} tracks`
}

function filterTracks(tracks: TrackRef[], selectedTrackUris: Set<string> | null) {
  if (!selectedTrackUris) {
    return tracks
  }
  return tracks.filter(track => selectedTrackUris.has(track.trackUri))
}

export default function ScanResultPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { jobId } = useParams()
  const [details, setDetails] = useState<ScanStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [undoing, setUndoing] = useState(false)

  useEffect(() => {
    if (!jobId) {
      navigate('/')
      return
    }

    let cancelled = false

    const loadDetails = async () => {
      try {
        const response = await fetchScanStatus(Number(jobId))
        if (cancelled) return

        if (response.status !== 'DONE' || !response.result) {
          navigate(`/scan-progress/${jobId}`)
          return
        }

        setDetails(response)
        setError(null)
      } catch (loadError) {
        if (cancelled) return
        setError(loadError instanceof Error ? loadError.message : 'Failed to load scan result')
        navigate('/')
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadDetails()

    return () => {
      cancelled = true
    }
  }, [jobId, navigate])

  const visibleUpdates = useMemo(() => {
    if (!details?.result) return []

    const selectedByPlaylist = new Map(
      (details.executionRequest?.updates ?? []).map(update => [update.playlistId, new Set(update.trackUris)]),
    )

    return details.result.playlistsToUpdate
      .map(update => ({
        ...update,
        tracks: filterTracks(update.tracks, selectedByPlaylist.get(update.playlistId) ?? null),
      }))
      .filter(update => update.tracks.length > 0 || !details.executionRequest)
  }, [details])

  const visibleIdeas = useMemo(() => {
    if (!details?.result) return []

    const selectedByIdea = new Map(
      (details.executionRequest?.creates ?? []).map(create => [create.playlistName, new Set(create.trackUris)]),
    )

    return [...details.result.newIdeas]
      .sort((left, right) => right.tracks.length - left.tracks.length)
      .map(idea => ({
        ...idea,
        tracks: filterTracks(idea.tracks, selectedByIdea.get(idea.tag) ?? null),
      }))
      .filter(idea => idea.tracks.length > 0 || !details.executionRequest)
  }, [details])

  const handleModify = () => {
    if (!details?.result || !jobId) return
    dispatch(hydrateScan(details))
    if (details.executionRequest) {
      dispatch(restoreSelectionFromExecution({ result: details.result, executionRequest: details.executionRequest }))
    } else {
      dispatch(initSelection(details.result))
    }
    navigate(`/dashboard/${jobId}`)
  }

  const handleUndo = async () => {
    if (!jobId || !details?.canUndo || undoing) return
    setUndoing(true)
    try {
      await undoProposal(Number(jobId))
      const refreshed = await fetchScanStatus(Number(jobId))
      setDetails(refreshed)
      setError(null)
    } catch (undoError) {
      setError(undoError instanceof Error ? undoError.message : 'Failed to undo scan changes')
    } finally {
      setUndoing(false)
    }
  }

  if (loading) {
    return (
      <div className="dashboard">
        <p className="loading-text">Loading saved result…</p>
      </div>
    )
  }

  if (!details?.result) {
    return null
  }

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <p className="dashboard__eyebrow">Saved result</p>
          <h1 className="dashboard__title">Review the last applied state for scan #{details.jobId}.</h1>
          <p className="dashboard__subtitle">
            This page is read-only. Re-open the proposal in modify mode to change selections, or undo the applied changes if they already reached Spotify.
          </p>
        </div>
        <div className="dashboard__header-actions">
          {details.executionSummary ? (
            <div className="dashboard__selection-chip">
              <span className="dashboard__selection-chip-value">{details.executionSummary.totalTracksAdded}</span>
              <span className="dashboard__selection-chip-label">tracks added</span>
            </div>
          ) : null}
          <button className="btn btn--ghost" onClick={() => navigate('/history')}>
            Back
          </button>
          <button className="btn btn--primary" onClick={handleModify}>
            Modify
          </button>
          {details.canUndo ? (
            <button className="btn btn--ghost" onClick={handleUndo} disabled={undoing}>
              {undoing ? 'Undoing…' : 'Undo'}
            </button>
          ) : null}
        </div>
      </header>

      <div className="dashboard__stats">
        <div className="dashboard__stat-card">
          <span className="dashboard__stat-value">{visibleUpdates.length}</span>
          <span className="dashboard__stat-label">existing playlists touched</span>
        </div>
        <div className="dashboard__stat-card">
          <span className="dashboard__stat-value">{visibleIdeas.length}</span>
          <span className="dashboard__stat-label">new playlists created or proposed</span>
        </div>
        <div className="dashboard__stat-card">
          <span className="dashboard__stat-value">{details.undone ? 'Undone' : details.applied ? 'Applied' : 'Proposal'}</span>
          <span className="dashboard__stat-label">current execution state</span>
        </div>
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      <div className="dashboard__panels">
        <section className="panel">
          <div className="panel__header">
            <div>
              <h2 className="panel__title">Playlists to Update</h2>
              <p className="panel__subtitle">Existing playlists that were selected for updates.</p>
            </div>
          </div>
          {visibleUpdates.length === 0 ? (
            <p className="panel__empty">No existing playlist updates recorded for this scan.</p>
          ) : (
            <ul className="panel__list">
              {visibleUpdates.map((update: PlaylistUpdate) => (
                <li key={update.playlistId} className="panel__item panel__item--expanded">
                  <div className="panel__item-shell">
                    <div className="panel__item-copy">
                      <span className="panel__item-name">{update.playlistName}</span>
                      <span className="panel__item-hint">{getTopArtists(update.tracks)}</span>
                    </div>
                    <div className="panel__item-meta">
                      <span className="panel__item-count">{formatSuggestedCount(update.tracks.length, update.tracks.length)}</span>
                    </div>
                  </div>

                  <ul className="panel__tracks">
                    {update.tracks.map(track => (
                      <li key={track.trackUri} className="panel__track-row">
                        <div className="panel__track">
                          <span aria-hidden="true" />
                          {track.albumImageUrl ? (
                            <img className="panel__track-cover" src={track.albumImageUrl} alt="" loading="lazy" />
                          ) : (
                            <span className="panel__track-cover panel__track-cover--placeholder" aria-hidden="true">
                              {track.trackName.slice(0, 1).toUpperCase()}
                            </span>
                          )}
                          <span className="panel__track-copy">
                            <span className="panel__track-name">{track.trackName}</span>
                            <span className="panel__track-artist">{getTrackSubtitle(track.artistNames)}</span>
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="panel__header">
            <div>
              <h2 className="panel__title">New Ideas</h2>
              <p className="panel__subtitle">New playlists that were created or proposed by the scan.</p>
            </div>
          </div>
          {visibleIdeas.length === 0 ? (
            <p className="panel__empty">No new playlists were created or proposed for this scan.</p>
          ) : (
            <ul className="panel__list">
              {visibleIdeas.map((idea: PlaylistIdea) => (
                <li key={idea.tag} className="panel__item panel__item--expanded">
                  <div className="panel__item-shell">
                    <div className="panel__item-copy">
                      <span className="panel__item-name">{formatPlaylistName(idea.tag)}</span>
                      <span className="panel__item-hint">{getTopArtists(idea.tracks)}</span>
                    </div>
                    <div className="panel__item-meta">
                      <span className="panel__item-count">{formatTrackCount(idea.tracks.length, idea.tracks.length)}</span>
                    </div>
                  </div>

                  <ul className="panel__tracks">
                    {idea.tracks.map(track => (
                      <li key={track.trackUri} className="panel__track-row">
                        <div className="panel__track">
                          <span aria-hidden="true" />
                          {track.albumImageUrl ? (
                            <img className="panel__track-cover" src={track.albumImageUrl} alt="" loading="lazy" />
                          ) : (
                            <span className="panel__track-cover panel__track-cover--placeholder" aria-hidden="true">
                              {track.trackName.slice(0, 1).toUpperCase()}
                            </span>
                          )}
                          <span className="panel__track-copy">
                            <span className="panel__track-name">{track.trackName}</span>
                            <span className="panel__track-artist">{getTrackSubtitle(track.artistNames)}</span>
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}