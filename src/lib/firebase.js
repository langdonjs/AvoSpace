// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCEwegAkYkTEALrBCMeYMdpdH9gAZKqvUE",
  authDomain: "avospace-1630f.firebaseapp.com",
  projectId: "avospace-1630f",
  storageBucket: "avospace-1630f.firebasestorage.app",
  messagingSenderId: "322542124193",
  appId: "1:322542124193:web:ceff6d473417665b48c4e0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth, Firestore and Storage instances
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };