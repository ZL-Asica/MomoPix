import { useState } from 'react';
import { toast } from 'sonner';

import { MAX_FILE_SIZE_MB, MAX_FILES } from '@/consts';
import { uploadImages } from '@/utils';
import { useAuthStore } from '@/stores';

const useFileUploader = (
  userData: UserData | null,
  selectedAlbum: string,
  onClose: () => void
) => {
  const setAuthState = useAuthStore((state) => state.setAuthState);
  const [loading, setLoading] = useState<boolean>(false);
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

  const addFiles = (newFiles: File[]): void => {
    setFiles((previous) => {
      const validFiles = newFiles.filter((file) => validateFile(file));
      const existingFileNames = new Set(previous.map((f) => f.name));

      // Check for duplicate file names
      const uniqueFiles = validFiles.filter(
        (file) => !existingFileNames.has(file.name)
      );

      if (previous.length + validFiles.length > MAX_FILES) {
        toast.error(`一次最多上传 ${MAX_FILES} 张图片`);
        return previous;
      }

      return [
        ...previous,
        ...uniqueFiles.map((file) => ({ file, name: file.name })),
      ];
    });
  };

  const deleteFile = (index: number): void => {
    setFiles((previous) => previous.filter((_, index_) => index_ !== index));
  };

  const renameFile = (index: number, newName: string): void => {
    setFiles((previous) =>
      previous.map((fileObject, index_) => {
        if (index_ === index) {
          const originalFile = fileObject.file;
          const extension = originalFile.name.match(/\.[^./]+$/)?.[0] || '';
          const updatedName = newName.replace(/\.[^./]+$/, '') + extension;

          // Create a new File object with the updated name
          const renamedFile = new File([originalFile], updatedName, {
            type: originalFile.type,
          });

          return { file: renamedFile, name: updatedName };
        }
        return fileObject;
      })
    );
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('请至少上传一张图片');
      return;
    }

    if (!userData) {
      toast.error('用户数据未加载');
      return;
    }

    const sortedFiles = [...files].sort((a, b) => {
      return a.name.localeCompare(b.name);
    });

    setLoading(true);

    const response_ = await uploadImages(
      userData,
      sortedFiles.map((f) => f.file),
      selectedAlbum
    );
    setLoading(false);
    if (response_) {
      setFiles([]); // Clear files
      setAuthState(response_);
      onClose();
    }
  };

  return { files, loading, addFiles, deleteFile, renameFile, handleUpload };
};

export default useFileUploader;
