const generatePhoto = async (userId: string, file: File): Promise<Photo> => {
  const timestamp = Date.now();
  const encoder = new TextEncoder();
  const data = encoder.encode(userId + file.name + timestamp);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = [...new Uint8Array(hashBuffer)];
  const hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  const id = hash.slice(0, 8);
  const date = new Date().toISOString().split('T')[0].replaceAll('-', '/');
  const url = `${date}/${id}.avif`;

  return {
    id,
    url,
    size: file.size,
    lastModified: file.lastModified,
    uploadedAt: 0, // Placeholder until the upload is complete
    name: file.name,
  };
};

export default generatePhoto;
