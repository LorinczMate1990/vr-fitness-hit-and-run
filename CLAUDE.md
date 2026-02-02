# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WebXR VR training application built with React 19, TypeScript, Three.js, and React Three Fiber. Designed to run in WebXR-capable browsers/headsets (e.g., Meta Quest). Features controller interactions, hand tracking, collision detection, and haptic feedback.

## Commands

- `npm run dev` — Start Vite dev server (HTTPS enabled, required for WebXR; accessible on LAN via 0.0.0.0)
- `npm run build` — TypeScript check + Vite production build
- `npm run lint` — ESLint
- `npm run preview` — Preview production build

## Architecture

**Routing:** React Router with two routes:
- `/` → `Menu.tsx` — Landing page with navigation to VR scene
- `/vr` → `VRScene.tsx` — Main 3D/VR experience

**VR Scene structure** (`VRScene.tsx`):
- Three.js `Canvas` wraps an `XR` context (from @react-three/xr)
- `XROrigin` positions the user; left/right controllers rendered as interactive meshes
- `useControllerCollision` custom hook handles box-box collision detection with haptic feedback (debounced 200ms)
- `MovingBox` component animates via `useFrame` for testing controller collisions
- WebGL support is checked before rendering; falls back to error message
- `OrbitControls` from drei enables mouse navigation for non-VR testing

**Key libraries:**
- `@react-three/fiber` — React renderer for Three.js
- `@react-three/xr` — WebXR session management, controllers, hand tracking
- `@react-three/drei` — Utility 3D components (OrbitControls, etc.)

## Build & Config Notes

- Vite config enables `basicSsl` plugin — HTTPS is mandatory for WebXR APIs in browsers
- TypeScript strict mode is on; unused variables/parameters are compile errors
- Target: ES2022 (tsconfig.app.json)
