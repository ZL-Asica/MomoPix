import { toast } from 'sonner';

import generateUploadData from './generateUploadData';

import { UploadFiles } from '@/api';
import type { UploadFile, UploadRequest } from '@/schemas';

const uploadImages = async (
  userData: UserData,
  files: File[],
  albumName: string
): Promise<UserData | null> => {
  try {
    const uploadData: UploadFile[] = await generateUploadData(
      userData.uid,
      files
    );

    const uploadResponse = await UploadFiles({
      albumName,
      files: uploadData,
    } as UploadRequest);

    toast.success(`成功添加 ${files.length} 张照片到相册 ${albumName}`);

    return uploadResponse;
  } catch (error) {
    console.error(
      `Unexpected error during upload: ${(error as Error).message}`
    );
    toast.error(`添加 ${files.length} 张照片到相册 ${albumName} 失败`);
    return null;
  }
};

export default uploadImages;
