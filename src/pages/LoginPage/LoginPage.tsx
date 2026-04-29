import AppFooter from '../../components/AppFooter'
import BrandMark from '../../components/BrandMark'
import { API_BASE_URL } from '../../config'
import '../../styles/pages/login.scss'

export default function LoginPage() {
  const handleLogin = () => {
    // Navigate to the backend OAuth redirect
    window.location.href = `${API_BASE_URL}/api/auth/login`
  }

  return (
    <div className="login-page">
      <div className="login-page__orb login-page__orb--one" aria-hidden="true" />
      <div className="login-page__orb login-page__orb--two" aria-hidden="true" />

      <div className="login-page__shell">
        <section className="login-card login-card--intro">
          <BrandMark subtitle="Playlist organization for serious listeners" />
          <div className="login-card__headline-block">
            <h1 className="login-card__title">Turn a scattered library into a clean listening system.</h1>
            <p className="login-card__subtitle">
              Spotify Sort scans Liked Songs or any owned playlist, enriches tracks with metadata, and proposes human-reviewable playlist changes before anything is written back.
            </p>
          </div>

          <div className="login-card__feature-grid">
            <article className="login-card__feature">
              <span className="login-card__feature-label">Precise</span>
              <p>Editable proposals keep you in control of every playlist and track.</p>
            </article>
            <article className="login-card__feature">
              <span className="login-card__feature-label">Fast</span>
              <p>Cached enrichment keeps repeat scans practical even on larger collections.</p>
            </article>
            <article className="login-card__feature">
              <span className="login-card__feature-label">Transparent</span>
              <p>Spotify and Last.fm attributions stay visible, because metadata provenance matters.</p>
            </article>
          </div>
        </section>

        <section className="login-card login-card--action">
          <p className="login-card__eyebrow">Connect your account</p>
          <h2 className="login-card__action-title">Start with your Spotify identity.</h2>
          <p className="login-card__action-copy">
            Sign in to load your playlists, show your Spotify avatar, and generate a proposal from your own library.
          </p>
          <button className="btn btn--primary btn--large login-card__button" onClick={handleLogin}>
            Connect with Spotify
          </button>
          <p className="login-card__legal-note">
            Non-commercial project by sdk.lab studio. Uses the Spotify Web API and Last.fm API.
          </p>
        </section>
      </div>

      <AppFooter />
    </div>
  )
}
