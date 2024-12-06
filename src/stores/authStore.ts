import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { fetchAPI } from '@/utils';

interface AuthState {
  userData: UserData | null;
  loading: boolean;
  setAuthState: (userData: UserData | null) => void;
  initialFetch: () => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userData: null, // initial null
      loading: true, // Avoid user see wrong data

      setAuthState: (userData) => {
        set({ userData });
      },

      initialFetch: async () => {
        set({ loading: true });

        try {
          const response = await fetchAPI<UserData>('/api/users');

          set({ loading: false, userData: response.data });
        } catch (error_) {
          // Only log the error if is not 401
          if (error_ instanceof Error) {
            if (error_.message.includes('401')) {
              console.warn('Unauthorized: Invalid or expired JWT.');
            } else {
              console.error('Error fetching user data:', error_);
            }
          } else {
            console.error('Unknown error:', error_);
          }
          set({ loading: false, userData: null });
        }
      },

      logout: async () => {
        try {
          await fetchAPI('/api/logout', {
            method: 'POST',
          });
          set({ userData: null });
        } catch (error_) {
          console.error('Error logging out:', error_);
        }
      },
    }),
    {
      name: 'momoPix-store',
    }
  )
);

export default useAuthStore;
