interface Env {
  PUBLIC?: string;
  JWT_SECRET: string;
  R2_URL: string;
  R2: R2Bucket;
  KV: KVNamespace;
}

interface Photo {
  id: string;
  url: string;
  size: number;
  lastModified: number;
  uploadedAt: number;
  name: string;
}

interface Album {
  name: string;
  thumbnail: string;
  createdAt: string;
  photos: Photo[];
}

interface UserData {
  uid: string;
  type: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  albums: Album[];
}

interface UserKVData extends UserData {
  password: string;
}

interface UploadFile {
  key: string;
  name: string;
  file: Blob;
}

interface JWTPayload {
  uid: string;
  type: string;
}

interface JWTPayloadWithIatExp extends JWTPayload {
  iat: number;
  exp: number;
}
