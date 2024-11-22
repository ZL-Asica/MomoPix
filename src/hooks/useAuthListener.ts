import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import type { User } from 'firebase/auth';

import { db } from '@/firebase-config';

/**
 * Custom hook to listen for authentication and user data changes.
 * @returns {user, userData, loading}
 */
const useAuthListener = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    // Listen for authentication state changes
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDocumentReference = doc(db, 'users', currentUser.uid);

        // Listen for Firestore user data changes
        const unsubscribeData = onSnapshot(
          userDocumentReference,
          (snapshot) => {
            if (snapshot.exists()) {
              setUserData(snapshot.data() as UserData);
            } else {
              setUserData(null);
            }
            setLoading(false);
          },
          (error: Error) => {
            console.error(error);
            setUserData(null);
            setLoading(false);
          }
        );

        return () => unsubscribeData(); // Cleanup Firestore listener
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth(); // Cleanup auth state listener
    };
  }, []);

  return { user, userData, loading };
};

export default useAuthListener;
