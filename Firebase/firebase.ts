// Firebase/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, Auth, browserPopupRedirectResolver } from 'firebase/auth';
import { browserLocalPersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore'; 
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyDB-9vdyPBSt3PhGgf_DbcGIvlSf0TMB7w",
  authDomain: "avocare-6e194.firebaseapp.com",
  projectId: "avocare-6e194",
  storageBucket: "avocare-6e194.firebasestorage.app",
  messagingSenderId: "523971166543",
  appId: "1:523971166543:web:94866bbf56e3a8e07e853a",
  measurementId: "G-M073L7E7VH"
};

// Initialize Firebase (guard against hot-reload double-init)
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: browserLocalPersistence,
    popupRedirectResolver: browserPopupRedirectResolver,
  });
} catch {
  // Auth was already initialized (e.g. hot reload), reuse existing instance
  auth = getAuth(app);
}

const db: Firestore = getFirestore(app); 
const storage: FirebaseStorage = getStorage(app);

// Export initialized services
export { auth, db, storage, app };