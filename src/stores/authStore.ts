import { create } from 'zustand';

import { fetchAPI } from '@/utils';

interface AuthState {
  userData: UserData | null;
  globalLoading: boolean;
  localLoading: { [key: string]: boolean };
  setGlobalLoading: (loading?: boolean) => void;
  setLocalLoading: (key: string, loading?: boolean) => void;
  setUserData: (userData: UserData | null) => void;
  initialFetch: () => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>()((set) => ({
  userData: null, // initial null
  globalLoading: true,
  localLoading: {},

  setGlobalLoading: (loading: boolean = true) => {
    set({ globalLoading: loading });
  },

  setLocalLoading: (key: string, loading: boolean = true) => {
    set((state) => ({
      localLoading: {
        ...state.localLoading,
        [key]: loading,
      },
    }));
  },

  setUserData: (userData) => {
    set({ userData });
  },

  initialFetch: async () => {
    set({ globalLoading: true });

    try {
      const response = await fetchAPI<UserData>('/api/users');

      set({ userData: response.data });
    } catch (error_) {
      // Only log the error if is not 401
      if (error_ instanceof Error) {
        if (!error_.message.includes('401')) {
          console.error('Error fetching user data:', error_);
        }
      } else {
        console.error('Unknown error:', error_);
      }
      set({ userData: null });
    } finally {
      set({ globalLoading: false });
    }
  },

  logout: async () => {
    const setLocalLoading = useAuthStore.getState().setLocalLoading;
    setLocalLoading('logout', true);

    try {
      await fetchAPI('/api/logout', {
        method: 'POST',
      });
      set({ userData: null });
    } catch (error_) {
      console.error('Error logging out:', error_);
    } finally {
      setLocalLoading('logout', false);
    }
  },
}));

export default useAuthStore;
