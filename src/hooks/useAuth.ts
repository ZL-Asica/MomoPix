import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
} from 'firebase/auth';

import { auth } from '@/firebase-config';

/**
 * 这个 hook 用于处理用户注册和登录，通过 Firebase Auth 实现
 * @returns  {registerWithEmail, loginWithEmail, error, loading}
 */
export const useAuth = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loginWithEmail = async (email: string, password: string) => {
    if (!email.includes('@zla.app')) {
      setError('Only zla.app email addresses are allowed');
      return;
    }
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      setLoading(false);
      return userCredential.user;
    } catch (error_: unknown) {
      setLoading(false);
      if (error_ instanceof Error) {
        setError(error_.message);
      } else {
        setError('Email login failed');
      }
      return;
    }
  };

  const registerWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      // 发送邮箱验证邮件
      await sendEmailVerification(user);

      setLoading(false);
      return user;
    } catch (error_: unknown) {
      setLoading(false);
      if (error_ instanceof Error) {
        setError(error_.message);
      } else {
        setError('Email registration failed');
      }
      return;
    }
  };

  return { registerWithEmail, loginWithEmail, error, loading };
};
