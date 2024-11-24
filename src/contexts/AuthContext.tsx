import { createContext } from 'react';

import { useAuthListener } from '@/hooks';

// Define the AuthContext type
const AuthContext = createContext<{
  userData: UserData | null;
  loading: boolean;
} | null>(null);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { userData, loading } = useAuthListener();

  return (
    <AuthContext.Provider
      value={{
        userData,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, AuthContext };
