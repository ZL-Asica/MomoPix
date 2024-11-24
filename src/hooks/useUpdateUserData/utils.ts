import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { useState } from 'react';

import { db } from '@/firebase-config';
import { useAuthContext } from '@/hooks';

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
  const { loading, userData } = useAuthContext();
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
    const userDocumentReference = doc(db, 'users', userData!.uid);

    setProcessing(true);
    try {
      await setDoc(userDocumentReference, updatedData, { merge: true });
      toast.success(successMessage);
    } catch (error) {
      console.error(`Failed to update user data: ${error}`);
      toast.error(errorMessage || 'Failed to update user data');
    } finally {
      setProcessing(false);
    }
  };

  return { ensureUserData, updateUserData, userData, processing };
};

export { useCommonUtils };
