import { getCardImageUrl, PLACEHOLDER_CARD } from '../../cloudinary/config';
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
}) => {
  const { name, rarity = 'common', type, power, imagePublicId, emoji } = card;

  const imageUrl = imagePublicId
    ? getCardImageUrl(imagePublicId, { width: size === 'large' ? 600 : 300, height: size === 'large' ? 840 : 420 })
    : null;

  const typeColor = TYPE_COLORS[type] || '#8888aa';

  return (
    <div
      className={`sb-card ${rarity} ${!owned ? 'missing' : ''} ${size === 'large' ? 'sb-card-large' : ''} ${revealed ? 'card-reveal' : ''} ${fusionLevel > 0 ? `card--tier-${fusionLevel}` : ''} ${className}`}
      onClick={onClick}
      title={name}
    >
      {/* Holografischer Shine */}
      <div className="sb-card__shine" />

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
          {type && (
            <div className="sb-card__type" style={{ color: typeColor }}>
              {type}
            </div>
          )}
        </div>
        <div className="sb-card__footer">
          <span className={`badge badge-${rarity}`}>{RARITY_EMOJIS[rarity]} {rarity}</span>
          {power && <span className="sb-card__power">⚡{power}</span>}
        </div>
      </div>
    </div>
  );
};

export default SBCard;
