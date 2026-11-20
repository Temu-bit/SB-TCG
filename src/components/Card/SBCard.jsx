import { useState, useRef, useEffect } from 'react';
import { getCardImageUrl } from '../../cloudinary/config';
import CardBack from './CardBack';
import { sound } from '../../utils/sound';
import '../../styles/card.css';

const RARITY_EMOJIS = {
  common: '⚪',
  uncommon: '🟢',
  rare: '🔵',
  epic: '🟣',
  legendary: '⭐',
};

const TYPE_COLORS = {
  Feuer: '#ff6b35',
  Wasser: '#00d4ff',
  Erde: '#a0522d',
  Luft: '#b0c4de',
  Geist: '#b44fff',
  Licht: '#ffd700',
  Schatten: '#4a4a6a',
  Blitz: '#ffeb3b',
};

const SBCard = ({
  card,
  owned = true,
  showOwned = false,
  size = 'normal',
  onClick,
  revealed = true,
  className = '',
  count = 1,
  fusionLevel = 0,
  faceDown = false,
  onFlip,
  interactive3D = true,
}) => {
  const cardRef = useRef(null);
  const [internalFlipped, setInternalFlipped] = useState(!faceDown);
  const [tiltStyle, setTiltStyle] = useState({});

  // Synchronisiere flip-Status sofort, wenn sich das faceDown-Prop ändert (z. B. bei "Alle aufdecken")
  useEffect(() => {
    setInternalFlipped(!faceDown);
  }, [faceDown]);

  const isFlipped = !faceDown || internalFlipped;

  const { name, rarity = 'common', type, power, imagePublicId, emoji } = card || {};

  const imageUrl = imagePublicId
    ? getCardImageUrl(imagePublicId, { width: size === 'large' ? 600 : 300, height: size === 'large' ? 840 : 420 })
    : null;

  const typeColor = TYPE_COLORS[type] || '#8888aa';

  // 3D Tilt & Gyroskop-Effekt bei Mausbewegung
  const handleMouseMove = (e) => {
    if (!interactive3D || !cardRef.current || !isFlipped) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -14;
    const rotateY = ((x - centerX) / centerX) * 14;

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setTiltStyle({
      transform: `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`,
      '--glare-x': `${glareX}%`,
      '--glare-y': `${glareY}%`,
      '--glare-opacity': '1',
      transition: 'transform 0.08s ease-out, box-shadow 0.08s ease-out',
    });
  };

  const handleMouseLeave = () => {
    if (!interactive3D) return;
    setTiltStyle({
      transform: 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      '--glare-opacity': '0',
      transition: 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.5s ease',
    });
  };

  const handleClick = (e) => {
    if (faceDown && !isFlipped) {
      setInternalFlipped(true);
      sound.playCardFlip();
      sound.playRevealSound(rarity);
      if (onFlip) onFlip(card);
    }
    if (onClick) onClick(e);
  };

  // Kartenvorderseite
  const cardFront = (
    <div className="sb-card__face sb-card__face--front">
      {/* Dynamischer Glanz & Hologramm */}
      <div className="sb-card__shine" />
      <div className="sb-card__glare" />

      {/* Owned Badge */}
      {showOwned && owned && <div className="sb-card__owned-badge">✓ Besitzt</div>}
      {showOwned && !owned && <div className="sb-card__missing-badge">Fehlt</div>}

      {/* Count Badge */}
      {count > 1 && <div className="sb-card__count-badge">x{count}</div>}

      {/* Karten-Bild */}
      {imageUrl ? (
        <img className="sb-card__image" src={imageUrl} alt={name} loading="lazy" />
      ) : (
        <div className="sb-card__image-placeholder" style={{ color: typeColor }}>
          {emoji || RARITY_EMOJIS[rarity]}
        </div>
      )}

      {/* Karten-Body */}
      <div className="sb-card__body">
        <div>
          <div className="sb-card__name">{name}</div>
        </div>
        <div className="sb-card__footer">
          <span className={`badge badge-${rarity}`}>{RARITY_EMOJIS[rarity]} {rarity}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div
      ref={cardRef}
      className={`sb-card ${rarity} ${!owned ? 'missing' : ''} ${size === 'large' ? 'sb-card-large' : ''} ${revealed ? 'card-reveal' : ''} ${fusionLevel > 0 ? `card--tier-${fusionLevel}` : ''} ${isFlipped ? 'is-flipped' : 'is-face-down'} ${className}`}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={tiltStyle}
      title={name}
    >
      <div className="sb-card__flipper">
        {cardFront}
        <div className="sb-card__face sb-card__face--back">
          <CardBack size={size} />
        </div>
      </div>
    </div>
  );
};

export default SBCard;
