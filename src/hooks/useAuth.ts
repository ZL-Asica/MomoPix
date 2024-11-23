import { useState } from 'react';
import type { User } from 'firebase/auth';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

import { auth, db } from '@/firebase-config';
import { getGravatarURL, fetchGravatarProfile } from '@/utils';

/**
 * Custom hook for user authentication
 * Provides methods to register, login, and logout with error handling.
 *  @returns {registerWithEmail, loginWithEmail, error, loading}
 */
const useAuth = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Generic error handler
  const handleError = (error_: unknown, defaultMessage: string) => {
    setError(error_ instanceof Error ? error_.message : defaultMessage);
  };

  /**
   * Login with email and password
   */
  const loginWithEmail = async (
    email: string,
    password: string
  ): Promise<User | null> => {
    if (!email.includes('@zla.app')) {
      setError('You are not allowed');
      return null;
    }
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      setError(null); // Clear any previous error
      return userCredential.user;
    } catch (error_) {
      handleError(error_, 'Email login failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register with email and password
   */
  const registerWithEmail = async (
    email: string,
    password: string
  ): Promise<User | null> => {
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Create default user data in Firestore
      const userDocument = doc(db, 'users', user.uid);
      const defaultAlbum: Album = {
        name: 'default',
        thumbnail: '',
        createdAt: new Date().toISOString(),
        photos: [],
      };

      // Fetch Gravatar profile data
      const gravatarProfile = await fetchGravatarProfile(email);

      const newUser: UserData = {
        uid: user.uid,
        TOKEN: '',
        email: user.email as string,
        displayName: user.displayName || gravatarProfile?.displayName || null,
        photoURL:
          user.photoURL || gravatarProfile?.photoURL || getGravatarURL(email),
        createdAt: new Date().toISOString(),
        albums: [defaultAlbum],
      };
      await setDoc(userDocument, newUser);

      // Send email verification
      await sendEmailVerification(user);

      setError(null); // Clear any previous error
      return user;
    } catch (error_) {
      handleError(error_, 'Email registration failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout the current user
   */
  const logout = async (): Promise<void> => {
    try {
      await auth.signOut();
      setError(null); // Clear any previous error
    } catch (error_) {
      handleError(error_, 'Failed to sign out');
    }
  };

  return { registerWithEmail, loginWithEmail, logout, error, loading };
};

export default useAuth;
