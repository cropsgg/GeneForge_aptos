'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import DnaHelix from './DnaHelix';
// Import CSS directly in client component
import './dna-animation.css';

// Simplified error boundary
const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="dna-scene-container">
        <div className="dna-overlay"></div>
      </div>
    );
  }

  return <>{children}</>;
};

// Particle component to create floating particles
const Particles = ({ count = 20 }: { count?: number }) => {
  useEffect(() => {
    try {
      const container = document.querySelector('.dna-scene-container');
      if (!container) return;

      // Clear any existing particles
      const existingParticles = container.querySelectorAll('.particle');
      existingParticles.forEach(particle => particle.remove());

      // Create new particles
      for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Random position, size and animation duration
        const size = Math.random() * 3 + 1;
        const posX = Math.random() * 100;
        const delay = Math.random() * 10;
        const duration = Math.random() * 10 + 10;
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${posX}%`;
        particle.style.bottom = '0';
        particle.style.animationDuration = `${duration}s`;
        particle.style.animationDelay = `${delay}s`;
        
        container.appendChild(particle);
      }
    } catch (error) {
      // Silent fail
    }
    
    return () => {
      try {
        const container = document.querySelector('.dna-scene-container');
        const existingParticles = container?.querySelectorAll('.particle');
        existingParticles?.forEach(particle => particle.remove());
      } catch (error) {
        // Silent fail
      }
    };
  }, [count]);
  
  return null;
};

interface DnaHelixContainerProps {
  className?: string;
  color1?: string;
  color2?: string;
  count?: number;
  radius?: number;
  height?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  particles?: number;
}

const DnaHelixContainer: React.FC<DnaHelixContainerProps> = ({ 
  className,
  color1 = "#2563eb",
  color2 = "#7c3aed",
  count = 20,
  radius = 1.2,
  height = 8,
  autoRotate = true,
  autoRotateSpeed = 0.5,
  particles = 30
}) => {
  const [canRender, setCanRender] = useState(false);
  
  useEffect(() => {
    // Only run on client side
    setCanRender(true);
  }, []);

  if (!canRender) {
    return (
      <div className={`dna-scene-container ${className || ''}`}>
        <div className="dna-overlay"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`dna-scene-container ${className || ''}`}>
        <div className="dna-overlay"></div>
        <Particles count={particles} />
        <Canvas
          className="dna-canvas"
          style={{ background: 'transparent' }}
          camera={{ position: [0, 0, 6], fov: 50 }}
          gl={{ alpha: true, antialias: true }}
        >
          <color attach="background" args={['rgba(0,0,0,0)']} />
          
          {/* Simple lighting for better performance */}
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={0.5} />
          
          <Suspense fallback={null}>
            <DnaHelix 
              color1={color1}
              color2={color2}
              count={count}
              radius={radius}
              height={height}
            />
            <OrbitControls 
              enableZoom={false} 
              enablePan={false}
              autoRotate={autoRotate} 
              autoRotateSpeed={autoRotateSpeed}
            />
          </Suspense>
        </Canvas>
      </div>
    </ErrorBoundary>
  );
};

export default DnaHelixContainer; 