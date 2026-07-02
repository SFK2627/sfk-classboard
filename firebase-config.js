// Paste your Firebase web app config here.
// Firebase Console > Project settings > General > Your apps > Web app.
window.SFK_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAkISdMu8WrNSTN6AL7bImKndfl6U_8Gyg",
  authDomain: "sfk-classboard.firebaseapp.com",
  projectId: "sfk-classboard",
  storageBucket: "sfk-classboard.firebasestorage.app",
  messagingSenderId: "218993033397",
  appId: "1:218993033397:web:04501d845cc93b3db2fefc",
  measurementId: "G-QXK14EYDP2"
};

// These are account identifiers, not passwords. Create both accounts in
// Firebase Authentication. The Officer account is shared by all officers.
window.SFK_AUTH_ACCOUNTS = {
  admin: "admin@sfk-classboard.app",
  officer: "officers@sfk-classboard.app"
};

window.SFK_FIREBASE_READY =
  window.SFK_FIREBASE_CONFIG &&
  !String(window.SFK_FIREBASE_CONFIG.apiKey || "").includes("PASTE_");
