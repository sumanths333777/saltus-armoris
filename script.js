// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// // Initialize Firebase safely
if (window.firebase && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  window.mebiDb = db; // we can use this later to save chats
  console.log("MEBI: Firebase connected");
}Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAkKHUv5c9-18rSF0xxr_xbEZW5F6HE5MI",
  authDomain: "saltus-armoris.firebaseapp.com",
  projectId: "saltus-armoris",
  storageBucket: "saltus-armoris.firebasestorage.app",
  messagingSenderId: "467893389016",
  appId: "1:467893389016:web:eedc1a860a4026d67279ad",
  measurementId: "G-62Y2B9XP4Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
