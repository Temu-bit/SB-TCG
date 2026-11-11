import { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { openBoosterPack, claimFreeBoosters } from '../firebase/firestore';
import SBCard from '../components/Card/SBCard';
import './Booster.css';

const Booster = () => {
  const { userData, refreshUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [drawnCards, setDrawnCards] = useState([]);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [canClaim, setCanClaim] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const credits = userData?.boosterCredits || 0;

  useEffect(() => {
    if (!userData) return;
    
    const calculateTimeLeft = () => {
      // Nutze createdAt als Fallback, falls lastBoosterClaimTime fehlt
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
    try {
      await claimFreeBoosters(userData.id);
      await refreshUserData(); // Holt die neuen Daten (inkl. neuem lastBoosterClaimTime)
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setClaiming(false);
    }
  };

  const handleOpenPack = async () => {
    if (credits <= 0) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Pack Opening Animation starten
      setOpening(true);

      // 2. Im Hintergrund DB anfragen
      const cards = await openBoosterPack(userData.id);
      
      // 3. Karten anzeigen (Animation im CSS geregelt durch class .card-reveal)
      setDrawnCards(cards);
      
      // 4. User Data aktualisieren für korrekte Credit-Anzeige
      await refreshUserData();
    } catch (err) {
      console.error(err);
      setError("Fehler beim Öffnen des Booster-Packs.");
      setOpening(false);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDrawnCards([]);
    setOpening(false);
  };

  return (
    <div className="page booster-page">
      <h1 className="page-title text-gradient">✨ Booster Öffnen</h1>
      
      <div className="booster-status glass">
        <span>Deine Booster-Credits:</span>
        <strong className="booster-status__credits">{credits}</strong>
      </div>

      {error && <div className="booster-error">{error}</div>}

      {!opening ? (
        <div className="booster-container">
          
          {/* FREE BOOSTER SECTION - Nur anzeigen wenn nicht voll */}
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
            <>
              <p className="page-subtitle">Klicke auf das Pack, um 5 zufällige Karten zu ziehen!</p>
              <button 
                className="booster-pack-btn" 
                onClick={handleOpenPack}
                disabled={loading}
              >
                <div className="booster-pack-image-container">
                  <img src="/SB-Sammelkartenspiel/booster-pack.png" alt="Booster Pack" className="booster-pack-img" />
                </div>
              </button>
            </>
          ) : (
            <div className="booster-empty">
              <h2>Keine Booster-Packs übrig!</h2>
              <p>Du kannst weitere durch Events, Level-Ups oder Tauschgeschäfte verdienen.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="booster-reveal-container">
          <div className="booster-reveal-grid">
            {drawnCards.map((card, idx) => (
              <SBCard 
                key={`${card.id}-${idx}`} 
                card={card} 
                revealed={true}
                size="large"
              />
            ))}
          </div>
          
          {drawnCards.length > 0 && (
            <div className="booster-actions animate-fade-in-up" style={{ animationDelay: '1s' }}>
              <button className="btn btn-primary" onClick={handleReset}>
                Zurück
              </button>
              {credits > 0 && (
                <button className="btn btn-gold" onClick={() => { handleReset(); handleOpenPack(); }}>
                  Nächstes Pack öffnen
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
