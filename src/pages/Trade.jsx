import { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { getOpenTrades, acceptTrade, createTrade, getCardsByIds, subscribeToOpenTrades } from '../firebase/firestore';
import SBCard from '../components/Card/SBCard';
import './Trade.css';

// ── CREATE TRADE MODAL ────────────────────────────────────────────────────────
const CreateTradeModal = ({ onClose, onSuccess, userData, allUserCards }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1); // Schritt 1: Karten anbieten | Schritt 2: Karten suchen
  const [offeredCards, setOfferedCards] = useState([]); // IDs
  const [requestedCards, setRequestedCards] = useState([]); // IDs
  const [allCards, setAllCards] = useState([]); // Alle Karten im Spiel
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Alle Karten für "Suche"-Auswahl laden
    import('../firebase/firestore').then(m => m.getAllCards()).then(setAllCards).catch(console.error);
  }, []);

  const toggleOffer = (cardId) => {
    setOfferedCards(prev =>
      prev.includes(cardId) ? prev.filter(id => id !== cardId) : [...prev, cardId]
    );
  };

  const toggleRequest = (cardId) => {
    setRequestedCards(prev =>
      prev.includes(cardId) ? prev.filter(id => id !== cardId) : [...prev, cardId]
    );
  };

  const handleSubmit = async () => {
    if (offeredCards.length === 0 || requestedCards.length === 0) {
      alert('Bitte wähle mindestens 1 Karte zum Anbieten und 1 Karte zum Suchen aus!');
      return;
    }
    setSubmitting(true);
    try {
      await createTrade(user.uid, offeredCards, requestedCards);
      onSuccess();
    } catch (err) {
      console.error(err);
      alert('Fehler beim Erstellen: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="trade-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="trade-modal glass-elevated animate-fade-in-up">
        <div className="trade-modal__header">
          <h2>➕ Neues Tausch-Angebot</h2>
          <button className="trade-modal__close" onClick={onClose}>✕</button>
        </div>

        {/* Step Indicator */}
        <div className="trade-modal__steps">
          <div className={`trade-modal__step ${step === 1 ? 'active' : step > 1 ? 'done' : ''}`}>
            <span className="trade-modal__step-num">1</span>
            <span>Ich biete</span>
          </div>
          <div className="trade-modal__step-line" />
          <div className={`trade-modal__step ${step === 2 ? 'active' : ''}`}>
            <span className="trade-modal__step-num">2</span>
            <span>Ich suche</span>
          </div>
        </div>

        {/* Schritt 1: Eigene Karten auswählen */}
        {step === 1 && (
          <div className="trade-modal__body">
            <p className="trade-modal__hint">Wähle Karten aus deiner Sammlung, die du anbieten möchtest.</p>
            <div className="trade-modal__selection-info">
              {offeredCards.length > 0
                ? `✅ ${offeredCards.length} Karte(n) ausgewählt`
                : '☑️ Noch nichts ausgewählt'}
            </div>
            <div className="trade-modal__card-grid">
              {allUserCards.map(card => {
                const selected = offeredCards.includes(card.id);
                return (
                  <div
                    key={card.id}
                    className={`trade-modal__card-pick ${selected ? 'selected' : ''}`}
                    onClick={() => toggleOffer(card.id)}
                  >
                    <SBCard card={card} revealed={false} size="normal" />
                    {selected && <div className="trade-modal__card-check">✓</div>}
                  </div>
                );
              })}
            </div>
            <div className="trade-modal__footer">
              <button className="btn btn-ghost" onClick={onClose}>Abbrechen</button>
              <button
                className="btn btn-primary"
                onClick={() => setStep(2)}
                disabled={offeredCards.length === 0}
              >
                Weiter →
              </button>
            </div>
          </div>
        )}

        {/* Schritt 2: Gewünschte Karten wählen */}
        {step === 2 && (
          <div className="trade-modal__body">
            <p className="trade-modal__hint">Wähle Karten, die du als Gegenleistung haben möchtest.</p>
            <div className="trade-modal__selection-info">
              {requestedCards.length > 0
                ? `✅ ${requestedCards.length} Karte(n) gewünscht`
                : '☑️ Noch nichts ausgewählt'}
            </div>
            <div className="trade-modal__card-grid">
              {allCards.map(card => {
                const selected = requestedCards.includes(card.id);
                // Eigene bereits angebotene Karten ausgräuen
                const isOffered = offeredCards.includes(card.id);
                return (
                  <div
                    key={card.id}
                    className={`trade-modal__card-pick ${selected ? 'selected' : ''} ${isOffered ? 'disabled' : ''}`}
                    onClick={() => !isOffered && toggleRequest(card.id)}
                  >
                    <SBCard card={card} revealed={false} size="normal" />
                    {selected && <div className="trade-modal__card-check">✓</div>}
                    {isOffered && <div className="trade-modal__card-offered">Angeboten</div>}
                  </div>
                );
              })}
            </div>
            <div className="trade-modal__footer">
              <button className="btn btn-ghost" onClick={() => setStep(1)}>← Zurück</button>
              <button
                className="btn btn-gold"
                onClick={handleSubmit}
                disabled={requestedCards.length === 0 || submitting}
              >
                {submitting ? '⏳ Erstellen...' : '🔄 Angebot erstellen'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── MAIN TRADE PAGE ───────────────────────────────────────────────────────────
const Trade = () => {
  const { user, userData, refreshUserData } = useAuth();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userCards, setUserCards] = useState([]);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToOpenTrades(
      async (openTrades) => {
        try {
          const enrichedTrades = await Promise.all(
            openTrades.map(async (trade) => {
              const offered = await getCardsByIds(trade.offeredCards);
              const requested = await getCardsByIds(trade.requestedCards);
              return { ...trade, offeredDetails: offered, requestedDetails: requested };
            })
          );
          setTrades(enrichedTrades);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        // Fehler beim Listener → Laden stoppen
        console.error('Trade-Listener Fehler:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userData?.collection?.length) {
      getCardsByIds(userData.collection).then(setUserCards).catch(console.error);
    }
  }, [userData?.collection]);

  const handleAccept = async (trade) => {
    const hasRequiredCards = trade.requestedCards.every((id) =>
      userData.collection.includes(id)
    );

    if (!hasRequiredCards) {
      alert('Dir fehlen die benötigten Karten für diesen Tausch!');
      return;
    }

    if (!window.confirm('Möchtest du diesen Tausch wirklich annehmen? Deine Karten werden dafür abgegeben.')) {
      return;
    }

    setProcessingId(trade.id);
    try {
      await acceptTrade(trade.id, user.uid);
      await refreshUserData();
      alert('Tausch erfolgreich! 🎉');
    } catch (err) {
      console.error(err);
      alert('Fehler beim Tauschen.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleTradeCreated = () => {
    setShowCreateModal(false);
  };

  return (
    <div className="page trade-page">
      <h1 className="page-title text-gradient-blue">🔄 Tauschmarkt</h1>
      <p className="page-subtitle">Handel Karten mit anderen Trainern auf der ganzen Welt.</p>

      {/* Button zum Erstellen */}
      <div className="trade-actions glass">
        <p>Du willst selbst ein Angebot erstellen?</p>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          ➕ Neues Angebot erstellen
        </button>
      </div>

      <div className="trade-list">
        {loading ? (
          <div className="loading-center">
            <div className="spinner" />
            <span>Marktplatz wird geladen...</span>
          </div>
        ) : trades.length === 0 ? (
          <div className="trade-empty glass">
            <div className="trade-empty__icon animate-float">🌬️</div>
            <h2>Nichts los hier!</h2>
            <p>Aktuell gibt es keine offenen Tausch-Angebote.</p>
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              ➕ Erstes Angebot erstellen
            </button>
          </div>
        ) : (
          trades.map((trade) => (
            <div key={trade.id} className="trade-offer glass-elevated animate-fade-in-up">

              <div className="trade-offer__section">
                <div className="trade-offer__label badge badge-legendary">Spieler Bietet</div>
                <div className="trade-offer__cards">
                  {trade.offeredDetails.map((c) => (
                    <SBCard key={c.id} card={c} size="small" />
                  ))}
                </div>
              </div>

              <div className="trade-offer__divider">
                <div className="trade-offer__arrows">🔄</div>
              </div>

              <div className="trade-offer__section">
                <div className="trade-offer__label badge badge-rare">Spieler Sucht</div>
                <div className="trade-offer__cards">
                  {trade.requestedDetails.map((c) => (
                    <SBCard
                      key={c.id}
                      card={c}
                      size="small"
                      owned={userData?.collection?.includes(c.id)}
                      showOwned
                    />
                  ))}
                </div>
              </div>

              <div className="trade-offer__action">
                {trade.fromUser === user.uid ? (
                  <button className="btn btn-ghost" disabled>
                    Dein Angebot
                  </button>
                ) : (
                  <button
                    className="btn btn-accent"
                    onClick={() => handleAccept(trade)}
                    disabled={processingId === trade.id}
                  >
                    {processingId === trade.id ? '⏳' : 'Tausch annehmen'}
                  </button>
                )}
              </div>

            </div>
          ))
        )}
      </div>

      {/* Create Trade Modal */}
      {showCreateModal && (
        <CreateTradeModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleTradeCreated}
          userData={userData}
          allUserCards={userCards}
        />
      )}
    </div>
  );
};

export default Trade;
