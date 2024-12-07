import { toast } from 'sonner';

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
};

const useCommonUtils = (): CommonUtils => {
  const userData = useAuthStore((state) => state.userData);
  const globalLoading = useAuthStore((state) => state.globalLoading);
  const setLocalLoading = useAuthStore((state) => state.setLocalLoading);
  const setUserData = useAuthStore((state) => state.setUserData);

  const ensureUserData = () => {
    if (globalLoading) {
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
    setLocalLoading('userData', true);
    try {
      const response = await usersPut(updatedData);
      if (!response) return;

      setUserData(response);
      toast.success(successMessage);
    } catch (error_) {
      console.error((error_ as Error).message || '登录失败，服务器错误');
      toast.error(errorMessage || 'Failed to update user data');
    } finally {
      setLocalLoading('userData', false);
    }
  };

  return { ensureUserData, updateUserData, userData };
};

export { useCommonUtils };
