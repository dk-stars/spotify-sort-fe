import { type ReactNode } from 'react'
import { logoutUser } from '../features/auth/authSlice'
import { useAppDispatch, useAppSelector } from '../hooks'
import '../styles/layout.scss'

interface Props {
  children: ReactNode
}

export default function Layout({ children }: Props) {
  const dispatch = useAppDispatch()
  const user = useAppSelector(s => s.auth.user)

  return (
    <div className="layout">
      <header className="topbar">
        <span className="topbar__brand">Smart Librarian</span>
        {user && (
          <div className="topbar__right">
            <span className="topbar__user">{user.displayName || user.spotifyId}</span>
            <button className="btn btn--ghost" onClick={() => dispatch(logoutUser())}>
              Log out
            </button>
          </div>
        )}
      </header>
      <main className="layout__main">{children}</main>
    </div>
  )
}
