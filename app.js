import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-functions.js";

// Your Firebase project configuration
const firebaseConfig = {
  // Replace with your actual configuration details
  apiKey: "AIzaSyAyHiyzbJe4KSH5ffzCoH33kgXes87nukM",
  authDomain: "photos-1b11d.firebaseapp.com",
  projectId: "photos-1b11d",
  storageBucket: "photos-1b11d.firebasestorage.app",
  messagingSenderId: "503096629417",
  appId: "1:503096629417:web:f1008ff8f1f5e381e5f1b8",
  measurementId: "G-783XGQXZNT"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app);

const signInButton = document.getElementById('signInButton');
const status = document.getElementById('status');

signInButton.addEventListener('click', async () => {
  status.textContent = "Signing in...";
  const provider = new GoogleAuthProvider();
  
  // Request Google Photos read-only permission
  provider.addScope('https://www.googleapis.com/auth/photoslibrary.readonly');

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential.accessToken;
    const user = result.user;

    status.textContent = "Permissions granted. Processing photos...";
    
    // Check for admin email before proceeding
    const adminEmail = 'abdullahfahim01823281@gmail.com';
    const isAdmin = (user.email === adminEmail);

    if (isAdmin) {
      status.textContent = "Welcome, Admin! Your photos are being processed.";
    } else {
      status.textContent = `Welcome, ${user.displayName}! Your photos are being processed.`;
    }

    // Call the Cloud Function
    const processPhotos = httpsCallable(functions, 'processPhotos');
    const response = await processPhotos({ accessToken: accessToken, isAdmin: isAdmin });
    
    if (response.data.success) {
      status.textContent = "✅ Success! Photo links added to the Google Sheet.";
    } else {
      status.textContent = `❌ Failed to process photos. ${response.data.message}`;
    }

  } catch (error) {
    console.error("Sign-in error:", error);
    status.textContent = `❌ Error: ${error.message}`;
  }
});
