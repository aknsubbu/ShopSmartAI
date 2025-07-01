import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your Firebase config object
const firebaseConfig = {
  // Your config values here
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id",
};

// Initialize Firebase
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase Auth
// Note: Firebase Auth automatically handles persistence in React Native/Expo
const auth = getAuth(app);

// Initialize other Firebase services
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
export default app;
