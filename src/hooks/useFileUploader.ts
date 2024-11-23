import { useState } from 'react';
import { toast } from 'sonner';

import { MAX_FILE_SIZE_MB, MAX_FILES } from '@/consts';
import { uploadImages } from '@/utils';

const useFileUploader = (
  userData: UserData | null,
  selectedAlbum: string,
  addPhotosToAlbum: (albumName: string, photos: Photo[]) => Promise<void>,
  onClose: () => void
) => {
  const [files, setFiles] = useState<{ file: File; name: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);

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
          ? {
              ...file,
              name:
                newName.replace(/\.[^./]+$/, '') +
                file.name.match(/\.[^./]+$/)?.[0],
            }
          : file
      )
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

    setIsUploading(true);

    const success = await uploadImages(
      userData,
      files.map((f) => f.file),
      selectedAlbum,
      addPhotosToAlbum
    );
    if (success) {
      setFiles([]); // Clear files
      onClose();
    }
    setIsUploading(false);
  };

  return { files, isUploading, addFiles, deleteFile, renameFile, handleUpload };
};

export default useFileUploader;
