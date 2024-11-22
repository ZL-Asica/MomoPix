import { createContext, useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';

import { db } from '@/firebase-config';
import { useAuthListener } from '@/hooks';

// Define the AuthContext type
const AuthContext = createContext<{
  userData: UserData | null;
  loading: boolean;
  updateUserData: (updatedData: Partial<UserData>) => Promise<void>;
  updateStatus: UpdateStage;
  updateError: string | null;
} | null>(null);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, userData, loading } = useAuthListener();
  const [updateStatus, setUpdateStatus] = useState<UpdateStage>('idle');
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Update user data function
  const updateUserData = async (updatedData: Partial<UserData>) => {
    if (!user) {
      throw new Error('User is not authenticated');
    }

    const userDocumentReference = doc(db, 'users', user.uid);

    try {
      setUpdateStatus('updating'); // Set status to updating
      setUpdateError(null); // Clear previous errors

      // Merge new data with existing data
      await setDoc(userDocumentReference, updatedData, { merge: true });

      setUpdateStatus('success'); // Set status to success
    } catch (error) {
      setUpdateStatus('idle'); // Reset status to idle
      setUpdateError(
        error instanceof Error ? error.message : 'Failed to update user data'
      );
    }
  };

  return (
    <AuthContext.Provider
      value={{
        userData,
        loading,
        updateUserData,
        updateStatus,
        updateError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, AuthContext };

// import { useAuthContext } from '@/hooks';

// const UpdateProfile = () => {
//   const { updateUserData, updateStatus, updateError } = useAuthContext();

//   const handleUpdate = async () => {
//     try {
//       await updateUserData({ displayName: 'New Name' });
//       alert('Update successful!');
//     } catch (error) {
//       console.error('Update failed:', error);
//     }
//   };

//   return (
//     <div>
//       <button onClick={handleUpdate} disabled={updateStatus === 'updating'}>
//         {updateStatus === 'updating' ? 'Updating...' : 'Update Profile'}
//       </button>
//       {updateError && <p style={{ color: 'red' }}>Error: {updateError}</p>}
//     </div>
//   );
// };

// export default UpdateProfile;
