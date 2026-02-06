# Fractal Tree Shader

Electric/plasma effect shader for the fractal tree mesh. The tree represents the base that the player must defend.

## Uniforms

| Uniform | Type | Description |
|---------|------|-------------|
| `uTime` | float | Elapsed time in seconds, drives all animations |
| `uHealth` | float | Tree health from 0.0 (damaged) to 1.0 (healthy) |

## Varyings

| Varying | Type | Description |
|---------|------|-------------|
| `vUv` | vec2 | UV coordinates for texture sampling |
| `vPosition` | vec3 | Vertex position in local space |
| `vNormal` | vec3 | Transformed normal vector |

## Visual Effects

### Health-Based Coloring
- **Healthy state** (uHealth = 1.0): Blue/cyan tones
  - Core: `rgb(0.4, 0.7, 1.0)`
  - Edge: `rgb(0.1, 0.4, 1.0)`
- **Damaged state** (uHealth = 0.0): Red/orange tones
  - Core: `rgb(1.0, 0.5, 0.3)`
  - Edge: `rgb(1.0, 0.2, 0.1)`
- Colors interpolate smoothly between states

### Electric Noise
Uses a pseudo-random hash function to generate electric/plasma effects:
1. `hash(vec2)` - Deterministic noise based on 2D coordinates
2. `electricNoise(vec2, float)` - Animated noise with bilinear interpolation

Three noise layers are combined:
- Layer 1: Scale (5, 15), weight 0.4
- Layer 2: Scale (8, 25), weight 0.3, faster animation
- Layer 3: Scale (3, 30), weight 0.3, binary (step function) for sharp sparks

### Core vs Edge
The `coreMask` uses the dot product between the surface normal and view direction:
- Surfaces facing the camera appear as solid "core"
- Glancing angles show the electric edge effects

### Animation
- **Pulse**: Slow sinusoidal glow (3 Hz base + UV-based offset)
- **Arc flashes**: Random bright flashes at 15 Hz, distributed along the Y axis

## Blending

The shader outputs RGBA with calculated alpha:
- Core areas: 90% opacity
- Electric effects: 60% opacity contribution
- Arc flashes: additive contribution

Designed to be used with `AdditiveBlending` and `depthWrite: false` for a glowing effect.
