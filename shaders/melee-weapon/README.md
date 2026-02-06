# Melee Weapon Shader

Electric blade shader for the melee weapon. The blade changes color based on swing speed - cold blue when stationary, hot red when swinging fast.

## Uniforms

| Uniform | Type | Description |
|---------|------|-------------|
| `uTime` | float | Elapsed time in seconds, drives electric animations |
| `uSpeed` | float | Normalized swing speed from 0.0 (stationary) to 1.0 (max speed ~10 m/s) |

## Varyings

| Varying | Type | Description |
|---------|------|-------------|
| `vUv` | vec2 | UV coordinates - X maps around blade cross-section, Y maps along blade length |
| `vPosition` | vec3 | Vertex position in local space |

## Visual Effects

### Speed-Based Coloring
- **Cold state** (uSpeed = 0.0): Blue metallic tones
  - Core: `rgb(0.6, 0.8, 1.0)` - light blue metallic
  - Edge: `rgb(0.2, 0.5, 1.0)` - blue electric
- **Hot state** (uSpeed = 1.0): Red/orange tones
  - Core: `rgb(1.0, 0.7, 0.6)` - light red metallic
  - Edge: `rgb(1.0, 0.2, 0.1)` - red electric
- Colors interpolate smoothly based on swing speed

### Blade Zones
The shader divides the blade into zones based on UV.x (distance from center):
- **Core** (center): Solid metallic appearance, stable
- **Edge zone**: Electric flickering effects

### Electric Noise
Same `hash` and `electricNoise` functions as fractal-tree shader:
- Three noise layers combined for varied electric effects
- Faster animation (15x time multiplier) for sharp, energetic look
- Binary step function on third layer creates sharp spark effects

### Tip Fade
The blade fades to transparent at the tip (vUv.y = 1.0) using smoothstep from 0.85 to 1.0.

### Arc Flashes
Random bright flashes at 20 Hz, distributed along blade length, confined to edge zone.

## Blending

Outputs RGBA with calculated alpha:
- Core: solid opacity
- Electric effects: 70% opacity contribution
- Arc flashes: additive

Designed for `AdditiveBlending` and `depthWrite: false` for glowing energy blade effect.
