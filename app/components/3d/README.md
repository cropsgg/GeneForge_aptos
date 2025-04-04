# 3D Components for GeneForge

This directory contains React components for 3D visualizations used in the GeneForge platform.

## Components

### DnaHelix

A 3D visualization of DNA structure using Three.js.

```jsx
import DnaHelix from '@/components/3d/DnaHelix';

// Basic usage inside a Three.js canvas
<DnaHelix />

// With custom properties
<DnaHelix 
  color1="#2563eb"
  color2="#7c3aed"
  count={20}
  radius={1.2}
  height={8}
/>
```

#### Props

- `color1` (string): Color of the first DNA strand (default: "#2563eb")
- `color2` (string): Color of the second DNA strand (default: "#7c3aed")
- `count` (number): Number of base pairs (default: 20)
- `radius` (number): Radius of the helix (default: 1.2)
- `height` (number): Height of the helix (default: 8)

### DnaHelixContainer

A wrapper component that sets up the Three.js environment for the DnaHelix component.

```jsx
import DnaHelixContainer from '@/components/3d/DnaHelixContainer';

// Basic usage
<DnaHelixContainer />

// With custom properties
<DnaHelixContainer
  color1="#2563eb" 
  color2="#7c3aed"
  count={25}
  radius={1.5}
  height={10}
  autoRotateSpeed={0.3}
  particles={40}
/>
```

#### Props

- `className` (string): Additional CSS classes
- `color1` (string): Color of the first DNA strand (default: "#2563eb")
- `color2` (string): Color of the second DNA strand (default: "#7c3aed")
- `count` (number): Number of base pairs (default: 20)
- `radius` (number): Radius of the helix (default: 1.2)
- `height` (number): Height of the helix (default: 8)
- `autoRotate` (boolean): Whether the camera should auto-rotate (default: true)
- `autoRotateSpeed` (number): Speed of auto-rotation (default: 0.5)
- `particles` (number): Number of floating particles (default: 30)

## CSS Styles

The components use styles defined in `dna-animation.css`, including:

- `.dna-scene-container`: The container for the 3D scene
- `.dna-canvas`: The Three.js canvas
- `.dna-overlay`: Overlay with gradient effect
- `.particle`: Floating particle elements
- `.dna-glow`: Text glow effect for DNA-related content
- `.dna-pulse`: Pulsing animation for elements

## Usage Notes

- These components use Three.js and React Three Fiber, which are client-side only
- Always use the dynamic import with `{ ssr: false }` when importing in Next.js
- The components are optimized for performance with appropriate settings
- Add `position: relative` to parent containers for proper positioning 