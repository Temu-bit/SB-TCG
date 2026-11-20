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
      
      // 3. Nach der Reiß-Animation (650ms) in den Slow-Reveal Modus wechseln
      setTimeout(async () => {
        setDrawnCards(cards);
        setRevealedCards({});
        setOpening(true);
        setIsTearing(false);
        setLoading(false);
        await refreshUserData();
      }, 700);
    } catch (err) {
      console.error(err);
      setError("Fehler beim Öffnen des Booster-Packs.");
      setIsTearing(false);
      setOpening(false);
      setLoading(false);
    }
  };

  // Einzelne Karte aufdecken
  const handleFlipCard = (idx, card) => {
    if (revealedCards[idx]) return;
    setRevealedCards((prev) => ({ ...prev, [idx]: true }));
  };

  // Alle restlichen Karten auf einmal aufdecken
  const handleRevealAll = () => {
    sound.playCardFlip();
    const all = {};
    drawnCards.forEach((c, idx) => {
      all[idx] = true;
    });
    setRevealedCards(all);

    // Bester Sound für das höchste Rarity-Element abspielen
    const hasLegendary = drawnCards.some((c) => c.rarity === 'legendary');
    const hasEpic = drawnCards.some((c) => c.rarity === 'epic');
    const hasRare = drawnCards.some((c) => c.rarity === 'rare');

    if (hasLegendary) sound.playRevealSound('legendary');
    else if (hasEpic) sound.playRevealSound('epic');
    else if (hasRare) sound.playRevealSound('rare');
    else sound.playRevealSound('common');
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
      <div className="booster-header-row">
        <h1 className="page-title text-gradient">✨ Booster Öffnen</h1>
        <button 
          className="booster-sound-toggle glass" 
          onClick={toggleSound} 
          title={isMuted ? "Ton einschalten" : "Ton stummschalten"}
        >
          {isMuted ? '🔇 Ton aus' : '🔊 Ton an'}
        </button>
      </div>
      
      <div className="booster-status glass">
        <span>Deine Booster-Credits:</span>
        <strong className="booster-status__credits">{credits}</strong>
      </div>

      {error && <div className="booster-error">{error}</div>}

      {!opening ? (
        <div className="booster-container">
          
          {/* FREE BOOSTER SECTION */}
          {credits < 2 && (
            <div className="booster-claim-section glass-elevated">
              <h3>🎁 Tägliche Belohnung</h3>
              <p>Warte auf die Regeneration, um wieder 2 volle Booster zu erhalten!</p>
              {canClaim ? (
                <button 
                  className="btn btn-primary booster-claim-btn animate-pulse-glow" 
                  onClick={handleClaim}
                  disabled={claiming}
                >
                  {claiming ? 'Hole Booster...' : '🎉 2 Free Booster abholen!'}
                </button>
              ) : (
                <div className="booster-timer">
                  <span>Nächste Booster in:</span>
                  <strong className="booster-timer__clock">{timeLeft}</strong>
                </div>
              )}
            </div>
          )}

          {credits < 2 && <div className="booster-divider"></div>}

          {credits > 0 ? (
            <div className="booster-interactive-area">
              <p className="page-subtitle booster-prompt animate-pulse">
                ⚡ Klicke auf das Pack, um es aufzureißen!
              </p>
              
              <button 
                className={`booster-pack-btn ${isTearing ? 'is-tearing' : ''}`} 
                onClick={handleOpenPack}
                disabled={loading || isTearing}
              >
                <div className="booster-pack-image-container">
                  <img src={boosterPackImg} alt="Booster Pack" className="booster-pack-img" />
                  
                  {/* Visueller Riss- & Funken-Effekt beim Aufreißen */}
                  {isTearing && (
                    <div className="booster-tear-fx">
                      <div className="booster-tear-line" />
                      <div className="booster-tear-sparks">⚡✨💥</div>
                    </div>
                  )}
                </div>
              </button>
            </div>
          ) : (
            <div className="booster-empty">
              <div className="booster-pack-image-container booster-pack-image-container--empty">
                <img src={boosterPackImg} alt="Booster Pack" className="booster-pack-img booster-pack-img--empty" />
              </div>
              <h2>Keine Booster-Packs übrig!</h2>
              <p>Warte auf die Regeneration oben oder verdiene weitere durch Events und Tauschgeschäfte.</p>
            </div>
          )}
        </div>
      ) : (
        /* SLOW-REVEAL AREA */
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
              <div key={`${card.id}-${idx}`} className="booster-card-slot animate-fade-in-up" style={{ animationDelay: `${idx * 0.12}s` }}>
                <SBCard 
                  card={card} 
                  faceDown={!revealedCards[idx]}
                  onFlip={() => handleFlipCard(idx, card)}
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
