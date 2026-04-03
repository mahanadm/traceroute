import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAaFik6xNDJ7qQoGNFFavdR5VKECQVHpLI",
  authDomain: "traceroute-hardware-tracker.firebaseapp.com",
  projectId: "traceroute-hardware-tracker",
  storageBucket: "traceroute-hardware-tracker.firebasestorage.app",
  messagingSenderId: "603966400115",
  appId: "1:603966400115:web:ba84216c038ad2b2c5ac06",
  measurementId: "G-CYGT5ZR1HG"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
