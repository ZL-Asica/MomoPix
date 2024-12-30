import type { ReactElement } from 'react'
import { useAuthStore } from '@/stores'

import { Navigate } from 'react-router-dom'

import LoadingIndicator from './LoadingIndicator'

/**
 * Protects routes for authenticated users only.
 * Redirects to /signin if the user is not authenticated.
 */
function ProtectedRoute({ children }: { children: ReactElement }) {
  const userData = useAuthStore(state => state.userData)
  const globalLoading = useAuthStore(state => state.globalLoading)

  if (globalLoading) {
    return <LoadingIndicator />
  }

  if (!userData) {
    return (
      <Navigate
        to="/signin"
        replace
      />
    )
  }

  return children
}

/**
 * Protects routes for unauthenticated (guest) users only.
 * Redirects to / if the user is authenticated.
 */
function GuestRoute({ children }: { children: ReactElement }) {
  const userData = useAuthStore(state => state.userData)
  const globalLoading = useAuthStore(state => state.globalLoading)

  if (globalLoading) {
    return <LoadingIndicator />
  }

  if (userData) {
    return (
      <Navigate
        to="/"
        replace
      />
    )
  }

  return children
}

export { GuestRoute, ProtectedRoute }
