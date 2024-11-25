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
  TOKEN: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  albums: Album[];
}

type ValidationErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
};
