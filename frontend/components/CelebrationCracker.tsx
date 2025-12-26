/**
 * Celebration Cracker Component
 * 
 * A rocket firecracker that launches from the ground, flies upward, and bursts in the sky.
 * Used for festive animations on the landing page.
 */

import React, { useState, useEffect, useRef } from 'react';

interface CrackerProps {
  /** Horizontal position as percentage (0-100) */
  left: number;
  /** Minimum time between launches in seconds */
  minInterval?: number;
  /** Maximum time between launches in seconds */
  maxInterval?: number;
  /** Launch duration in seconds */
  launchDuration?: number;
  /** Burst height as percentage from top (0-100) - higher means closer to top */
  burstHeight?: number;
  /** Rocket color theme */
  rocketColor?: string;
}

interface FireworkParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  angle: number;
  velocity: number;
  size: number;
  delay: number;
}

// Firework colors - vibrant and festive
const fireworkColors = [
  '#FFD700', '#FF6B6B', '#4ECDC4', '#FFE66D', 
  '#FF6B9D', '#C7CEEA', '#FFA500', '#FF1493',
  '#00FF00', '#FF00FF', '#00FFFF', '#FFFF00'
];

// Rocket color themes
const rocketThemes = [
  { primary: '#FF6B6B', secondary: '#FF8E8E', flame: '#FF4500' }, // Red
  { primary: '#4ECDC4', secondary: '#6EDDD6', flame: '#00CED1' }, // Cyan
  { primary: '#FFD700', secondary: '#FFED4E', flame: '#FFA500' }, // Gold
  { primary: '#FF6B9D', secondary: '#FF8FB3', flame: '#FF1493' }, // Pink
  { primary: '#C7CEEA', secondary: '#D4DBF0', flame: '#9370DB' }, // Lavender
];

