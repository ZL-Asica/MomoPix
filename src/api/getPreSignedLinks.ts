import { toast } from 'sonner';

const getPreSignedLinks = async (
  photoData: PhotoData[],
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
    body: JSON.stringify({ photoData }),
  });

  if (!response.ok) {
    const errorDetails = await response.json().catch(() => null);
    console.error(
      'Failed to generate pre-signed links:',
      response,
      errorDetails
    );
    toast.error(
      `Failed to generate pre-signed links: ${errorDetails?.error || response.statusText}`
    );
    throw new Error(
      `Failed to generate pre-signed links: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
};

export default getPreSignedLinks;
