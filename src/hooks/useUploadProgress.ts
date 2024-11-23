import { useState } from 'react';

const useUploadProgress = (totalFiles: number) => {
  const [progress, setProgress] = useState(0);

  const incrementProgress = () => {
    setProgress((previous) => Math.min(previous + 1, totalFiles));
  };

  const resetProgress = () => setProgress(0);

  return { progress, incrementProgress, resetProgress };
};

export default useUploadProgress;
