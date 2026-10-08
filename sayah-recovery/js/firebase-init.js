/* ==========================================================================
   SAYAH RECOVERY — Firebase initialisation
   Uses the Firebase "compat" SDK (loaded via plain <script> tags in each
   page's <head>, no npm/build step needed — same philosophy as the rest of
   this site). This file must load AFTER the firebase-app/firestore/auth
   compat scripts and BEFORE reviews.js / admin.js.

   The values below (apiKey, authDomain, etc.) are NOT secret — Firebase's
   web config is meant to be public. Real protection comes from the
   Firestore security rules (see README.md), not from hiding this file.
   ========================================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyAgg0ZcMvuhdG_9Q85LK9KnTyWYxpJmGTM",
  authDomain: "sayahrecovery-927f7.firebaseapp.com",
  projectId: "sayahrecovery-927f7",
  storageBucket: "sayahrecovery-927f7.firebasestorage.app",
  messagingSenderId: "828001492200",
  appId: "1:828001492200:web:d753ac14d76bb57135bd5d",
};

firebase.initializeApp(firebaseConfig);

// Shared handles used by reviews.js (public site) and admin.js / admin-content.js
// (admin panel). `storage` is only defined when the Storage compat SDK is also
// loaded on the page (currently just admin.html, for image uploads) — public
// pages don't need it, they just display image URLs with plain <img> tags.
const db = firebase.firestore();
const auth = firebase.auth();
const storage = typeof firebase.storage === "function" ? firebase.storage() : undefined;
