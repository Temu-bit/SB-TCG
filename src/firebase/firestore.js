import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  addDoc,
  arrayUnion,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './config';

// ── KARTEN ──────────────────────────────────────────────────────────────────

export const getAllCards = async () => {
  const snapshot = await getDocs(collection(db, 'cards'));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Live-Updates für alle Karten abonnieren
export const subscribeToAllCards = (callback) => {
  const q = collection(db, 'cards');
  return onSnapshot(q, (snapshot) => {
    const cards = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(cards);
  });
};

// Eine einzelne Karte abrufen
export const getCard = async (cardId) => {
  const snap = await getDoc(doc(db, 'cards', cardId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

// Mehrere Karten nach IDs abrufen
export const getCardsByIds = async (cardIds) => {
  if (!cardIds.length) return [];
  const cards = await Promise.all(cardIds.map((id) => getCard(id)));
  return cards.filter(Boolean);
};

// ── USER ────────────────────────────────────────────────────────────────────

// User-Daten abrufen
export const getUserData = async (userId) => {
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

// Alle Benutzer abrufen (Für Admin) – dedupliziert nach E-Mail
export const getAllUsers = async () => {
  const snapshot = await getDocs(collection(db, 'users'));
  const allDocs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Deduplizierung: Pro E-Mail nur einen Eintrag behalten.
  // Priorität: admin > helper > user. Bei gleicher Rolle: den neueren.
  const ROLE_PRIORITY = { admin: 3, helper: 2, user: 1 };
  const byEmail = {};
  for (const user of allDocs) {
    const email = user.email?.toLowerCase();
    if (!email) continue;
    if (!byEmail[email]) {
      byEmail[email] = user;
    } else {
      const existing = byEmail[email];
      const existingPrio = ROLE_PRIORITY[existing.role] || 0;
      const newPrio = ROLE_PRIORITY[user.role] || 0;
      // Den mit höherer Rolle bevorzugen; bei Gleichstand den neueren
      if (newPrio > existingPrio) {
        byEmail[email] = user;
      }
    }
  }
  return Object.values(byEmail);
};

// Benutzer-Rolle aktualisieren (Für Admin)
export const updateUserRole = async (userId, newRole) => {
  await updateDoc(doc(db, 'users', userId), { role: newRole });
};

// Benutzer-Status aktualisieren (Für Admin)
export const updateUserStatus = async (userId, newStatus) => {
  await updateDoc(doc(db, 'users', userId), { status: newStatus });
};

// Karten zur Sammlung hinzufügen (inkl. Duplikat-Zähler)
export const addCardsToCollection = async (userId, cardIds) => {
  const userRef = doc(db, 'users', userId);
  
  // Da increment dynamische Keys braucht, bauen wir ein Update-Objekt
  const updates = {
    collection: arrayUnion(...cardIds)
  };
  
  // Für jede Karte den Counter um 1 erhöhen
  cardIds.forEach(id => {
    updates[`cardCounts.${id}`] = increment(1);
  });

  await updateDoc(userRef, updates);
};

// Booster-Kredite abziehen (1 Pack = 1 Kredit) und Timer zurücksetzen
export const useBoosterCredit = async (userId) => {
  await updateDoc(doc(db, 'users', userId), {
    boosterCredits: increment(-1),
    lastBoosterClaimTime: serverTimestamp(), // Timer startet neu nach dem Öffnen!
  });
};

// Kostenlose Booster abholen (alle 30 Minuten bis max. 2 Stück)
export const claimFreeBoosters = async (userId) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) throw new Error('User not found');
  
  const data = userSnap.data();
  if (data.boosterCredits >= 2) {
    throw new Error('Du hast bereits das Maximum von 2 Boostern erreicht.');
  }

  const lastClaim = data.lastBoosterClaimTime?.toDate() || new Date(0);
  const now = new Date();
  
  // Prüfen ob 30 Minuten (1800000 ms) vergangen sind
  const timeDiff = now - lastClaim;
  if (timeDiff < 30 * 60 * 1000) {
    throw new Error('Noch nicht bereit! Bitte warten.');
  }

  await updateDoc(userRef, {
    boosterCredits: 2, // Hartes Limit auf 2 setzen
    lastBoosterClaimTime: serverTimestamp()
  });
};

// 5-Stufen Fusions-System
export const FUSION_TIERS = [
  { level: 1,  name: 'Holo ✨',       cost: 3   },
  { level: 2,  name: 'Foil ⚡',       cost: 5   },
  { level: 3,  name: 'Crystal 💎',    cost: 8   },
  { level: 4,  name: 'Inferno 🔥',    cost: 13  },
  { level: 5,  name: 'Ultimate 👑',   cost: 21  },
  { level: 6,  name: 'Celestial 🌙', cost: 34  },
  { level: 7,  name: 'Void 🌀',       cost: 55  },
  { level: 8,  name: 'Divine ✝️',     cost: 89  },
  { level: 9,  name: 'Mythic 🐉',     cost: 144 },
  { level: 10, name: 'ABSOLUTE 💀', cost: 233 },
];

export const fuseCard = async (userId, cardId) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) throw new Error('User not found');
  
  const data = userSnap.data();
  const count = data.cardCounts?.[cardId] || 0;
  const currentLevel = data.fusionLevels?.[cardId] || 0;

  if (currentLevel >= 10) {
    throw new Error('Diese Karte hat bereits die höchste Stufe (ABSOLUTE 💀) erreicht!');
  }

  const nextTier = FUSION_TIERS.find(t => t.level === currentLevel + 1);
  if (!nextTier) throw new Error('Unbekannte Fusionsstufe.');

  if (count < nextTier.cost) {
    throw new Error(`Du benötigst ${nextTier.cost} Kopien für Stufe ${nextTier.level} (${nextTier.name})!`);
  }

  await updateDoc(userRef, {
    [`cardCounts.${cardId}`]: increment(-nextTier.cost),
    [`fusionLevels.${cardId}`]: nextTier.level
  });

  return nextTier.level; // Gibt das erreichte Level zurück
};

export const DUST_VALUES = {
  common: 10,
  uncommon: 25,
  rare: 75,
  epic: 300,
  legendary: 1200
};

export const sellCard = async (userId, cardId) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) throw new Error('User not found');
  
  const data = userSnap.data();
  const count = data.cardCounts?.[cardId] || 0;

  if (count < 2) {
    throw new Error('Du brauchst mindestens 2 Kopien dieser Karte, um sie zu verkaufen!');
  }

  // Hole die Kartendetails, um die Rarity zu bestimmen
  const cardSnap = await getDoc(doc(db, 'cards', cardId));
  if (!cardSnap.exists()) throw new Error('Karte existiert nicht in der Datenbank.');
  const cardData = cardSnap.data();
  const rarity = cardData.rarity || 'common';
  
  const dustValue = DUST_VALUES[rarity] || 10;

  await updateDoc(userRef, {
    [`cardCounts.${cardId}`]: increment(-1),
    stardust: increment(dustValue)
  });

  return dustValue;
};

