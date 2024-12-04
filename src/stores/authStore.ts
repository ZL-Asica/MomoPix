import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

import { db } from '@/firebase-config';

interface AuthState {
  userData: UserData | null;
  loading: boolean;
  setAuthState: (userData: UserData | null) => void;
  initializeAuthListener: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userData: null, // initial null
      loading: true, // Avoid user see wrong data

      setAuthState: (userData) => {
        set({ userData });
      },

      initializeAuthListener: () => {
        const auth = getAuth();

        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
          if (currentUser) {
            const userDocumentReference = doc(db, 'users', currentUser.uid);

            const unsubscribeData = onSnapshot(
              userDocumentReference,
              (snapshot) => {
                if (snapshot.exists()) {
                  set({
                    userData: snapshot.data() as UserData,
                    loading: false,
                  });
                } else {
                  set({ userData: null, loading: false });
                }
              },
              (error) => {
                console.error(error);
                set({ userData: null, loading: false });
              }
            );

            return () => unsubscribeData();
          } else {
            set({ userData: null, loading: false });
          }
        });

        return () => unsubscribeAuth();
      },
    }),
    {
      name: 'momoPix-store',
    }
  )
);

export default useAuthStore;
