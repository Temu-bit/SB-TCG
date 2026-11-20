import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { getCardFullsize } from '../../cloudinary/config';
import CardBack from './CardBack';
import { sound } from '../../utils/sound';
import { FUSION_TIERS } from '../../firebase/firestore';
import './CardInspectorModal.css';

const RARITY_COLORS = {
  common: '#94a3b8',
  uncommon: '#4ade80',
  rare: '#38bdf8',
  epic: '#c084fc',
  legendary: '#fbbf24',
};

const ELEMENT_DATA = {
  Feuer: {
    icon: '🔥',
    color: '#ff6b35',
    title: 'Feuer-Affinität',
    desc: 'Brennt durch Barrieren. Stark gegen Erde, empfindlich gegen Wasser.',
  },
  Wasser: {
    icon: '💧',
    color: '#00d4ff',
    title: 'Wasser-Affinität',
    desc: 'Fließend & unaufhaltsam. Stark gegen Feuer, leitet Blitz-Schock.',
  },
  Erde: {
    icon: '🌿',
    color: '#a0522d',
    title: 'Erde-Affinität',
    desc: 'Unerschütterlich massiv. Absorbiert Blitz, bricht unter Feuer.',
  },
  Luft: {
    icon: '🌪️',
    color: '#b0c4de',
    title: 'Luft-Affinität',
    desc: 'Rasend schnell & ungreifbar. Stark gegen Geist, verweht im Sturm.',
  },
  Geist: {
    icon: '🔮',
    color: '#b44fff',
    title: 'Geist-Affinität',
    desc: 'Transzendiert die Realität. Stark gegen Licht, scheut den Schatten.',
  },
  Licht: {
    icon: '☀️',
    color: '#ffd700',
    title: 'Licht-Affinität',
    desc: 'Bannet alle Finsternis. Stark gegen Schatten, geblendet von Geistern.',
  },
  Schatten: {
    icon: '🌑',
    color: '#71717a',
    title: 'Schatten-Affinität',
    desc: 'Verschlingt die Hoffnung. Stark gegen Geist, verzehrt vom Licht.',
  },
  Blitz: {
    icon: '⚡',
    color: '#facc15',
    title: 'Blitz-Affinität',
    desc: 'Blitzschnelle Überladung. Stark gegen Wasser, gebremst von Erde.',
  },
};