// Kaufpreise im Staub-Shop (höher als Verkaufswert, damit Verkauf nicht OP ist)
export const DUST_BUY_COSTS = {
  common:    40,
  uncommon:  100,
  rare:      300,
  epic:      1200,
  legendary: 4800,
};

// Karte im Shop mit Sternenstaub kaufen
export const buyCardWithDust = async (userId, cardId) => {
  const userRef = doc(db, 'users', userId);
  const [userSnap, cardSnap] = await Promise.all([
    getDoc(userRef),
    getDoc(doc(db, 'cards', cardId)),
  ]);

  if (!userSnap.exists()) throw new Error('User nicht gefunden.');
  if (!cardSnap.exists()) throw new Error('Karte existiert nicht.');

  const userData = userSnap.data();
  const cardData = cardSnap.data();
  const rarity = cardData.rarity || 'common';
  const cost = DUST_BUY_COSTS[rarity] || 40;

  if ((userData.stardust || 0) < cost) {
    throw new Error(`Nicht genug Sternenstaub! Du brauchst ${cost} 🌟 für diese Karte.`);
  }

  await updateDoc(userRef, {
    collection: arrayUnion(cardId),
    [`cardCounts.${cardId}`]: increment(1),
    stardust: increment(-cost),
  });

  return cost;
};

