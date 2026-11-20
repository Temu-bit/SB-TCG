import { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { openBoosterPack, claimFreeBoosters } from '../firebase/firestore';
import SBCard from '../components/Card/SBCard';
import boosterPackImg from '../assets/booster-pack.png';
import { sound } from '../utils/sound';
import './Booster.css';

const Booster = () => {
  const { userData, refreshUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [drawnCards, setDrawnCards] = useState([]);
  const [opening, setOpening] = useState(false);
  const [isTearing, setIsTearing] = useState(false);
  const [revealedCards, setRevealedCards] = useState({});
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [canClaim, setCanClaim] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.isMuted());

  const credits = userData?.boosterCredits || 0;

  useEffect(() => {
    if (!userData) return;
    
    const calculateTimeLeft = () => {
      const lastClaimTime = userData.lastBoosterClaimTime?.toDate() || userData.createdAt?.toDate() || new Date();
      const nextClaimTime = new Date(lastClaimTime.getTime() + 30 * 60 * 1000);
      const now = new Date();
      const diff = nextClaimTime - now;

      if (diff <= 0) {
        setCanClaim(true);
        setTimeLeft('00:00');
      } else {
        setCanClaim(false);
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [userData]);

  const handleClaim = async () => {
    if (!canClaim) return;
    setClaiming(true);
    sound.playClick();
    try {
      await claimFreeBoosters(userData.id);
      await refreshUserData();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setClaiming(false);
    }
  };

  // Booster Aufreißen Sequence
  const handleOpenPack = async () => {
    if (credits <= 0 || loading || isTearing) return;
    setLoading(true);
    setError(null);

    // 1. Sound & Reiß-Animation
    setIsTearing(true);
    sound.playPackTear();

    try {
      // 2. Parallel Karten ziehen
      const cards = await openBoosterPack(userData.id);
      
      // 3. Nach der filmreifen Reiß-Animation (850ms) in den Slow-Reveal Modus wechseln
      setTimeout(async () => {
        setDrawnCards(cards);
        setRevealedCards({});
        setOpening(true);
        setIsTearing(false);
        setLoading(false);
        await refreshUserData();
      }, 850);
    } catch (err) {
      console.error(err);
      setError("Fehler beim Öffnen des Booster-Packs.");
      setIsTearing(false);
      setOpening(false);
      setLoading(false);
    }
  };

  // Einzelne Karte aufdecken
  const handleFlipCard = (idx) => {
    if (revealedCards[idx]) return;
    setRevealedCards((prev) => ({ ...prev, [idx]: true }));
  };

  // Alle restlichen Karten nacheinander mit Kaskadeneffekt aufdecken (staggered cascade)
  const handleRevealAll = () => {
    sound.playClick();
    drawnCards.forEach((c, idx) => {
      setTimeout(() => {
        setRevealedCards((prev) => ({ ...prev, [idx]: true }));
        sound.playCardFlip();
        sound.playRevealSound(c.rarity);
      }, idx * 130);
    });
  };

  const handleReset = () => {
    sound.playClick();
    setDrawnCards([]);
    setRevealedCards({});
    setOpening(false);
  };

  const toggleSound = () => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) sound.playClick();
  };

  const revealedCount = Object.keys(revealedCards).length;
  const allRevealed = drawnCards.length > 0 && revealedCount === drawnCards.length;

  return (
    <div className="page booster-page">
      {/* ── Kompakte Dashboard-Statusleiste ── */}
      <div className="booster-dashboard glass">
        <div className="booster-dashboard__item">
          <span className="booster-dashboard__icon">🃏</span>
          <div className="booster-dashboard__text">
            <span className="booster-dashboard__label">Booster</span>
            <strong className="booster-dashboard__value text-gradient-gold">{credits} verfügbar</strong>
          </div>
        </div>

        {/* Regeneration / Daily Timer */}
        {credits < 2 && (
          <div className="booster-dashboard__item booster-dashboard__timer">
            <span className="booster-dashboard__icon">⏳</span>
            <div className="booster-dashboard__text">
              <span className="booster-dashboard__label">Nachschub</span>
              {canClaim ? (
                <button 
                  className="btn btn-gold btn-sm booster-quick-claim" 
                  onClick={handleClaim}
                  disabled={claiming}
                >
                  {claiming ? 'Hole...' : '🎁 2 Packs abholen!'}
                </button>
              ) : (
                <strong className="booster-dashboard__clock">{timeLeft}</strong>
              )}
            </div>
          </div>
        )}

        {/* Audio Toggle */}
        <button 
          className="booster-sound-btn" 
          onClick={toggleSound} 
          title={isMuted ? "Ton einschalten" : "Ton stummschalten"}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>

      {error && <div className="booster-error">{error}</div>}

      {!opening ? (
        <div className="booster-stage-container">
          {credits > 0 ? (
            <div className="booster-altar">
              {/* Das schwebende Booster Pack auf dem Altar */}
              <div 
                className={`booster-pack-wrapper ${isTearing ? 'is-tearing' : ''}`} 
                onClick={handleOpenPack}
                role="button"
                tabIndex={0}
              >
                <div className="booster-pack-card">
                  <img src={boosterPackImg} alt="Chaos Joker Booster Pack" className="booster-pack-img" />

                  {/* Diskrete, elegante Reiß-Ecke oben rechts (verdeckt kein Artwork!) */}
                  {!isTearing && (
                    <div className="booster-tear-corner-hint">
                      <span className="corner-notch" />
                    </div>
                  )}

                  {/* Filmreife Reiß-Effekte beim Öffnen */}
                  {isTearing && (
                    <div className="booster-tear-fx-layer">
                      <div className="booster-rip-laser" />
                      <div className="booster-rip-light-flare" />
                      <div className="booster-rip-sparks">
                        <span className="spark-dot d1" />
                        <span className="spark-dot d2" />
                        <span className="spark-dot d3" />
                        <span className="spark-dot d4" />
                        <span className="spark-dot d5" />
                        <span className="spark-dot d6" />
                        <span className="spark-dot d7" />
                        <span className="spark-dot d8" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Magischer 3D-Boden-Runenkreis (Pedestal) */}
                {!isTearing && (
                  <div className="booster-pedestal" aria-hidden="true">
                    <div className="pedestal-ring ring-outer" />
                    <div className="pedestal-ring ring-middle" />
                    <div className="pedestal-ring ring-inner" />
                    <div className="pedestal-glow" />
                  </div>
                )}
              </div>

              {/* Eleganter Action-Button & Info darunter */}
              {!isTearing && (
                <div className="booster-cta-group animate-fade-in-up">
                  <button 
                    className="btn btn-gold btn-lg booster-main-cta animate-pulse-glow"
                    onClick={handleOpenPack}
                    disabled={loading || isTearing}
                  >
                    ⚡ Pack aufreißen
                  </button>
                  <span className="booster-pack-hint">
                    ✨ 5 Karten • Garantiert mind. 1x Selten oder besser
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* Leerer Zustand (0 Booster) */
            <div className="booster-empty glass">
              <div className="booster-pack-card">
                <img src={boosterPackImg} alt="Booster Pack" className="booster-pack-img booster-pack-img--empty" />
              </div>
              <h2>Keine Booster-Packs übrig!</h2>
              <p>Warte auf die Regeneration oben oder tausche Karten mit anderen Spielern auf dem Markt.</p>
            </div>
          )}
        </div>
      ) : (
        /* ── SLOW-REVEAL AREA ── */
        <div className="booster-reveal-container">
          <div className="booster-reveal-header">
            <h2 className="booster-reveal-title text-gradient-gold">
              {allRevealed ? '🎉 Alle Karten enthüllt!' : `🃏 ${revealedCount} von ${drawnCards.length} aufgedeckt`}
            </h2>
            <p className="booster-reveal-subtitle">
              {allRevealed 
                ? 'Bewege die Maus über die Karten für den 3D-Hologramm-Effekt!' 
                : 'Klicke auf eine verdeckte Karte, um sie einzeln zu enthüllen!'}
            </p>

            {!allRevealed && (
              <button className="btn btn-outline booster-reveal-all-btn" onClick={handleRevealAll}>
                ✨ Alle aufdecken
              </button>
            )}
          </div>

          <div className="booster-reveal-grid">
            {drawnCards.map((card, idx) => (
              <div key={`${card.id}-${idx}`} className="booster-card-slot animate-fade-in-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                <SBCard 
                  card={card} 
                  faceDown={!revealedCards[idx]}
                  onFlip={() => handleFlipCard(idx)}
                  size="large"
                  interactive3D={true}
                />
              </div>
            ))}
          </div>
          
          {allRevealed && (
            <div className="booster-actions animate-fade-in-up">
              <button className="btn btn-primary" onClick={handleReset}>
                ← Zurück
              </button>
              {credits > 0 && (
                <button className="btn btn-gold btn-lg animate-pulse-glow" onClick={() => { handleReset(); handleOpenPack(); }}>
                  ⚡ Nächstes Pack aufreißen ({credits} übrig)
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Booster;
