import { useState } from 'react';
import { toast } from 'sonner';

import type { UploadFile, UploadRequest } from '@/schemas';
import { MAX_FILE_SIZE_MB, MAX_FILES } from '@/consts';
import { useAuthStore } from '@/stores';
import { UploadFiles } from '@/api';
import { generateUploadData } from '@/utils';

const useFileUploader = (selectedAlbum: string, onClose: () => void) => {
  const userData = useAuthStore((state) => state.userData);
  const setLocalLoading = useAuthStore((state) => state.setLocalLoading);
  const setUserData = useAuthStore((state) => state.setUserData);
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

    setLocalLoading('upload', true);

    const sortedFiles = [...files].sort((a, b) => {
      return a.name.localeCompare(b.name);
    });

    try {
      const uploadData: UploadFile[] = await generateUploadData(
        userData.uid,
        sortedFiles.map((f) => f.file)
      );

      const response_ = await UploadFiles({
        albumName: selectedAlbum,
        files: uploadData,
      } as UploadRequest);

      toast.success(`成功添加 ${files.length} 张照片到相册 ${selectedAlbum}`);

      setUserData(response_);
      setFiles([]);
      onClose();
    } catch (error) {
      console.error(
        `Unexpected error during upload: ${(error as Error).message}`
      );
      toast.error(`添加 ${files.length} 张照片到相册 ${selectedAlbum} 失败`);
      return null;
    } finally {
      setLocalLoading('upload', false);
    }
  };

  return { files, addFiles, deleteFile, renameFile, handleUpload };
};

export default useFileUploader;