// ── BOOSTER PACK LOGIK ──────────────────────────────────────────────────────

// Zufällige Karten nach Seltenheits-Gewichtung ziehen
export const openBoosterPack = async (userId) => {
  const allCards = await getAllCards();

  // Seltenheits-Gewichtung: Common=60%, Uncommon=25%, Rare=10%, Epic=4%, Legendary=1%
  const weights = { common: 60, uncommon: 25, rare: 10, epic: 4, legendary: 1 };

  const getWeightedRandom = () => {
    const roll = Math.random() * 100;
    let cumulative = 0;
    for (const [rarity, weight] of Object.entries(weights)) {
      cumulative += weight;
      if (roll < cumulative) return rarity;
    }
    return 'common';
  };

  const drawnCards = [];
  for (let i = 0; i < 5; i++) {
    const rarity = getWeightedRandom();
    const pool = allCards.filter((c) => c.rarity === rarity);
    if (pool.length > 0) {
      // Gewichtete Zufallsauswahl innerhalb der Seltenheitsstufe (per-card weight)
      const totalWeight = pool.reduce((sum, c) => sum + (c.weight || 50), 0);
      let weightRoll = Math.random() * totalWeight;
      let chosen = pool[pool.length - 1];
      for (const card of pool) {
        weightRoll -= (card.weight || 50);
        if (weightRoll <= 0) { chosen = card; break; }
      }
      drawnCards.push(chosen);
    } else {
      // Fallback: beliebige Karte
      drawnCards.push(allCards[Math.floor(Math.random() * allCards.length)]);
    }
  }

  // Karten zur Sammlung hinzufügen & Kredit abziehen
  await addCardsToCollection(userId, drawnCards.map((c) => c.id));
  await useBoosterCredit(userId);

  return drawnCards;
};

// ── TRADES ──────────────────────────────────────────────────────────────────

// Alle offenen Tausch-Angebote abrufen
export const getOpenTrades = async () => {
  const q = query(
    collection(db, 'trades'),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Live-Updates für offene Tausch-Angebote abonnieren
export const subscribeToOpenTrades = (callback, onError) => {
  const q = query(
    collection(db, 'trades'),
    where('status', '==', 'pending')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const trades = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          // Client-seitig sortieren, um keinen Composite Index zu benötigen
          const aTime = a.createdAt?.toMillis?.() ?? 0;
          const bTime = b.createdAt?.toMillis?.() ?? 0;
          return bTime - aTime;
        });
      callback(trades);
    },
    (err) => {
      console.error('subscribeToOpenTrades error:', err);
      if (onError) onError(err);
    }
  );
};

// Neues Tausch-Angebot erstellen
export const createTrade = async (fromUserId, offeredCards, requestedCards) => {
  const trade = await addDoc(collection(db, 'trades'), {
    fromUser: fromUserId,
    toUser: null,
    offeredCards,
    requestedCards,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return trade.id;
};

// Tausch-Angebot annehmen
export const acceptTrade = async (tradeId, toUserId) => {
  const trade = await getDoc(doc(db, 'trades', tradeId));
  const tradeData = trade.data();

  // Karten tauschen
  await addCardsToCollection(toUserId, tradeData.offeredCards);
  await addCardsToCollection(tradeData.fromUser, tradeData.requestedCards);

  // Status auf accepted setzen
  await updateDoc(doc(db, 'trades', tradeId), {
    status: 'accepted',
    toUser: toUserId,
  });
};

// Tausch-Angebot ablehnen
export const declineTrade = async (tradeId) => {
  await updateDoc(doc(db, 'trades', tradeId), { status: 'declined' });
};
