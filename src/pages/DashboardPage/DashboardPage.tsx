import { useNavigate } from 'react-router-dom'
import {
  toggleUpdate,
  toggleIdea,
  applyProposal,
  resetProposal,
} from '../../features/proposal/proposalSlice'
import { resetScan } from '../../features/scan/scanSlice'
import { useAppDispatch, useAppSelector } from '../../hooks'
import '../../styles/pages/dashboard.scss'

export default function DashboardPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { selectedUpdateIds, selectedIdeaTags, executing, summary, error } =
    useAppSelector(s => s.proposal)
  const result = useAppSelector(s => s.scan.result)

  if (!result) {
    navigate('/')
    return null
  }

  const { playlistsToUpdate, newIdeas } = result
  const nothingSelected = selectedUpdateIds.length === 0 && selectedIdeaTags.length === 0

  const handleApply = () => {
    dispatch(applyProposal())
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
                <li key={u.playlistId} className="panel__item">
                  <label className="panel__item-label">
                    <input
                      type="checkbox"
                      checked={selectedUpdateIds.includes(u.playlistId)}
                      onChange={() => dispatch(toggleUpdate(u.playlistId))}
                    />
                    <span className="panel__item-name">{u.playlistName}</span>
                    <span className="panel__item-count">+{u.tracks.length} tracks</span>
                  </label>
                </li>
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
                <li key={idea.tag} className="panel__item">
                  <label className="panel__item-label">
                    <input
                      type="checkbox"
                      checked={selectedIdeaTags.includes(idea.tag)}
                      onChange={() => dispatch(toggleIdea(idea.tag))}
                    />
                    <span className="panel__item-name">{idea.tag}</span>
                    <span className="panel__item-count">{idea.tracks.length} tracks</span>
                  </label>
                  <p className="panel__item-hint">Create new &ldquo;{idea.tag}&rdquo; playlist</p>
                </li>
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
