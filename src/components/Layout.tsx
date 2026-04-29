import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { logoutUser } from '../features/auth/authSlice'
import { useAppDispatch, useAppSelector } from '../hooks'
import AppFooter from './AppFooter'
import BrandMark from './BrandMark'
import '../styles/layout.scss'

interface Props {
  children: ReactNode
}

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('') || 'SS'
}

export default function Layout({ children }: Props) {
  const dispatch = useAppDispatch()
  const user = useAppSelector(s => s.auth.user)
  const userLabel = user?.displayName || user?.spotifyId || 'Spotify user'

  return (
    <div className="layout">
      <div className="layout__orb layout__orb--one" aria-hidden="true" />
      <div className="layout__orb layout__orb--two" aria-hidden="true" />
      <header className="topbar">
        <Link className="topbar__brand-link" to="/" aria-label="Go to source selection">
          <BrandMark compact subtitle="Spotify playlist organization" />
        </Link>
        {user && (
          <div className="topbar__right">
            <div className="topbar__profile">
              {user.avatarUrl ? (
                <img className="topbar__avatar" src={user.avatarUrl} alt="Spotify profile avatar" />
              ) : (
                <span className="topbar__avatar topbar__avatar--fallback" aria-hidden="true">
                  {getInitials(userLabel)}
                </span>
              )}
              <span className="topbar__user-copy">
                <span className="topbar__user-name">{userLabel}</span>
                <span className="topbar__user-id">@{user.spotifyId}</span>
              </span>
            </div>
            <button className="btn btn--ghost" onClick={() => dispatch(logoutUser())}>
              Log out
            </button>
          </div>
        )}
      </header>
      <main className="layout__main">
        <div className="layout__main-inner">{children}</div>
      </main>
      <AppFooter />
    </div>
  )
}
