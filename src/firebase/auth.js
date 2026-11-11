import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

// Registrierung
export const registerUser = async (email, password, displayName) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName });

  // Automatische Rollenzuweisung
  const role = email.toLowerCase() === 'timo410@icloud.com' ? 'admin' : 'user';

  // User-Dokument in Firestore anlegen
  await setDoc(doc(db, 'users', userCredential.user.uid), {
    displayName,
    email,
    role,
    status: 'active',
    collection: [],
    cardCounts: {}, // Zählt Duplikate: { "cardId": count }
    fusionLevels: {}, // Fusionsstufe jeder Karte: { "cardId": 0-5 }
    stardust: 0, // Währung für Kartenverkauf/Shop
    tradeOffers: [],
    boosterCredits: 2, // Startguthaben: 2 Booster-Packs (Maximum)
    lastBoosterClaimTime: serverTimestamp(), // Timer startet sofort
    createdAt: serverTimestamp(),
  });

  // Nach der Registrierung sofort ausloggen, damit der User sich manuell anmelden muss
  await signOut(auth);

  return userCredential.user;
};

// Login
export const loginUser = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

// Logout
export const logoutUser = () => signOut(auth);

// Auth State Observer
export const observeAuth = (callback) => onAuthStateChanged(auth, callback);
