import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/useAuth';
import { subscribeToAllCards, DUST_BUY_COSTS, DUST_VALUES, buyCardWithDust, sellCard } from '../firebase/firestore';
import SBCard from '../components/Card/SBCard';
import './DustShop.css';

const RARITIES = ['all', 'common', 'uncommon', 'rare', 'epic', 'legendary'];

const RARITY_EMOJIS = {
  common: '⚪',
  uncommon: '🟢',
  rare: '🔵',
  epic: '🟣',
  legendary: '⭐',
};

const DustShop = () => {
  const { user, userData, refreshUserData } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [processingId, setProcessingId] = useState(null);
  const [notification, setNotification] = useState(null); // { type: 'success'|'error', text }

  const ownedIds = useMemo(() => new Set(userData?.collection || []), [userData]);
  const stardust = userData?.stardust || 0;

  useEffect(() => {
    const unsub = subscribeToAllCards((fetched) => {
      setCards(fetched);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    return cards.filter((c) => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
      const matchRarity = rarityFilter === 'all' || c.rarity === rarityFilter;
      return matchSearch && matchRarity;
    });
  }, [cards, search, rarityFilter]);

  const showNotification = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleBuy = async (card) => {
    const cost = DUST_BUY_COSTS[card.rarity] || 40;
    if (stardust < cost) {
      showNotification('error', `Zu wenig Sternenstaub! Du brauchst ${cost} 🌟`);
      return;
    }
    if (!window.confirm(`${card.name} für ${cost} 🌟 Sternenstaub kaufen?`)) return;

    setProcessingId(card.id);
    try {
      await buyCardWithDust(user.uid, card.id);
      await refreshUserData();
      showNotification('success', `✅ ${card.name} gekauft! -${cost} 🌟`);
    } catch (err) {
      showNotification('error', err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleSell = async (card) => {
    const cardCount = userData?.cardCounts?.[card.id] || 0;
    if (cardCount < 2) {
      showNotification('error', 'Du brauchst mindestens 2 Kopien zum Verkaufen!');
      return;
    }
    const gain = DUST_VALUES[card.rarity] || 10;
    if (!window.confirm(`${card.name} (Duplikat) für ${gain} 🌟 Sternenstaub verkaufen?`)) return;

    setProcessingId(card.id + '_sell');
    try {
      await sellCard(user.uid, card.id);
      await refreshUserData();
      showNotification('success', `💰 Karte verkauft! +${gain} 🌟`);
    } catch (err) {
      showNotification('error', err.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="page dust-shop-page">

      {/* Notification Toast */}
      {notification && (
        <div className={`dust-toast ${notification.type} animate-fade-in-up`}>
          {notification.text}
        </div>
      )}

      {/* Header */}
      <h1 className="page-title text-gradient">🌟 Sternenstaub-Shop</h1>
      <p className="page-subtitle">
        Kaufe gezielt Karten mit deinem gesammelten Sternenstaub.
      </p>

      {/* Stardust Balance Banner */}
      <div className="dust-balance glass">
        <div className="dust-balance__icon">🌟</div>
        <div className="dust-balance__info">
          <span className="dust-balance__label">Dein Sternenstaub</span>
          <span className="dust-balance__amount">{stardust.toLocaleString('de-DE')}</span>
        </div>
        <div className="dust-balance__guide">
          <div className="dust-guide__title">💡 Karten verkaufen für Staub:</div>
          <div className="dust-guide__pills">
            {Object.entries(DUST_VALUES).map(([rarity, val]) => (
              <span key={rarity} className={`dust-guide__pill badge badge-${rarity}`}>
                {RARITY_EMOJIS[rarity]} +{val}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Preistabelle */}
      <div className="dust-price-table glass">
        <div className="dust-price-table__title">🛒 Shop-Preise</div>
        <div className="dust-price-table__rows">
          {Object.entries(DUST_BUY_COSTS).map(([rarity, cost]) => (
            <div key={rarity} className="dust-price-row">
              <span className={`badge badge-${rarity}`}>{RARITY_EMOJIS[rarity]} {rarity}</span>
              <span className="dust-price-row__cost">🌟 {cost.toLocaleString('de-DE')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter */}
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

      {/* Card Grid */}
      {loading ? (
        <div className="loading-center">
          <div className="spinner" />
          <span>Shop wird geladen...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="loading-center">
          <span style={{ fontSize: '3rem' }}>🔍</span>
          <span>Keine Karten gefunden</span>
        </div>
      ) : (
        <div className="dust-shop-grid animate-fade-in-up">
          {filtered.map((card) => {
            const cost = DUST_BUY_COSTS[card.rarity] || 40;
            const sellValue = DUST_VALUES[card.rarity] || 10;
            const canAfford = stardust >= cost;
            const owned = ownedIds.has(card.id);
            const cardCount = userData?.cardCounts?.[card.id] || 0;
            const canSell = cardCount >= 2;
            const isBuying = processingId === card.id;
            const isSelling = processingId === card.id + '_sell';

            return (
              <div key={card.id} className={`dust-card glass-elevated ${!canAfford ? 'dust-card--broke' : ''}`}>
                {/* Card Preview */}
                <div className="dust-card__preview">
                  <SBCard card={card} owned={owned} size="normal" revealed={false} />
                  {owned && (
                    <div className="dust-card__owned-badge">
                      {cardCount > 1 ? `x${cardCount}` : '✓'}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="dust-card__info">
                  <div className="dust-card__name">{card.name}</div>
                  <span className={`badge badge-${card.rarity}`}>
                    {RARITY_EMOJIS[card.rarity]} {card.rarity}
                  </span>

                  {/* Buy button */}
                  <button
                    className={`btn dust-card__buy-btn ${canAfford ? 'btn-gold' : 'btn-ghost'}`}
                    onClick={() => handleBuy(card)}
                    disabled={!canAfford || isBuying || isSelling}
                    title={!canAfford ? `Zu wenig Staub (${cost} 🌟 nötig)` : ''}
                  >
                    {isBuying ? '⏳' : canAfford ? `🛒 ${cost.toLocaleString('de-DE')} 🌟` : `❌ ${cost.toLocaleString('de-DE')} 🌟`}
                  </button>

                  {/* Sell duplicate button */}
                  {canSell && (
                    <button
                      className="btn btn-accent dust-card__sell-btn"
                      onClick={() => handleSell(card)}
                      disabled={isBuying || isSelling}
                    >
                      {isSelling ? '⏳' : `💰 Duplikat +${sellValue} 🌟`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DustShop;
