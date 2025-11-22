# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Whistle is a 2D space simulation game built with Three.js (3D rendering), Matter.js (2D physics), and TypeScript. The game features a controllable rocket navigating through space with asteroids, rendered with an optional ASCII post-processing effect.

## Build and Development Commands

- `npm run dev` - Start webpack dev server with hot reload (default: http://localhost:8080)
- `npm run build` - Build production bundle to `dist/`

## Core Architecture

### Dual Rendering System

The application uses a unique dual-camera setup:
1. **Main Camera**: Orthographic camera following the rocket, renders to main canvas with optional ASCII filter
2. **Relief Camera**: Perspective camera for radar/minimap view, renders to side canvas

Both cameras render the same scene but from different perspectives.

### Physics-Rendering Bridge

The project maintains tight synchronization between Matter.js (physics) and Three.js (rendering):
- Each entity has both a `mesh` (THREE.Mesh) and `body` (MATTER.Body)
- Physics bodies drive the position/rotation, meshes are updated each frame via `updatePositionFromBody()`
- SVG paths define both the visual shape (THREE.ShapeGeometry) and physics collider (MATTER.Bodies.fromVertices)

### Entity System

Entities follow a consistent pattern (see [src/entities/rocket.ts](src/entities/rocket.ts), [src/entities/asteroid.ts](src/entities/asteroid.ts)):
- Implement `Destroyable` and/or `Updatable` interfaces from [src/types.ts](src/types.ts)
- Created via factory functions (`createRocket`, `createAsteroid`, etc.)
- Return objects with `mesh`, `body`, `update()`, `destroy()`, and `setPosition()` methods
- Use `completeAssign()` from [src/utils/functionalUtils.ts](src/utils/functionalUtils.ts) to compose functionality

### SVG-to-Physics Pipeline

The `getVerticesFromSVG()` function in [src/utils/imageUtils.ts](src/utils/imageUtils.ts):
1. Loads SVG files as paths
2. Samples points along the path at specified precision
3. Returns THREE.Vector2 array used for both rendering and physics

**Important**: When creating physics bodies from SVG vertices, you must handle the bounds offset:
- Matter.js centers bodies at their center of mass, offsetting the bounds
- Three.js uses the original vertex positions
- Calculate the offset between original bounds and Matter bounds, then adjust mesh vertices accordingly
- See asteroid.ts:31-41 and rocket.ts:52-62 for the offset calculation pattern

### Dependency Injection

Uses `tsyringe` for DI (configured in [src/utils/autoinject.ts](src/utils/autoinject.ts)):
- Global singletons: `TextureLoader`, `GUI` (lil-gui)
- Import container from `autoinject.ts`, not directly from tsyringe
- Use `container.resolve<Type>("Name")` with default parameters in factory functions

### Post-Processing

ASCII filter implementation ([src/effects/asciiFilter.ts](src/effects/asciiFilter.ts)):
- Uses Three.js EffectComposer with ShaderPass
- Shaders in [src/shaders/](src/shaders/) - loaded by `ts-shader-loader`
- The filter implements `Updatable` interface via `addFunction()` helper

### Configuration

All game constants centralized in [src/conf.ts](src/conf.ts):
- `GENERAL` - rendering settings
- `MAP` - world dimensions
- `UI` - camera and viewport settings
- `ROCKET` - movement and fuel parameters
- `ASCII` - shader settings

Modify these instead of hardcoding values.

## File Structure

```
src/
├── index.ts           - Main entry point, game loop, event handlers
├── conf.ts            - Global configuration constants
├── types.ts           - TypeScript interfaces
├── entities/          - Game objects (rocket, asteroid, floor, etc.)
├── effects/           - Post-processing effects
├── shaders/           - GLSL shaders (.vs, .fs)
├── utils/             - Helper functions
│   ├── autoinject.ts  - Dependency injection setup
│   ├── 2dUtils.ts     - 2D math utilities
│   ├── 3dUtils.ts     - 3D/position conversion utilities
│   ├── imageUtils.ts  - SVG parsing, texture processing
│   └── functionalUtils.ts - Object composition utilities
└── assets/            - SVG shapes, images
```

## Key Dependencies

- **Three.js**: 3D rendering engine (used for 2D orthographic view)
- **Matter.js**: 2D physics engine with poly-decomp for complex shapes
- **TypeScript**: Configured with decorators for tsyringe
- **Webpack**: Bundles TS, CSS, images, and GLSL shaders
- **lil-gui**: Runtime configuration UI
- **Stats.js**: FPS monitor

## Development Notes

### Adding New Entities

1. Create factory function in `src/entities/` following the pattern in rocket.ts
2. Define interface extending `Destroyable` and/or `Updatable`
3. Create both Three.js mesh and Matter.js body
4. Handle bounds offset between physics and rendering
5. Implement `update()` to sync mesh with body position/rotation
6. Add to scene and physics world in index.ts
7. Call `update()` in animation loop

### Working with Shaders

- Vertex shaders: `.vs` extension
- Fragment shaders: `.fs` extension
- Import as strings: `import vertexShader from './shader.vs'`
- Webpack handles loading via `ts-shader-loader`

### Physics Considerations

- World has zero gravity (space simulation)
- Friction set to 0 on most bodies
- Use `MATTER.Body.setVelocity()` for direct control (rocket)
- Use `MATTER.Body.setAngularVelocity()` for rotation
- Debug physics rendering available on separate canvas (id="physics")

### Object Pooling

Smoke particles use a simple pooling system (index.ts:150-162):
- Reuse inactive particles via `getFreeSmokeParticle()`
- Check `isAlive` flag before creating new instances
- Add to scene once, toggle visibility via `spawn()`
