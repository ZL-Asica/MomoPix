import { useState } from 'react';
import type { User } from 'firebase/auth';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { z } from 'zod';

import { auth } from '@/firebase-config';
import { emailSchema, passwordSchema } from '@/schemas';

const validateInput = (
  email: string,
  password: string,
  confirmPassword?: string
): ValidationErrors => {
  const errors: ValidationErrors = {};

  try {
    emailSchema.parse(email);
  } catch (error_) {
    errors.email =
      error_ instanceof z.ZodError ? error_.errors[0]?.message : '邮箱错误';
  }

  try {
    passwordSchema.parse(password);
  } catch (error_) {
    errors.password =
      error_ instanceof z.ZodError ? error_.errors[0]?.message : '密码错误';
  }

  if (confirmPassword && confirmPassword !== password) {
    errors.confirmPassword = '两次输入的密码不一致';
  }

  return errors;
};

const useAuth = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loginWithEmail = async (
    email: string,
    password: string,
    onValidationErrors: (errors: ValidationErrors) => void
  ): Promise<User | null> => {
    const errors = validateInput(email, password);
    if (Object.keys(errors).length > 0) {
      onValidationErrors(errors);
      return null;
    }

    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      setError(null);
      return userCredential.user;
    } catch {
      setError('登录失败，请检查邮箱和密码');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (
    email: string,
    password: string,
    confirmPassword: string,
    onValidationErrors: (errors: ValidationErrors) => void
  ): Promise<User | null> => {
    const errors = validateInput(email, password, confirmPassword);
    if (Object.keys(errors).length > 0) {
      onValidationErrors(errors);
      return null;
    }

    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      await sendEmailVerification(user);
      setError(null);
      return user;
    } catch {
      setError('注册失败，请稍后再试');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await auth.signOut();
      setError(null);
    } catch {
      setError('登出失败');
    }
  };

  return { registerWithEmail, loginWithEmail, logout, error, loading };
};

export default useAuth;
