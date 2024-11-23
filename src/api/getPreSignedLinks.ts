const getPreSignedLinks = async (photoIds: string[]): Promise<string[]> => {
  const response = await fetch(import.meta.env.VITE_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ photoIds }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate pre-signed links');
  }

  return await response.json();
};

export default getPreSignedLinks;
