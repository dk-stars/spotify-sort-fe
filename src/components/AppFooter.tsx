import { Link } from 'react-router-dom'

export default function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="app-footer__grid">
        <div>
          <p className="app-footer__title">Spotify Sort</p>
          <p className="app-footer__text">
            Developed by sdk.lab studio as a non-commercial library organization project.
          </p>
        </div>

        <div>
          <p className="app-footer__label">Licenses & attribution</p>
          <p className="app-footer__text">
            This product uses the Spotify Web API but is not endorsed or certified by Spotify.
          </p>
          <p className="app-footer__text">
            This product uses the Last.fm API but is not endorsed or certified by Last.fm Ltd.
          </p>
          <p className="app-footer__text">
            Spotify names, artwork, and logos remain property of Spotify AB. Last.fm names and related marks remain property of their respective owners.
          </p>
        </div>

        <div>
          <p className="app-footer__label">Reference terms</p>
          <div className="app-footer__links">
            <Link to="/updates">Product updates</Link>
            <a href="https://developer.spotify.com/terms" target="_blank" rel="noreferrer">
              Spotify Developer Terms
            </a>
            <a href="https://www.last.fm/api/tos" target="_blank" rel="noreferrer">
              Last.fm API Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}