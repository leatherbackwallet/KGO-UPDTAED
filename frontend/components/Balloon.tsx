/**
 * Balloon Component
 * 
 * A decorative balloon that floats upward continuously in a loop.
 * Used for festive animations on the landing page.
 */

import React from 'react';

interface BalloonProps {
  /** Horizontal position as percentage (0-100) */
  left: number;
  /** Animation delay in seconds */
  delay: number;
  /** Animation duration in seconds */
  duration: number;
  /** Balloon color */
  color: string;
  /** Balloon size multiplier */
  size?: number;
}

const Balloon: React.FC<BalloonProps> = ({ 
  left, 
  delay, 
  duration, 
  color,
  size = 1 
}) => {
  const balloonSize = 40 * size;
  const stringLength = 60 * size;

  return (
    <div
      className="balloon-container"
      style={{
        position: 'absolute',
        left: `${left}%`,
        bottom: '-100px',
        animation: `balloonFloat ${duration}s ease-in infinite`,
        animationDelay: `${delay}s`,
        willChange: 'transform',
        pointerEvents: 'none',
        zIndex: 5,
      }}
    >
      {/* Balloon */}
      <div
        className="balloon"
        style={{
          width: `${balloonSize}px`,
          height: `${balloonSize * 1.2}px`,
          background: `radial-gradient(circle at 30% 30%, ${color}, ${color}dd)`,
          borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
          position: 'relative',
          boxShadow: `inset -10px -10px 0 rgba(0,0,0,0.1), 0 0 20px ${color}40`,
          transform: 'rotate(-5deg)',
        }}
      >
        {/* Highlight */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '25%',
            width: '30%',
            height: '30%',
            background: 'rgba(255, 255, 255, 0.6)',
            borderRadius: '50%',
          }}
        />
        {/* Knot */}
        <div
          style={{
            position: 'absolute',
            bottom: '-5px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '8px',
            height: '8px',
            background: color,
            borderRadius: '50%',
          }}
        />
      </div>
      
      {/* String */}
      <div
        className="balloon-string"
        style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '2px',
          height: `${stringLength}px`,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.1))',
          transformOrigin: 'top center',
        }}
      />
    </div>
  );
};

export default Balloon;




