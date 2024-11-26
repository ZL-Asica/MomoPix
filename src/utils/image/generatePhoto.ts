import { generateUniqueId } from '@zl-asica/react';

const generatePhoto = async (userId: string, file: File): Promise<Photo> => {
  const id = await generateUniqueId([userId, file.name, file.size.toString()]);
  // eslint-disable-next-line unicorn/prefer-string-replace-all
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '/');

  const url = `${date}/${id}`;

  return {
    id,
    url,
    size: file.size,
    lastModified: file.lastModified,
    uploadedAt: 0, // Placeholder until the upload is complete
    name: file.name.includes('.')
      ? file.name.replace(/\.[^./]+$/, '')
      : file.name,
  };
};

export default generatePhoto;
