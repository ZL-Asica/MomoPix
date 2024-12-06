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

type ValidationErrors = {
  username?: string;
  password?: string;
  confirmPassword?: string;
};

type TurnstileStatus = 'success' | 'error' | 'expired' | 'loading';
