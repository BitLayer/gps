import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDv1S-UU0-CORLOYEaOIYqh5YqgjxXHIqs",
  authDomain: "ghatparstore.firebaseapp.com",
  databaseURL: "https://ghatparstore-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ghatparstore",
  storageBucket: "ghatparstore.firebasestorage.app",
  messagingSenderId: "395013404803",
  appId: "1:395013404803:web:b8fa605483e94a1a30c3b6",
  measurementId: "G-RYNRH76Z97"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
