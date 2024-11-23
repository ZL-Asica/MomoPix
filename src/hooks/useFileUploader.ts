import { useState } from 'react';
import { toast } from 'sonner';

import { MAX_FILE_SIZE_MB, MAX_FILES } from '@/consts';

const useFileUploader = () => {
  const [files, setFiles] = useState<{ file: File; name: string }[]>([]);

  const validateFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error(`文件 "${file.name}" 类型不支持，仅支持图片格式`);
      return false;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(
        `文件 "${file.name}" 大小超过限制（最大 ${MAX_FILE_SIZE_MB} MB）`
      );
      return false;
    }

    return true;
  };

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter((file) => validateFile(file));
    if (files.length + validFiles.length > MAX_FILES) {
      toast.error(`一次最多上传 ${MAX_FILES} 张图片`);
      return;
    }

    setFiles((previous) => [
      ...previous,
      ...validFiles.map((file) => ({ file, name: file.name })),
    ]);
  };

  const deleteFile = (index: number) => {
    setFiles((previous) => previous.filter((_, index_) => index_ !== index));
  };

  const renameFile = (index: number, newName: string) => {
    setFiles((previous) =>
      previous.map((file, index_) =>
        index_ === index
          ? { ...file, name: `${newName}.${file.file.name.split('.').pop()}` }
          : file
      )
    );
  };

  return { files, setFiles, addFiles, deleteFile, renameFile };
};

export default useFileUploader;
