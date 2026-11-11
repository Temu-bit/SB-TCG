import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase/config.js';

// Demo-Karten für das SB-Sammelkartenspiel
const seedCards = [
  { id: 'sb-001', name: 'Ignis, Feuerbringer', rarity: 'common', type: 'Feuer', power: 45, emoji: '🔥', description: 'Ein einfacher, aber feuriger Krieger.' },
  { id: 'sb-002', name: 'Aqua Wächter', rarity: 'common', type: 'Wasser', power: 40, emoji: '💧', description: 'Wacht über die Flüsse von Santa Blanca.' },
  { id: 'sb-003', name: 'Terra Golem', rarity: 'uncommon', type: 'Erde', power: 65, emoji: '🪨', description: 'Massiv und widerstandsfähig.' },
  { id: 'sb-004', name: 'Zephir Klinge', rarity: 'uncommon', type: 'Luft', power: 55, emoji: '🌪️', description: 'Schneller als der Wind.' },
  { id: 'sb-005', name: 'Nekromant der Leere', rarity: 'rare', type: 'Geist', power: 85, emoji: '💀', description: 'Beschwört Schatten für sich.' },
  { id: 'sb-006', name: 'Paladin des Sonnenlichts', rarity: 'rare', type: 'Licht', power: 90, emoji: '☀️', description: 'Blendet Feinde mit reinem Licht.' },
  { id: 'sb-007', name: 'Donner-Drache', rarity: 'epic', type: 'Blitz', power: 120, emoji: '⚡', description: 'Ein mächtiger Drache der Stürme.' },
  { id: 'sb-008', name: 'Lord Santa Blanca', rarity: 'legendary', type: 'Schatten', power: 250, emoji: '👑', description: 'Der legendäre Herrscher dieses TCG-Universums.' },
  { id: 'sb-009', name: 'Lava Bestie', rarity: 'uncommon', type: 'Feuer', power: 70, emoji: '🌋', description: 'Entstanden aus Magma.' },
  { id: 'sb-010', name: 'Frost Wyrm', rarity: 'epic', type: 'Wasser', power: 110, emoji: '❄️', description: 'Friert Gegner auf der Stelle ein.' },
];

export const runSeed = async () => {
  console.log('Starte Seed-Prozess...');
  try {
    for (const card of seedCards) {
      await setDoc(doc(db, 'cards', card.id), card);
      console.log(`Karte ${card.name} hinzugefügt.`);
    }
    console.log('Seed-Prozess erfolgreich beendet!');
  } catch (error) {
    console.error('Fehler beim Seeden:', error);
  }
};

// Um das Skript auszuführen, kannst du z.B. einen kleinen Button in der App einbauen 
// oder es einmalig in der Home.jsx aufrufen.
