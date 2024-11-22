type UpdateStage = 'idle' | 'updating' | 'success';

interface Photo {
  id: number;
  url: string;
  size: number;
  uploadedAt: string;
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
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  albums: Album[];
}
