import { useEffect, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { checkAuth } from '../features/auth/authSlice'
import { useAppDispatch, useAppSelector } from '../hooks'

interface Props {
  children: ReactNode
}

export default function ProtectedRoute({ children }: Props) {
  const dispatch = useAppDispatch()
  const { user, loading, checked } = useAppSelector(s => s.auth)

  useEffect(() => {
    if (!checked) {
      dispatch(checkAuth())
    }
  }, [checked, dispatch])

  if (!checked || loading) return null  // avoid flash; a spinner could replace null

  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}
