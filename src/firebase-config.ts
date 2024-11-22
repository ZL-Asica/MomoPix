import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);
const database = getFirestore(app);

export { app, analytics, auth, database as db };

// user/
//   userId/
//     album/
//       default: [photoId1, photoId2, ...]
//       someCustomAlbum: [photoId3, photoId4, ...]
//     photos/
//       photoId1: {
//         album: "default",
//         url: "https://cdn.r2.example.com/photo1.jpg",
//         metadata: {...},
//         uploadedAt: "2024-11-22T10:00:00Z"
//       }
//       photoId2: {...}
