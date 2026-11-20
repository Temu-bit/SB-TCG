import React from 'react';
import '../../styles/card.css';

const CardBack = ({ className = '', size = 'normal', onClick }) => {
  return (
    <div className={`sb-card-back ${size === 'large' ? 'sb-card-large' : ''} ${className}`} onClick={onClick}>
      <div className="sb-card-back__pattern">
        {/* Runic Golden Border */}
        <div className="sb-card-back__border">
          <div className="sb-card-back__corner top-left">✦</div>
          <div className="sb-card-back__corner top-right">✦</div>
          <div className="sb-card-back__corner bottom-left">✦</div>
          <div className="sb-card-back__corner bottom-right">✦</div>

          {/* Central Emblem */}
          <div className="sb-card-back__emblem">
            <div className="sb-card-back__rune-ring">
              <div className="sb-card-back__star">⭐</div>
            </div>
            <div className="sb-card-back__title">SANTA BLANCA</div>
            <div className="sb-card-back__subtitle">TCG</div>
          </div>
        </div>
      </div>
      <div className="sb-card-back__shine" />
    </div>
  );
};

export default CardBack;
