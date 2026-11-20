import React from 'react';
import cardBackImg from '../../assets/card-back.jpg';
import '../../styles/card.css';

const CardBack = ({ className = '', size = 'normal', onClick }) => {
  return (
    <div className={`sb-card-back ${size === 'large' ? 'sb-card-large' : ''} ${className}`} onClick={onClick}>
      <img 
        src={cardBackImg} 
        alt="Santa-Blanca TCG Card Back" 
        className="sb-card-back__img" 
        loading="eager" 
      />
      <div className="sb-card-back__shine" />
    </div>
  );
};

export default CardBack;
