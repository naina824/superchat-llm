import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAHZBx9olnLjWrEIWUQ9adoucDrV6TKnyI",
  authDomain: "superchat-1f956.firebaseapp.com",
  projectId: "superchat-1f956",
  storageBucket: "superchat-1f956.firebasestorage.app",
  messagingSenderId: "730838494406",
  appId: "1:730838494406:web:37db482a3c815477b5fbc7"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();