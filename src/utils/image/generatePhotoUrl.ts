import sha256 from 'crypto-js/sha256';
import Base64 from 'crypto-js/enc-base64';

const generatePhotoData = (userId: string, filename: string): PhotoData => {
  const timestamp = Date.now();
  const hash = sha256(userId + filename + timestamp).toString(Base64);
  const id = hash.slice(0, 8);

  const date = new Date().toISOString().split('T')[0].replaceAll('-', '/');
  const url = `${date}/${id}.avif`;

  return { id, url };
};

export default generatePhotoData;
