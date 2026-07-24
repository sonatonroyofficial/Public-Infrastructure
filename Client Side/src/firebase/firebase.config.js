// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app;
let auth;
let googleProvider;

try {
    // Check if configuration is present to avoid crash on load
    if (!firebaseConfig.apiKey) {
        console.warn("Firebase configuration is missing. Please check your .env.local file and restart the development server.");
    } else {
        // Initialize Firebase only if config is present
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        googleProvider = new GoogleAuthProvider();
    }
} catch (error) {
    console.error("Error initializing Firebase:", error);
}

// Export safe fallbacks if initialization failed to prevent app crash
export { auth, googleProvider };
export default app;
