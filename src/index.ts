"use strict";
import "reflect-metadata";
import * as THREE from 'three';
import Stats from "stats.js";
import * as MATTER from 'matter-js';
import GUI from 'lil-gui';
import { container } from "./utils/autoinject";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { createRocket } from "./entities/rocket";
import { createAsciiFilter } from "./effects/asciiFilter";
import { getNormalizedDistance, getNormalizedPosition, to2D } from "./utils/3dUtils";
import { ASCII, COLLISION, GENERAL, MAP, ROCKET, UI } from "./conf";
const asciiTexture = require('../ascii.png');

import './style.css';
import { Asteroid, createAsteroid } from "./entities/asteroid";
import { getVerticesFromSVG } from "./utils/imageUtils";
import { setupInputHandlers } from "./utils/inputManager";
import { distance } from "./utils/2dUtils";

function createRenderer(
  canvas: HTMLCanvasElement,
  clearColor: number,
  renderSize = { width: window.innerWidth, height: window.innerHeight },
  renderRatio = window.devicePixelRatio
) {

  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setClearColor(clearColor);
  renderer.setPixelRatio(renderRatio);
  renderer.setSize(renderSize.width, renderSize.height);

  const effectComposer = new EffectComposer(renderer);

  return effectComposer;
}



async function init(
  textureLoader = container.resolve<THREE.TextureLoader>("TextureLoader"),
  gui = container.resolve<GUI>("GUI")
): Promise<() => void> {

  MATTER.Common.setDecomp(require('poly-decomp'));

  // Preload every SVG
  const asteroidVertices = [
    await getVerticesFromSVG(require('./assets/ast1.svg')),
    await getVerticesFromSVG(require('./assets/ast2.svg')),
    await getVerticesFromSVG(require('./assets/ast3.svg')),
    await getVerticesFromSVG(require('./assets/ast4.svg')),
    await getVerticesFromSVG(require('./assets/ast5.svg')),
    await getVerticesFromSVG(require('./assets/ast6.svg')),
    await getVerticesFromSVG(require('./assets/ast8.svg')),
    await getVerticesFromSVG(require('./assets/ast9.svg')),
    await getVerticesFromSVG(require('./assets/ast10.svg')),
    await getVerticesFromSVG(require('./assets/ast11.svg')),
    await getVerticesFromSVG(require('./assets/ast12.svg')),
    // await getVerticesFromSVG(require('./assets/ast13.svg')),
    await getVerticesFromSVG(require('./assets/ast14.svg')),
    await getVerticesFromSVG(require('./assets/ast15.svg')),
    await getVerticesFromSVG(require('./assets/ast16.svg')),
    await getVerticesFromSVG(require('./assets/ast17.svg')),
    await getVerticesFromSVG(require('./assets/ast18.svg')),
    await getVerticesFromSVG(require('./assets/ast19.svg')),
    await getVerticesFromSVG(require('./assets/ast20.svg')),
    await getVerticesFromSVG(require('./assets/ast21.svg')),
    await getVerticesFromSVG(require('./assets/ast22.svg')),
    await getVerticesFromSVG(require('./assets/ast23.svg')),
  ];

  // Init some stuff
  const startTime = new Date().getTime();

  // Get canvases from DOM
  const mainCanvas = document.getElementById("main") as HTMLCanvasElement;
  const reliefCanvas = document.getElementById("relief") as HTMLCanvasElement;

  const composer = createRenderer(mainCanvas, UI.main.cameraClear);
  const reliefComposer = createRenderer(reliefCanvas, 0x000000, {
    width: UI.side.size,
    height: UI.side.size,
  });

  // Init physics
  const physicsEngine = MATTER.Engine.create({
    gravity: {
      x: 0,
      y: 0,
      scale: 0
    }
  });

  // create renderer
  const physicRenderer = MATTER.Render.create({
    canvas: document.getElementById('physics') as HTMLCanvasElement,
    engine: physicsEngine,
    options: {
      width: 200,
      height: 200,
      // height: window.innerHeight,
      // width: window.innerWidth,
      showVelocity: true,
      showAngleIndicator: true,
    }
  });

  MATTER.Render.run(physicRenderer);

  const scene = new THREE.Scene();

  // Create the cameras
  const mainCamera = new THREE.OrthographicCamera(window.innerWidth / - 1, window.innerWidth / 1, window.innerHeight / 1, window.innerHeight / - 1, UI.main.cameraNear, UI.main.cameraFar);

  const sideCamera = new THREE.PerspectiveCamera();
  sideCamera.position.set(UI.side.distance, UI.side.distance, UI.side.cameraDistance);



  const renderPass = new RenderPass(scene, mainCamera);
  const sideRenderPass = new RenderPass(scene, sideCamera);

  const asciiFilter = await createAsciiFilter(asciiTexture, { ratio: mainCanvas.width / mainCanvas.height, enabled: ASCII.enabled });
  composer.addPass(renderPass);
  composer.addPass(asciiFilter);

  reliefComposer.addPass(sideRenderPass);

  const rocket = await createRocket(scene);
  rocket.setPosition(MAP.size / 2, MAP.size / 2);

  scene.add(rocket.mesh);
  MATTER.Composite.add(physicsEngine.world, [rocket.body]);
  mainCamera.position.set(rocket.mesh.position.x, rocket.mesh.position.y, UI.main.cameraDistance);

  // Setup GUI controls for rocket movement
  const rocketFolder = gui.addFolder('Rocket');
  rocketFolder.add(ROCKET, 'speed', 0, 10000).name('Speed');
  rocketFolder.add(ROCKET, 'angularSpeed', 0, 50).name('Angular Speed');
  rocketFolder.add(ROCKET, 'breakForce', 0, 200).name('Break Force');
  rocketFolder.add(ROCKET, 'angularBreakForce', 0, 2).name('Angular Break Force');
  rocketFolder.close();

  // Setup GUI controls for collision damage
  const collisionFolder = gui.addFolder('Collision Damage');
  collisionFolder.add(COLLISION, 'minDamageMass', 0, 200).name('Min Damage Mass');
  collisionFolder.add(COLLISION, 'maxDamageMass', 100, 2000).name('Max Damage Mass');
  collisionFolder.add(COLLISION, 'minDamageSpeed', 0, 20).name('Min Damage Speed');
  collisionFolder.add(COLLISION, 'maxDamageSpeed', 5, 50).name('Max Damage Speed');
  collisionFolder.add(COLLISION, 'maxDamage', 1, 100).name('Max Damage');
  collisionFolder.close();

  // Setup collision detection for rocket damage
  MATTER.Events.on(physicsEngine, 'collisionStart', (event) => {


    event.pairs.forEach((pair) => {

      // Check if rocket is involved in collision
      const isRocketInvolved = pair.bodyA.label === rocket.body.label || pair.bodyB.label === rocket.body.label;


      if (isRocketInvolved) {

        
        // Get the other body (the one that hit the rocket)
        const rocketBody = pair.bodyA.label === rocket.body.label ? pair.bodyA : pair.bodyB;
        const otherBody = pair.bodyA.label === rocket.body.label ? pair.bodyB : pair.bodyA;
        // @ts-ignore
        const otherBodyVelocity = bodiesVelocities[otherBody.label];
        // @ts-ignore
        const rocketVelocity = bodiesVelocities[rocketBody.label];

        // Calculate relative velocity (impact speed)
        const relativeVelocity = MATTER.Vector.sub(otherBodyVelocity, rocketVelocity);
        const impactSpeed = MATTER.Vector.magnitude(relativeVelocity);

        console.log('Mass:', otherBody.mass, 'Speed:', impactSpeed);

        if (otherBody.mass >= COLLISION.minDamageMass && impactSpeed >= COLLISION.minDamageSpeed) {
          // Mass damage component (0 to 1 scale)
          const massRatio = Math.min(1, (otherBody.mass - COLLISION.minDamageMass) / (COLLISION.maxDamageMass - COLLISION.minDamageMass));

          // Speed damage multiplier (0.2 to 1 scale)
          const speedMultiplier = Math.min(1, Math.max(0.2, (impactSpeed - COLLISION.minDamageSpeed) / (COLLISION.maxDamageSpeed - COLLISION.minDamageSpeed)));

          // Combined damage: base damage (1-maxDamage) * speed multiplier
          const baseDamage = Math.floor(massRatio * COLLISION.maxDamage) + 1;
          const damage = Math.min(COLLISION.maxDamage, Math.max(1, Math.floor(baseDamage * speedMultiplier)));

          rocket.damage(damage);
        }
      }
    });
  });



  const asteroids: Asteroid[] = [];
  const asteroidScales = [0.5, 0.5, 0.5, 0.5, 0.5, 3, 4, 3, 1, 1, 2, 3, 3, 4, 5, 15];

  const safeZoneRadius = 300; // Radius around spawn point (MAP.startingPosX, MAP.startingPosY)
  const safeZoneSpawnChance = 0.3; // Only 30% of asteroids spawn in safe zone
  const baseScale = 0.1;
  const startPos = { x: MAP.startingPosX, y: MAP.startingPosY };


  for (let i = 0; i < 1000; i++) {
    const randomScale = asteroidScales[Math.floor(Math.random() * asteroidScales.length)];
    const baseScale = 0.1;
    const scale = baseScale * randomScale;
    const asteroid = await createAsteroid(
      asteroidVertices[Math.floor(Math.random() * asteroidVertices.length)],
      scale
    );

    const asteroidPos = { x: Math.random() * MAP.size, y: Math.random() * MAP.size }


    const distanceFromStart = distance(startPos, asteroidPos) - asteroid.radius * scale;

    const spawnAsteroid = () => {
      scene.add(asteroid.mesh);
      asteroid.setPosition(asteroidPos.x, asteroidPos.y);

      asteroids.push(asteroid);
      MATTER.Composite.add(physicsEngine.world, [asteroid.body]);
    }

    if (distanceFromStart > safeZoneRadius) {
      spawnAsteroid();
    }

  }

  const bodiesVelocities = {};

  MATTER.Events.on(physicsEngine, 'beforeUpdate', () => {

    physicsEngine.world.bodies.forEach(body => {
      //@ts-ignore
      bodiesVelocities[body.label] = body.velocity;
    });

  });

  let requestId = 0;

  let lastTimestamp = 0;

  const clock = new THREE.Clock();
  function animate() {

    const now = new Date().getTime();

    const time = now - startTime;

    MATTER.Engine.update(physicsEngine, clock.getDelta());
    MATTER.Render.lookAt(physicRenderer, rocket.body, MATTER.Vector.create(200, 200));

    const rocketPos = getNormalizedPosition(rocket.mesh.position);
    const radarRadius = getNormalizedDistance(UI.radius);

    rocket.update(time);
    asteroids.forEach(asteroid => asteroid.update(time));
    if (GENERAL.realTimeRender) {
      composer.render();
    }
    asciiFilter.update(time, UI.radius / Math.min(window.innerHeight, window.innerWidth), rocket.viewRes);
    stats.update();
    reliefComposer.render();

    mainCamera.position.lerp(new THREE.Vector3(rocket.mesh.position.x, rocket.mesh.position.y, mainCamera.position.z), 0.1);

    requestId = requestAnimationFrame(animate);

    if (time - lastTimestamp < 100) {
      lastTimestamp = time;
    }

  }
  requestId = requestAnimationFrame(animate);

  // Setup input handlers
  const cleanupInputHandlers = setupInputHandlers({ rocket });

  return () => {
    //TODO: destroy
    window.cancelAnimationFrame(requestId);
    composer.dispose();
    cleanupInputHandlers();
  }
}

// Create the stat element
var stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);


init();
