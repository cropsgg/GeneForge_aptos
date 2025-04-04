'use client';

import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';

interface DnaStrandProps {
  color1: string;
  color2: string;
  count: number;
  radius: number;
  height: number;
  rotationSpeed?: number;
}

const DnaStrand: React.FC<DnaStrandProps> = ({ 
  color1, 
  color2, 
  count, 
  radius, 
  height,
  rotationSpeed = 0.2
}) => {
  const groupRef = useRef<Group>(null);
  
  useEffect(() => {
    console.log('DnaStrand mounted with props:', {
      color1, color2, count, radius, height, rotationSpeed
    });
    
    return () => {
      console.log('DnaStrand unmounting');
    };
  }, [color1, color2, count, radius, height, rotationSpeed]);
  
  useFrame(({ clock }) => {
    try {
      if (groupRef.current) {
        groupRef.current.rotation.y = clock.getElapsedTime() * rotationSpeed;
      }
    } catch (error) {
      console.error('Error in animation frame:', error);
    }
  });
  
  // Generate the helix points
  const basePairs = [];
  const spacing = height / count;
  
  try {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 4;
      const y = (i - count / 2) * spacing;
      basePairs.push({ index: i, angle, y });
    }
    console.log(`Generated ${basePairs.length} DNA base pairs`);
  } catch (error) {
    console.error('Error generating DNA base pairs:', error);
  }
  
  return (
    <group ref={groupRef}>
      {basePairs.map((pair) => (
        <group key={pair.index} position={[0, pair.y, 0]}>
          {/* First DNA backbone node */}
          <mesh position={[Math.sin(pair.angle) * radius, 0, Math.cos(pair.angle) * radius]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial color={color1} />
          </mesh>
          
          {/* Second DNA backbone node */}
          <mesh position={[-Math.sin(pair.angle) * radius, 0, -Math.cos(pair.angle) * radius]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial color={color2} />
          </mesh>
          
          {/* The connecting line */}
          <mesh position={[0, 0, 0]} rotation={[0, pair.angle, 0]}>
            <cylinderGeometry args={[0.02, 0.02, radius * 2, 8]} />
            <meshStandardMaterial color="#ffffff" opacity={0.7} transparent />
          </mesh>
        </group>
      ))}
    </group>
  );
};

interface DnaHelixProps {
  color1?: string;
  color2?: string;
  count?: number;
  radius?: number;
  height?: number;
}

export const DnaHelix: React.FC<DnaHelixProps> = ({ 
  color1 = "#2563eb", // Primary blue
  color2 = "#7c3aed", // Primary purple
  count = 20,
  radius = 1.2,
  height = 8 
}) => {
  useEffect(() => {
    console.log('DnaHelix component mounted with props:', {
      color1, color2, count, radius, height
    });
    
    return () => {
      console.log('DnaHelix component unmounting');
    };
  }, [color1, color2, count, radius, height]);

  return (
    <group>
      <DnaStrand 
        color1={color1} 
        color2={color2} 
        count={count} 
        radius={radius} 
        height={height} 
        rotationSpeed={0.1} 
      />
    </group>
  );
};

export default DnaHelix;
