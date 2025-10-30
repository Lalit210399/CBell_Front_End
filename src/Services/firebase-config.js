import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

// Firebase configuration
// ✅ Real Firebase config from your project
const firebaseConfig = {
  apiKey: "AIzaSyBvtjcHxhA8lA10uFC0seVvXVxBWUdYG4g",
  authDomain: "cbell-web-app.firebaseapp.com",
  projectId: "cbell-web-app",
  storageBucket: "cbell-web-app.firebasestorage.app",
  messagingSenderId: "794273668439",
  appId: "1:794273668439:web:7f39061cd37f58e996f212"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging and get a reference to the service
export const messaging = getMessaging(app);

// VAPID key for web push notifications
// 🔑 REPLACE WITH YOUR ACTUAL VAPID KEY FROM FIREBASE CONSOLE
// Go to: Firebase Console → Project Settings → Cloud Messaging → Web Push certificates → Generate key pair
export const vapidKey = "BLTVoRwr-gHiIVdTmQvDUGpibqQzhWPKVUC0o6cYOitlYeN4dYVxjGJ2147LnO6MhOJ1RIiTyKpp2morJlmDUpw"; // ← Replace this with your actual VAPID key

