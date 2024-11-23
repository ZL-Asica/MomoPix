import { toast } from 'sonner';

const getPreSignedLinks = async (
  photoIds: PhotoData[],
  TOKEN: string
): Promise<PreSignedUrl[]> => {
  if (!TOKEN) {
    console.error('No token provided');
    toast.error('No token provided');
    throw new Error('No token provided');
  }

  const response = await fetch(import.meta.env.VITE_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ photoIds }),
  });

  if (!response.ok) {
    console.error('Failed to generate pre-signed links:', response);
    throw new Error('Failed to generate pre-signed links');
  }

  return await response.json();
};

export default getPreSignedLinks;
