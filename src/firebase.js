// ─── MAKAN Property OS — Firebase Configuration ───────────────────────────────
//
//  HOW TO SET UP (5 minutes):
//  1. Go to https://console.firebase.google.com
//  2. Click "Add project" → name it "nexus-property-os" → Create project
//  3. In the left sidebar: Firestore Database → Create database
//     → Start in TEST mode → choose any region → Done
//  4. In the left sidebar: Project Settings (gear icon) → Your apps
//     → Click the </> Web icon → Register app as "nexus-os" → Copy the config
//  5. Paste your values below (replace each "PASTE_HERE")
//  6. Save — the app instantly syncs across all PCs and phones
//
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp, getApps, getApp }             from 'firebase/app';
import { initializeFirestore, getFirestore,
         memoryLocalCache }                          from 'firebase/firestore';
import { getStorage }                                 from 'firebase/storage';
import { getAuth }                                    from 'firebase/auth';

const firebaseConfig = {
  apiKey:            "AIzaSyDPj6Cu3nB5LcyaB6XCZEHdB071HKLUJL8",
  authDomain:        "makan-673c9.firebaseapp.com",
  projectId:         "makan-673c9",
  storageBucket:     "makan-673c9.firebasestorage.app",
  messagingSenderId: "988006858646",
  appId:             "1:988006858646:web:ccb9a5e35382b82c10e7b7",
  measurementId:     "G-MP2VY94RWF",
};

// ─── Do not edit below this line ─────────────────────────────────────────────

export const IS_CONFIGURED = firebaseConfig.apiKey !== "PASTE_HERE";

let db      = null;
let storage = null;
let auth    = null;

if (IS_CONFIGURED) {
  try {
    const isNew = !getApps().length;
    const app   = isNew ? initializeApp(firebaseConfig) : getApp();

    try {
      db = initializeFirestore(app, {
        localCache: memoryLocalCache(),
      });
    } catch {
      db = getFirestore(app);
    }

    storage = getStorage(app);
    auth    = getAuth(app);
  } catch (err) {
    console.error('[MAKAN] Firebase init failed:', err);
  }
}

export { db, storage, auth };
