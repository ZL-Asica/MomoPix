import { useContext } from 'react';

import { AuthContext } from '@/contexts/AuthContext';

const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    alert('UNEXPECTED ERROR');
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export default useAuthContext;
