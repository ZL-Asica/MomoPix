import { getAuth } from 'firebase/auth';

const getPreSignedLinks = async (
  photoIds: PhotoData[]
): Promise<PreSignedUrl[]> => {
  const auth = getAuth();
  const token = await auth.currentUser?.getIdToken();

  if (!token) {
    throw new Error('User is not authenticated');
  }

  const response = await fetch(import.meta.env.VITE_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`, // Include Firebase ID token
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
