import { toast } from 'sonner';
import { useState } from 'react';

import { useAuthStore } from '@/stores';
import { usersPut } from '@/api';

type CommonUtils = {
  ensureUserData: () => void;
  updateUserData: (
    updatedData: Partial<UserData>,
    successMessage: string,
    errorMessage?: string
  ) => Promise<void>;
  userData: UserData | null;
  processing: boolean;
};

const useCommonUtils = (): CommonUtils => {
  const userData = useAuthStore((state) => state.userData);
  const loading = useAuthStore((state) => state.loading);
  const setAuthState = useAuthStore((state) => state.setAuthState);
  const [processing, setProcessing] = useState(false);

  const ensureUserData = () => {
    if (loading) {
      throw new Error('User data is still loading');
    }
    if (!userData) {
      throw new Error('User data is not available');
    }
  };

  const updateUserData = async (
    updatedData: Partial<UserData>,
    successMessage: string,
    errorMessage?: string
  ) => {
    ensureUserData();
    setProcessing(true);
    try {
      const response = await usersPut(updatedData);
      if (!response) return;

      setAuthState(response);
      toast.success(successMessage);
    } catch (error_) {
      console.error((error_ as Error).message || '登录失败，服务器错误');
      toast.error(errorMessage || 'Failed to update user data');
    } finally {
      setProcessing(false);
    }
  };

  return { ensureUserData, updateUserData, userData, processing };
};

export { useCommonUtils };
