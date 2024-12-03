import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import env from "react-dotenv";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: env.FIREBASE_API_KEY,
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
