import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB-vryKWHuQhY48O8OmJS2IGG95yYM_edY",
  authDomain: "embeded-c80cb.firebaseapp.com",
  databaseURL:
    "https://embeded-c80cb-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "embeded-c80cb",
  storageBucket: "embeded-c80cb.firebasestorage.app",
  messagingSenderId: "495257925089",
  appId: "1:495257925089:web:69d41ee4809c60c54ecea0",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
export { database };
