import { useEffect, useState, useMemo } from 'react';
import { getCardsByIds, fuseCard, sellCard, FUSION_TIERS } from '../firebase/firestore';
import { useAuth } from '../context/useAuth';
import SBCard from '../components/Card/SBCard';
import './MyCards.css';

const SORT_OPTIONS = [
  { value: 'rarity-desc', label: '⭐ Seltenheit (höchste zuerst)' },
  { value: 'rarity-asc',  label: '⚪ Seltenheit (niedrigste zuerst)' },
  { value: 'name-asc',    label: '🔤 Name (A–Z)' },
];

const RARITY_ORDER = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };

const MyCards = () => {
  const { userData, refreshUserData } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('rarity-desc');
  const [search, setSearch] = useState('');
  const [fusionLoading, setFusionLoading] = useState(null); // cardId der Karte, die gerade verschmolzen wird
  const [fusionMsg, setFusionMsg] = useState('');

  useEffect(() => {
    if (!userData?.collection?.length) {
      setLoading(false);
      setCards([]);
      return;
    }
    getCardsByIds(userData.collection)
      .then(setCards)
      .finally(() => setLoading(false));
  }, [userData?.collection]);

  const cardCounts = userData?.cardCounts || {};
  const fusionLevels = userData?.fusionLevels || {};

  // Fusions-Handler
  const handleFuse = async (cardId) => {
    const currentLevel = fusionLevels[cardId] || 0;
    const nextTier = FUSION_TIERS.find(t => t.level === currentLevel + 1);
    
    if (!nextTier) return;
    
    if (!window.confirm(`Willst du wirklich ${nextTier.cost} Kopien opfern, um ${nextTier.name} zu erreichen?`)) return;
    
    setFusionLoading(cardId);
    setFusionMsg('');
    try {
      const newLevel = await fuseCard(userData.id, cardId);
      await refreshUserData();
      const reachedTier = FUSION_TIERS.find(t => t.level === newLevel);
      setFusionMsg(`${reachedTier.name} erreicht! 🎉`);
      setTimeout(() => setFusionMsg(''), 5000);
    } catch (err) {
      setFusionMsg(`Fehler: ${err.message}`);
      setFusionLoading(null);
    }
  };

  // Verkaufs-Handler (Staub-System)
  const [sellLoading, setSellLoading] = useState(null);
  
  const handleSell = async (card) => {
    if (!window.confirm(`Möchtest du 1 Kopie von "${card.name}" verkaufen?`)) return;
    setSellLoading(card.id);
    setFusionMsg(''); // Wir nutzen einfach die selbe Message-Box
    try {
      const dustEarned = await sellCard(userData.id, card.id);
      await refreshUserData();
      setFusionMsg(`Kopie verkauft! +${dustEarned} Staub 🌟`);
      setTimeout(() => setFusionMsg(''), 5000);
    } catch (err) {
      setFusionMsg(`Fehler beim Verkauf: ${err.message}`);
    } finally {
      setSellLoading(null);
    }
  };

  const sorted = useMemo(() => {
    let result = [...cards].filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    );
    switch (sort) {
      case 'rarity-desc': result.sort((a, b) => (RARITY_ORDER[b.rarity] || 0) - (RARITY_ORDER[a.rarity] || 0)); break;
      case 'rarity-asc':  result.sort((a, b) => (RARITY_ORDER[a.rarity] || 0) - (RARITY_ORDER[b.rarity] || 0)); break;
      case 'name-asc':    result.sort((a, b) => a.name.localeCompare(b.name)); break;
    }
    return result;
  }, [cards, sort, search]);

  // Seltenheits-Statistiken
  const stats = useMemo(() => {
    const counts = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };
    cards.forEach((c) => { if (counts[c.rarity] !== undefined) counts[c.rarity]++; });
    return counts;
  }, [cards]);

  if (loading) return (
    <div className="loading-center"><div className="spinner" /><span>Sammlung laden...</span></div>
  );

  return (
    <div className="page">
      <h1 className="page-title text-gradient" style={{ margin: 0, marginBottom: '0.5rem' }}>🃏 Meine Karten</h1>
      <p className="page-subtitle" style={{ marginTop: '0.5rem' }}>{cards.length} verschiedene Karten in deiner Sammlung</p>

      {/* Seltenheits-Stats */}
      <div className="mycards-stats">
        {Object.entries(stats).map(([rarity, count]) => (
          <div key={rarity} className={`mycards-stat badge-${rarity}`}>
            <span className="mycards-stat__count">{count}</span>
            <span className="mycards-stat__label">{rarity}</span>
          </div>
        ))}
      </div>

      {/* Fusions-Meldung */}
      {fusionMsg && (
        <div className={`mycards-fusion-msg ${fusionMsg.startsWith('Fehler') ? 'mycards-fusion-msg--error' : 'mycards-fusion-msg--success'}`}>
          {fusionMsg}
        </div>
      )}

      {cards.length === 0 ? (
        <div className="mycards-empty glass">
          <div className="mycards-empty__icon animate-float">🃏</div>
          <h2>Noch keine Karten!</h2>
          <p>Öffne Booster-Packs um deine erste Karte zu erhalten.</p>
          <a href="/SB-Sammelkartenspiel/booster" className="btn btn-gold btn-lg">✨ Jetzt Booster öffnen</a>
        </div>
      ) : (
        <>
          {/* Filter & Sort */}
          <div className="mycards-controls glass">
            <input
              className="input"
              type="search"
              placeholder="🔍 Karte suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1 }}
            />
            <select
              className="input"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              style={{ maxWidth: '260px' }}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="mycards-grid animate-fade-in-up">
            {sorted.map((card) => {
              const count = cardCounts[card.id] || 1;
              const currentLevel = fusionLevels[card.id] || 0;
              const nextTier = FUSION_TIERS.find(t => t.level === currentLevel + 1);
              const canFuse = nextTier && count >= nextTier.cost;

              const fuseBtnClass = `mycards-fuse-btn mycards-fuse-btn--tier-${currentLevel + 1}`;
              const currentTier = FUSION_TIERS.find(t => t.level === currentLevel);

              return (
                <div key={card.id} className="mycards-card-wrapper">
                  <SBCard
                    card={card}
                    revealed={false}
                    count={count}
                    fusionLevel={currentLevel}
                  />
                  {canFuse && (
                    <button
                      className={`btn ${fuseBtnClass} animate-pulse-glow`}
                      onClick={() => handleFuse(card.id)}
                      disabled={fusionLoading === card.id || sellLoading === card.id}
                      style={{ marginBottom: '5px' }}
                    >
                      {fusionLoading === card.id ? '⏳...' : `${nextTier.name} (${nextTier.cost}x)`}
                    </button>
                  )}
                  {count >= 2 && (
                    <button
                      className="btn btn-sm"
                      onClick={() => handleSell(card)}
                      disabled={sellLoading === card.id || fusionLoading === card.id}
                      style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', fontSize: '0.8rem' }}
                    >
                      {sellLoading === card.id ? '⏳...' : '1x Verkaufen 🌟'}
                    </button>
                  )}
                  {currentTier && (
                    <div className={`mycards-holo-label mycards-holo-label--tier-${currentLevel}`} style={{ marginTop: '8px' }}>
                      {currentTier.name}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {sorted.length === 0 && (
            <div className="loading-center">
              <span>Keine Karten gefunden für &ldquo;{search}&rdquo;</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyCards;
