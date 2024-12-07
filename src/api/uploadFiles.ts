import { fetchAPI } from '@/utils';
import type { UploadRequest } from '@/schemas';
import { UploadRequestSchema } from '@/schemas';

const uploadFiles = async (body: UploadRequest): Promise<UserData> => {
  // Validate the request body against the schema
  const parsedBody = UploadRequestSchema.parse(body);

  // Prepare FormData
  const formData = new FormData();
  formData.append('albumName', parsedBody.albumName);
  parsedBody.files.forEach(({ key, name, file }) => {
    // Use separate fields for metadata and file
    formData.append('fileKey', key); // 文件 key
    formData.append('fileName', name); // 文件名称
    formData.append('file', file); // 实际文件
  });

  // Make API call
  const response = await fetchAPI<UserData>('/api/file', {
    method: 'POST',
    body: formData,
  });

  return response.data;
};

export default uploadFiles;
