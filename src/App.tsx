import AppProviders from '@/AppProviders'
import { GuestRoute, Layout, ProtectedRoute } from '@/components'

import AlbumsPage from '@/pages/Albums'
import NotFoundPage from '@/pages/NotFoundPage'
import Profile from '@/pages/Profile'

import SignInPage from '@/pages/SignIn'
import SignUpPage from '@/pages/SignUp'
import SingleAlbumPage from '@/pages/SingleAlbum'
import { useAuthStore } from '@/stores'
import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'

function App() {
  const initialFetch = useAuthStore(state => state.initialFetch)

  useEffect(() => {
    const fetchData = async () => {
      try {
        await initialFetch()
      }
      catch (error) {
        console.error('Failed to perform initial fetch:', error)
      }
    }

    fetchData().catch(console.error)
  }, [initialFetch])

  return (
    <AppProviders>
      <Routes>
        <Route
          path="/"
          element={<Layout />}
        >
          {/* Default route */}
          <Route
            index
            element={(
              <ProtectedRoute>
                <AlbumsPage />
              </ProtectedRoute>
            )}
          />

          {/* Auth routes */}
          <Route
            path="signin"
            element={(
              <GuestRoute>
                <SignInPage />
              </GuestRoute>
            )}
          />
          <Route
            path="signup"
            element={(
              <GuestRoute>
                <SignUpPage />
              </GuestRoute>
            )}
          />

          {/* Authenticated user routes */}
          <Route
            path="profile"
            element={(
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            )}
          />
          <Route
            path="album/:albumName"
            element={(
              <ProtectedRoute>
                <SingleAlbumPage />
              </ProtectedRoute>
            )}
          />

          {/* Not Found */}
          <Route
            path="*"
            element={<NotFoundPage />}
          />
        </Route>
      </Routes>
    </AppProviders>
  )
}

export default App