const CelebrationCracker: React.FC<CrackerProps> = ({
  left,
  minInterval = 6,
  maxInterval = 15,
  launchDuration = 2.5,
  burstHeight = 40, // Default to 40% from top (higher in sky)
  rocketColor,
}) => {
  const [isLaunching, setIsLaunching] = useState(false);
  const [isBursting, setIsBursting] = useState(false);
  const [particles, setParticles] = useState<FireworkParticle[]>([]);
  const [key, setKey] = useState(0);
  const timeoutRefs = useRef<Array<NodeJS.Timeout>>([]);
  const particleIdRef = useRef(0);
  
  // Select rocket color theme
  const theme = rocketColor 
    ? rocketThemes.find(t => t.primary === rocketColor) || rocketThemes[Math.floor(Math.random() * rocketThemes.length)]
    : rocketThemes[Math.floor(Math.random() * rocketThemes.length)];
  
  // Calculate the translateY value for the burst height
  // burstHeight is percentage from top, so we need to convert to translateY from bottom
  const burstTranslateY = `-${100 - burstHeight}vh`;

  useEffect(() => {
    const scheduleLaunch = () => {
      const interval = Math.random() * (maxInterval - minInterval) + minInterval;
      const timeout = setTimeout(() => {
        triggerLaunch();
        scheduleLaunch();
      }, interval * 1000);
      timeoutRefs.current.push(timeout);
      return timeout;
    };

    // Initial delay before first launch
    const initialDelay = setTimeout(() => {
      triggerLaunch();
      scheduleLaunch();
    }, Math.random() * 2000 + 1000);
    timeoutRefs.current.push(initialDelay);

    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current = [];
    };
  }, [minInterval, maxInterval, key, launchDuration]);

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current = [];
    };
  }, []);

  const triggerLaunch = () => {
    setIsLaunching(true);
    setIsBursting(false);
    setParticles([]);
    setKey(prev => prev + 1); // Force animation restart
    particleIdRef.current = 0; // Reset particle ID counter

    // Trigger burst when rocket reaches the top
    const burstTimeout = setTimeout(() => {
      setIsLaunching(false);
      setIsBursting(true);
      triggerBurst();
    }, launchDuration * 1000);
    timeoutRefs.current.push(burstTimeout);
  };

  const triggerBurst = () => {
    // Create beautiful multi-layer pyrotechnics effect with multiple phases
    const newParticles: FireworkParticle[] = [];
    
    // Ensure fireworkColors is accessible (safeguard against scope issues)
    const colors = fireworkColors || [
      '#FFD700', '#FF6B6B', '#4ECDC4', '#FFE66D', 
      '#FF6B9D', '#C7CEEA', '#FFA500', '#FF1493',
      '#00FF00', '#FF00FF', '#00FFFF', '#FFFF00'
    ];
    
    // Select a color theme for this firework
    const primaryColor = colors[Math.floor(Math.random() * colors.length)];
    const secondaryColor = colors[Math.floor(Math.random() * colors.length)];
    const accentColor = colors[Math.floor(Math.random() * colors.length)];
    
    // Phase 1: Outer explosion ring - fast moving bright particles
    for (let i = 0; i < 32; i++) {
      const angle = (Math.PI * 2 * i) / 32;
      const velocity = 4 + Math.random() * 3;
      const color = i % 3 === 0 ? primaryColor : i % 3 === 1 ? secondaryColor : accentColor;
      newParticles.push({
        id: particleIdRef.current++,
        x: Math.cos(angle) * velocity * 100,
        y: Math.sin(angle) * velocity * 100,
        color,
        angle,
        velocity,
        size: 8 + Math.random() * 6,
        delay: 0,
      });
    }
    
    // Phase 2: Middle ring - medium speed, larger particles
    for (let i = 0; i < 24; i++) {
      const angle = (Math.PI * 2 * i) / 24 + Math.random() * 0.3;
      const velocity = 2.5 + Math.random() * 2;
      const color = i % 2 === 0 ? primaryColor : secondaryColor;
      newParticles.push({
        id: particleIdRef.current++,
        x: Math.cos(angle) * velocity * 75,
        y: Math.sin(angle) * velocity * 75,
        color,
        angle,
        velocity,
        size: 12 + Math.random() * 8,
        delay: 0.15,
      });
    }
    
    // Phase 3: Inner core burst - slower, very large particles
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16 + Math.random() * 0.4;
      const velocity = 1.5 + Math.random() * 1.5;
      newParticles.push({
        id: particleIdRef.current++,
        x: Math.cos(angle) * velocity * 50,
        y: Math.sin(angle) * velocity * 50,
        color: primaryColor,
        angle,
        velocity,
        size: 16 + Math.random() * 10,
        delay: 0.3,
      });
    }
    
    // Phase 4: Sparkle trails - small fast particles with trails
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = 2 + Math.random() * 3;
      const color = colors[Math.floor(Math.random() * colors.length)];
      newParticles.push({
        id: particleIdRef.current++,
        x: Math.cos(angle) * velocity * 120,
        y: Math.sin(angle) * velocity * 120,
        color,
        angle,
        velocity,
        size: 4 + Math.random() * 4,
        delay: Math.random() * 0.4,
      });
    }
    
    // Phase 5: Secondary burst - delayed smaller explosion
    const secondaryTimeout = setTimeout(() => {
      const secondaryParticles: FireworkParticle[] = [];
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const velocity = 1.5 + Math.random() * 2;
        const color = colors[Math.floor(Math.random() * colors.length)];
        secondaryParticles.push({
          id: particleIdRef.current++,
          x: Math.cos(angle) * velocity * 60,
          y: Math.sin(angle) * velocity * 60,
          color,
          angle,
          velocity,
          size: 6 + Math.random() * 5,
          delay: 0.5,
        });
      }
      setParticles(prev => [...prev, ...secondaryParticles]);
    }, 300);
    timeoutRefs.current.push(secondaryTimeout);

    setParticles(newParticles);

    // Reset after animation
    const resetTimeout1 = setTimeout(() => {
      setIsBursting(false);
      const resetTimeout2 = setTimeout(() => {
        setParticles([]);
      }, 3000);
      timeoutRefs.current.push(resetTimeout2);
    }, 2000);
    timeoutRefs.current.push(resetTimeout1);
  };

  return (
    <div
      key={key}
      className="rocket-container"
      style={{
        position: 'absolute',
        left: `${left}%`,
        bottom: '0px',
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
        zIndex: 10,
        '--launch-duration': `${launchDuration}s`,
        '--burst-translate-y': burstTranslateY,
      } as React.CSSProperties & { '--launch-duration': string; '--burst-translate-y': string }}
    >
      {/* Rocket body - thinner design */}
      <div
        className={`rocket-body ${isLaunching ? 'rocket-launching' : ''} ${isBursting ? 'rocket-bursting' : ''}`}
        style={{
          width: '12px',
          height: '50px',
          background: `linear-gradient(to top, ${theme.primary}, ${theme.secondary})`,
          borderRadius: '6px 6px 2px 2px',
          position: 'absolute',
          bottom: '0px',
          left: '50%',
          boxShadow: `0 2px 8px rgba(0,0,0,0.3), 0 0 10px ${theme.primary}40`,
          opacity: isLaunching || isBursting ? 1 : 0,
          ...(isLaunching ? {} : { transform: 'translateX(-50%)' }),
        }}
      >
        {/* Rocket nose cone - smaller for thinner rocket */}
        <div
          style={{
            position: 'absolute',
            top: '-6px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderBottom: `8px solid ${theme.primary}`,
          }}
        />
        
        {/* Thin decorative stripe */}
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '8px',
            height: '2px',
            background: theme.secondary,
            borderRadius: '1px',
            opacity: 0.7,
          }}
        />

        {/* Flame trail */}
        {isLaunching && (
          <div
            className="rocket-flame"
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '10px',
              height: '25px',
              background: `radial-gradient(ellipse at center, ${theme.flame} 0%, ${theme.primary} 50%, transparent 80%)`,
              borderRadius: '0 0 50% 50%',
              animation: 'flameFlicker 0.1s ease-in-out infinite alternate',
              boxShadow: `0 0 15px ${theme.flame}`,
            }}
          />
        )}
      </div>

      {/* Fireworks particles - positioned at burst location */}
      {isBursting && particles.length > 0 && (
        <div style={{ position: 'absolute', left: '50%', bottom: `calc(${100 - burstHeight}% + 25px)`, transform: 'translateX(-50%)', pointerEvents: 'none' }}>
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="firework-particle"
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                background: `radial-gradient(circle, ${particle.color} 0%, ${particle.color}ee 40%, ${particle.color}88 70%, transparent 100%)`,
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                animation: `fireworkBurst 2.5s ease-out forwards`,
                animationDelay: `${particle.delay}s`,
                '--end-x': `${particle.x}px`,
                '--end-y': `${particle.y}px`,
                boxShadow: `
                  0 0 ${particle.size * 1.5}px ${particle.color}, 
                  0 0 ${particle.size * 3}px ${particle.color}80,
                  0 0 ${particle.size * 5}px ${particle.color}40
                `,
                filter: `blur(${particle.size > 10 ? 1 : 0.5}px)`,
                zIndex: 15,
              } as React.CSSProperties & { '--end-x': string; '--end-y': string }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CelebrationCracker;

