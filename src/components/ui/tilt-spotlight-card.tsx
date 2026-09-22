import React, { useRef, useState, ReactNode } from 'react';

interface TiltSpotlightCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number; // max tilt angle in degrees (default 8)
  spotlightColor?: string; // default subtle white/warm glow
}

export const TiltSpotlightCard: React.FC<TiltSpotlightCardProps> = ({
  children,
  className = '',
  maxTilt = 7,
  spotlightColor = 'rgba(255, 255, 255, 0.45)',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ x: number; y: number; opacity: number }>({ x: 0, y: 0, opacity: 0 });
  const [tilt, setTilt] = useState<{ rx: number; ry: number }>({ rx: 0, ry: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Normalised coordinates (-1 to 1)
    const normX = (x / rect.width) * 2 - 1;
    const normY = (y / rect.height) * 2 - 1;

    // Calculate perspective 3D tilt
    const rx = -normY * maxTilt;
    const ry = normX * maxTilt;

    setCoords({ x, y, opacity: 1 });
    setTilt({ rx, ry });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setCoords((prev) => ({ ...prev, opacity: 0 }));
    setTilt({ rx: 0, ry: 0 });
  };

  return (
    <div
      style={{ perspective: 1000 }}
      className="relative w-full transition-transform duration-200 ease-out"
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: isHovered
            ? `rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg) translateY(-4px)`
            : 'rotateX(0deg) rotateY(0deg) translateY(0px)',
          transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
          transformStyle: 'preserve-3d',
        }}
        className={`relative overflow-hidden rounded-2xl transition-shadow ${className}`}
      >
        {/* Subtle Radial Spotlight Glare */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-px transition-opacity duration-300 z-10"
          style={{
            opacity: coords.opacity,
            background: `radial-gradient(400px circle at ${coords.x}px ${coords.y}px, ${spotlightColor}, transparent 70%)`,
          }}
        />

        {/* Content with 3D depth */}
        <div style={{ transform: 'translateZ(10px)' }} className="relative z-20 h-full">
          {children}
        </div>
      </div>
    </div>
  );
};

export default TiltSpotlightCard;