const CardInspectorModal = ({
  card,
  cardsList = [],
  onClose,
  onSelectCard,
  ownedIds = new Set(),
  cardCounts = {},
  fusionLevels = {},
}) => {
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });

  const dragStartRef = useRef({ x: 0, y: 0, rotX: 0, rotY: 0 });
  const cardStageRef = useRef(null);

  // Index in cardsList finden
  const currentIndex = useMemo(() => {
    if (!cardsList || !cardsList.length || !card) return -1;
    return cardsList.findIndex((c) => c.id === card.id);
  }, [cardsList, card]);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < cardsList.length - 1;

  // Sound beim ersten Öffnen der Detailansicht
  useEffect(() => {
    if (card) {
      sound.playClick();
    }
  }, [card?.id]);

  // Tastaturbedienung (Esc, Pfeiltasten)
  const handlePrev = useCallback(() => {
    if (hasPrev && onSelectCard) {
      sound.playCardFlip();
      setIsFlipped(false);
      setRotX(0);
      setRotY(0);
      onSelectCard(cardsList[currentIndex - 1]);
    }
  }, [hasPrev, onSelectCard, cardsList, currentIndex]);

  const handleNext = useCallback(() => {
    if (hasNext && onSelectCard) {
      sound.playCardFlip();
      setIsFlipped(false);
      setRotX(0);
      setRotY(0);
      onSelectCard(cardsList[currentIndex + 1]);
    }
  }, [hasNext, onSelectCard, cardsList, currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handlePrev, handleNext]);

  if (!card) return null;

  const { name, rarity = 'common', type = 'Geist', power = 50, imagePublicId, description } = card;

  const elementInfo = ELEMENT_DATA[type] || {
    icon: '✨',
    color: '#818cf8',
    title: `${type}-Affinität`,
    desc: 'Eine mächtige mystische Kraft der Santa-Blanca-Region.',
  };

  const isOwned = ownedIds.has(card.id);
  const count = cardCounts[card.id] || (isOwned ? 1 : 0);
  const fusionLevel = fusionLevels[card.id] || 0;
  const currentTier = FUSION_TIERS.find((t) => t.level === fusionLevel);

  const fullImageUrl = imagePublicId ? getCardFullsize(imagePublicId) : null;
  const ambientColor = RARITY_COLORS[rarity] || elementInfo.color;

  // 3D Drag Rotation (Maus / Touch)
  const handlePointerDown = (e) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX || (e.touches && e.touches[0].clientX) || 0,
      y: e.clientY || (e.touches && e.touches[0].clientY) || 0,
      rotX,
      rotY,
    };
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;

    // Y-Rotation (horizontaler Zug) und X-Rotation (vertikaler Zug)
    const newRotY = dragStartRef.current.rotY + deltaX * 0.7;
    const newRotX = Math.max(-45, Math.min(45, dragStartRef.current.rotX - deltaY * 0.7));

    setRotY(newRotY);
    setRotX(newRotX);

    // Glare Position anpassen
    const glareX = Math.max(10, Math.min(90, 50 + (newRotY % 180) * 0.8));
    const glareY = Math.max(10, Math.min(90, 50 - newRotX * 0.8));
    setGlarePos({ x: glareX, y: glareY });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Flip Toggle (Vorder- / Rückseite)
  const handleToggleFlip = () => {
    sound.playCardFlip();
    const nextFlipped = !isFlipped;
    setIsFlipped(nextFlipped);
    setRotY(nextFlipped ? 180 : 0);
    setRotX(0);
  };

  // Reset Ausrichtung
  const handleResetAlignment = () => {
    sound.playClick();
    setRotX(0);
    setRotY(isFlipped ? 180 : 0);
    setGlarePos({ x: 50, y: 50 });
  };

  // Sound abspielen
  const handlePlaySound = () => {
    sound.playRevealSound(rarity);
  };

  // Berechne den gesamten Transform-Style der 3D-Karte
  const transformStyle = {
    transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
    transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.2, 0.9, 0.3, 1.1)',
    '--glare-x': `${glarePos.x}%`,
    '--glare-y': `${glarePos.y}%`,
  };

  return (
    <div className="sb-inspector-backdrop" onClick={onClose}>
      <div
        className="sb-inspector-ambient"
        style={{ '--ambient-color': ambientColor }}
        aria-hidden="true"
      />

      <div className="sb-inspector-modal" onClick={(e) => e.stopPropagation()}>
        {/* Schließen Button */}
        <button
          className="sb-inspector-close"
          onClick={onClose}
          aria-label="Modal schließen"
          title="Schließen (Esc)"
        >
          ✕
        </button>

        {/* ── 3D STAGE (LINKE SPALTE) ── */}
        <div
          className="sb-inspector-stage"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          ref={cardStageRef}
        >
          <div
            className={`sb-inspector-card-anchor ${isDragging ? 'is-dragging' : ''}`}
            onPointerDown={handlePointerDown}
          >
            <div
              className={`sb-inspector-card-3d sb-card ${rarity} ${fusionLevel > 0 ? `card--tier-${fusionLevel}` : ''}`}
              style={transformStyle}
            >
              {/* VORDERSEITE */}
              <div className="sb-inspector-card-face sb-inspector-face-front">
                <div className="sb-inspector-card-img-wrap">
                  {fullImageUrl ? (
                    <img
                      src={fullImageUrl}
                      alt={name}
                      className="sb-inspector-card-img"
                      draggable="false"
                    />
                  ) : (
                    <div className="sb-inspector-placeholder" style={{ color: elementInfo.color }}>
                      {elementInfo.icon}
                    </div>
                  )}
                  {/* Holographischer Schimmer & Foil */}
                  <div className="sb-inspector-holo-foil" />
                  <div className="sb-inspector-glare" />
                </div>

                <div className="sb-inspector-front-body">
                  <div className="sb-inspector-front-title-row">
                    <span className="sb-inspector-front-name">{name}</span>
                    <span
                      className="sb-inspector-front-element"
                      style={{ color: elementInfo.color }}
                    >
                      {elementInfo.icon} {type}
                    </span>
                  </div>
                  <div className="sb-inspector-front-bottom-row">
                    <span className={`badge badge-${rarity}`}>{rarity}</span>
                    <span className="sb-inspector-front-power">⚡ {power}</span>
                  </div>
                </div>
              </div>

              {/* RÜCKSEITE (Chaos Joker) */}
              <div className="sb-inspector-card-face sb-inspector-face-back">
                <CardBack size="large" />
                <div className="sb-inspector-glare" />
              </div>
            </div>
          </div>

          {/* Steuerelemente unter der 3D-Bühne */}
          <div className="sb-inspector-stage-hint">
            <span>🖱️ Klicken & Ziehen zum freien 360°-Drehen</span>
          </div>

          <div className="sb-inspector-stage-controls">
            <button
              className={`sb-stage-btn ${isFlipped ? 'active' : ''}`}
              onClick={handleToggleFlip}
            >
              🔄 {isFlipped ? 'Vorderseite' : 'Rückseite'}
            </button>
            <button className="sb-stage-btn" onClick={handleResetAlignment} title="Ausrichtung zurücksetzen">
              🎯 Zentrieren
            </button>
            <button className="sb-stage-btn" onClick={handlePlaySound} title="Seltenheits-Klang abspielen">
              🔊 Klang
            </button>
          </div>
        </div>

        {/* ── DETAILS PANEL (RECHTE SPALTE) ── */}
        <div className="sb-inspector-details">
          {/* Header Info */}
          <div className="sb-inspector-meta-header">
            <div className="sb-inspector-tags-row">
              <span className={`badge badge-${rarity}`}>⭐ {rarity.toUpperCase()}</span>
              {currentTier && (
                <span className={`badge mycards-holo-label--tier-${fusionLevel}`}>
                  {currentTier.name}
                </span>
              )}
            </div>
            <h2 className="sb-inspector-title text-gradient">{name}</h2>
          </div>

          {/* Element Affinity Box */}
          <div className="sb-inspector-element-box">
            <div
              className="sb-element-icon-circle"
              style={{ color: elementInfo.color, borderColor: elementInfo.color }}
            >
              {elementInfo.icon}
            </div>
            <div className="sb-element-info-text">
              <div className="sb-element-info-title">{elementInfo.title}</div>
              <div className="sb-element-info-desc">{elementInfo.desc}</div>
            </div>
          </div>

          {/* Kraft (Power) Stat Bar */}
          <div className="sb-inspector-stat-section">
            <div className="sb-stat-header">
              <span>⚡ Kampfkraft (Power)</span>
              <strong>{power} / 100</strong>
            </div>
            <div className="sb-stat-bar-track">
              <div
                className="sb-stat-bar-fill"
                style={{ width: `${Math.min(100, Math.max(10, power))}%` }}
              />
            </div>
          </div>

          {/* Lore / Story Text */}
          <div className="sb-inspector-lore">
            &ldquo;{description || 'Eine legendäre Karte aus der mystischen Welt von Santa-Blanca, durchdrungen von antiken Kräften.'}&rdquo;
          </div>

          {/* Sammlungs- & Fusionsstatus */}
          <div className="sb-inspector-status-grid">
            <div className="sb-status-card">
              <span className="sb-status-card__label">Sammlung</span>
              <span className={`sb-status-card__value ${isOwned ? 'is-owned' : 'not-owned'}`}>
                {isOwned ? `✓ Im Besitz (${count}x)` : '✕ Fehlt noch'}
              </span>
            </div>

            <div className="sb-status-card">
              <span className="sb-status-card__label">Fusions-Stufe</span>
              <span className="sb-status-card__value">
                {currentTier ? currentTier.name : 'Basis-Karte'}
              </span>
            </div>
          </div>

          {/* Navigation Bar unten */}
          {cardsList.length > 1 && (
            <div className="sb-inspector-nav-bar">
              <span className="sb-inspector-nav-counter">
                Karte {currentIndex + 1} von {cardsList.length}
              </span>
              <div className="sb-inspector-nav-actions">
                <button
                  className="sb-nav-arrow-btn"
                  onClick={handlePrev}
                  disabled={!hasPrev}
                  title="Vorherige Karte (Pfeil links)"
                >
                  ← Zurück
                </button>
                <button
                  className="sb-nav-arrow-btn"
                  onClick={handleNext}
                  disabled={!hasNext}
                  title="Nächste Karte (Pfeil rechts)"
                >
                  Weiter →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardInspectorModal;
