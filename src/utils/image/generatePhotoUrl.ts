import sha256 from 'crypto-js/sha256';
import Base64 from 'crypto-js/enc-base64';

const generatePhotoId = (userId: string, filename: string): string => {
  const timestamp = Date.now();
  const hash = sha256(userId + filename + timestamp).toString(Base64);
  return hash.slice(0, 8);
};

const generatePhotoUrl = (photoId: string): string => {
  const date = new Date().toISOString().split('T')[0].replaceAll('-', '/');
  return `${import.meta.env.VITE_CF_R2}/${date}/${photoId}.avif`;
};

export { generatePhotoId, generatePhotoUrl };
