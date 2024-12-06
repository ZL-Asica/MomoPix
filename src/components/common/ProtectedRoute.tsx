import type { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';

import LoadingIndicator from './LoadingIndicator';

import { useAuthStore } from '@/stores';

/**
 * Protects routes for authenticated users only.
 * Redirects to /signin if the user is not authenticated.
 */
const ProtectedRoute = ({ children }: { children: ReactElement }) => {
  const userData = useAuthStore((state) => state.userData);
  const loading = useAuthStore((state) => state.loading);

  if (loading) {
    return <LoadingIndicator />;
  }

  if (!userData) {
    return (
      <Navigate
        to='/signin'
        replace
      />
    );
  }

  return children;
};

/**
 * Protects routes for unauthenticated (guest) users only.
 * Redirects to / if the user is authenticated.
 */
const GuestRoute = ({ children }: { children: ReactElement }) => {
  const userData = useAuthStore((state) => state.userData);
  const loading = useAuthStore((state) => state.loading);

  if (loading) {
    return <LoadingIndicator />;
  }

  if (userData) {
    return (
      <Navigate
        to='/'
        replace
      />
    );
  }

  return children;
};

export { ProtectedRoute, GuestRoute };
