import { useEffect, useState, useMemo } from 'react';
import { subscribeToAllCards } from '../firebase/firestore';
import { useAuth } from '../context/useAuth';
import SBCard from '../components/Card/SBCard';
import CardInspectorModal from '../components/Card/CardInspectorModal';
import galleryBg from '../assets/gallery-bg.jpg';
import './Gallery.css';

const RARITIES = ['all', 'common', 'uncommon', 'rare', 'epic', 'legendary'];

const Gallery = () => {
  const { userData } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [selectedCard, setSelectedCard] = useState(null);

  const ownedIds = useMemo(() => new Set(userData?.collection || []), [userData]);

  useEffect(() => {
    const unsubscribe = subscribeToAllCards((fetchedCards) => {
      setCards(fetchedCards);
      setLoading(false);
    });
    
    return () => unsubscribe(); // Listener entfernen, wenn Komponente unmounted wird
  }, []);

  const filtered = useMemo(() => {
    return cards.filter((c) => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
      const matchRarity = rarityFilter === 'all' || c.rarity === rarityFilter;
      return matchSearch && matchRarity;
    });
  }, [cards, search, rarityFilter]);

  const owned  = filtered.filter((c) => ownedIds.has(c.id)).length;
  const total  = filtered.length;

  return (
    <div className="page gallery-page">
      <div 
        className="gallery-bg" 
        style={{ 
          backgroundImage: `linear-gradient(180deg, rgba(13, 13, 26, 0.72) 0%, rgba(13, 13, 26, 0.38) 35%, rgba(13, 13, 26, 0.85) 100%), url(${galleryBg})` 
        }} 
        aria-hidden="true" 
      />
      <div className="gallery-content">
        {/* Header */}
        <h1 className="page-title text-gradient-blue">📖 Karten-Galerie</h1>
      <p className="page-subtitle">
        Entdecke alle Santa-Blanca-Karten — {owned} / {total} in deiner Sammlung
      </p>

      {/* Progress Bar */}
      {total > 0 && (
        <div className="gallery-progress">
          <div
            className="gallery-progress__bar"
            style={{ width: `${(owned / total) * 100}%` }}
          />
          <span className="gallery-progress__label">{Math.round((owned / total) * 100)}% gesammelt</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="gallery-filters glass">
        <input
          className="input"
          type="search"
          placeholder="🔍 Karte suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />

        <div className="gallery-filter-group">
          {RARITIES.map((r) => (
            <button
              key={r}
              className={`filter-pill ${rarityFilter === r ? 'active' : ''} ${r !== 'all' ? `rarity-${r}` : ''}`}
              onClick={() => setRarityFilter(r)}
            >
              {r === 'all' ? 'Alle' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="loading-center">
          <div className="spinner" />
          <span>Karten werden geladen...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="loading-center">
          <span style={{ fontSize: '3rem' }}>🔍</span>
          <span>Keine Karten gefunden</span>
        </div>
      ) : (
        <div className="card-grid animate-fade-in-up">
          {filtered.map((card) => (
            <SBCard
              key={card.id}
              card={card}
              owned={ownedIds.has(card.id)}
              showOwned
              revealed={false}
              onClick={() => setSelectedCard(card)}
            />
          ))}
        </div>
      )}

      {/* Epischer 3D-Karten-Inspektor */}
      {selectedCard && (
        <CardInspectorModal
          card={selectedCard}
          cardsList={filtered}
          onClose={() => setSelectedCard(null)}
          onSelectCard={setSelectedCard}
          ownedIds={ownedIds}
          cardCounts={userData?.cardCounts || {}}
          fusionLevels={userData?.fusionLevels || {}}
        />
      )}
      </div>
    </div>
  );
};

export default Gallery;
