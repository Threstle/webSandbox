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
import { createFloor } from "./entities/floor";
import { createAsciiFilter } from "./effects/asciiFilter";
import { createReliefMap } from "./entities/reliefMap";
import { getNormalizedDistance, getNormalizedPosition, to2D } from "./utils/3dUtils";
import { ASCII, GENERAL, MAP, UI } from "./conf";
const asciiTexture = require('../ascii.png');
const oceanFloorTexture = require('../src/assets/space2.png');

import './style.css';
import { Asteroid, createAsteroid } from "./entities/asteroid";
import { getVerticesFromSVG } from "./utils/imageUtils";
import { SmokeParticlePool } from "./utils/smokeParticlePool";
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

  const rocket = await createRocket();
  rocket.setPosition(MAP.size / 2, MAP.size / 2);

  scene.add(rocket.mesh);
  MATTER.Composite.add(physicsEngine.world, [rocket.body]);
  mainCamera.position.set(rocket.mesh.position.x, rocket.mesh.position.y, UI.main.cameraDistance);



  const asteroids: Asteroid[] = [];
  const asteroidScales = [0.5, 0.5, 0.5, 0.5, 0.5, 3, 4, 3, 1, 1, 2, 3, 3, 4, 5, 15];

  const safeZoneRadius = 300; // Radius around spawn point (MAP.startingPosX, MAP.startingPosY)
  const safeZoneSpawnChance = 0.3; // Only 30% of asteroids spawn in safe zone
  const baseScale = 0.1;
  const startPos = { x: MAP.startingPosX, y: MAP.startingPosY };


  // for (let i = 0; i < 100; i++) {
  //   let posX, posY;
  //   let randomScale = asteroidScales[Math.floor(Math.random() * asteroidScales.length)];
  //   let scale = baseScale * randomScale;

  //   // Generate random position
  //   const asteroidPos = {x:Math.random() * MAP.size,y:Math.random() * MAP.size}
  //   const distanceFromStart = distance(startPos,asteroidPos)

  //   const asteroid = await createAsteroid(
  //     asteroidVertices[Math.floor(Math.random() * asteroidVertices.length)],
  //     scale
  //   );
  //   // asteroid.mesh.geometry.computeBoundingSphere()
  //   // const asteroidRadius = asteroid.mesh.geometry.boundingSphere.radius;
  //   // console.log(asteroidRadius)


  //   // console.log(asteroid.mesh.geometry.boundingSphere)

  //   // // Calculate asteroid radius based on its scale
  //   // const asteroidRadius = averageAsteroidSize * scale;

  //   // // Check if asteroid overlaps with safe zone (distance to center minus asteroid size)
  //   // const effectiveDistance = distanceFromStart - asteroidRadius;
  //   const effectiveDistance = distanceFromStart;

  //   let canBeAdded = true;
  //   // If asteroid overlaps with safe zone
  //   // if (effectiveDistance < safeZoneRadius) {
  //   //   // // Skip this asteroid if random chance fails (reduces density)
  //   //   if (Math.random() < safeZoneSpawnChance) {
  //   //     canBeAdded = false;
  //   //   }


  //   //   // // Only allow small asteroids in safe zone (max scale 1)
  //   //   // const smallScales = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 1];
  //   //   // randomScale = smallScales[Math.floor(Math.random() * smallScales.length)];
  //   //   // scale = baseScale * randomScale;


  //   // }


  //   // if(canBeAdded){
  //     scene.add(asteroid.mesh);
  //     asteroids.push(asteroid);
  //     asteroid.setPosition(posX, posY);
  //     MATTER.Composite.add(physicsEngine.world, [asteroid.body]);
  //   // }
  // }


  for (let i = 0; i < 1000; i++) {
    const randomScale = asteroidScales[Math.floor(Math.random() * asteroidScales.length)];
    const baseScale = 0.1;
    const scale = baseScale * randomScale;
    const asteroid = await createAsteroid(
      asteroidVertices[Math.floor(Math.random() * asteroidVertices.length)],
      scale
    );

    const asteroidPos = { x: Math.random() * MAP.size, y: Math.random() * MAP.size }


    const distanceFromStart = distance(startPos, asteroidPos) - asteroid.radius *scale;

    const spawnAsteroid = () => {
      scene.add(asteroid.mesh);
      asteroid.setPosition(asteroidPos.x, asteroidPos.y);

      asteroids.push(asteroid);
      MATTER.Composite.add(physicsEngine.world, [asteroid.body]);
    }

    if (distanceFromStart > safeZoneRadius) {
      spawnAsteroid();
    }
    else{
      console.log('discarded')
    }


  }

  const smokePool = new SmokeParticlePool(scene);


  let requestId = 0;

  let lastTimestamp = 0;

  // Individual cooldown timers for each thruster
  const thrusterCooldowns = {
    mainThruster: 0,
    rightThrusterTop: 0,
    leftThrusterBottom: 0,
    leftThrusterTop: 0,
    rightThrusterBottom: 0,
    breakThruster: 0
  };
  const smokeCooldown = 50; // milliseconds between smoke spawns per thruster

  const clock = new THREE.Clock();
  function animate() {

    const time = new Date().getTime() - startTime;

    MATTER.Engine.update(physicsEngine, clock.getDelta());
    MATTER.Render.lookAt(physicRenderer, rocket.body, MATTER.Vector.create(200, 200));

    const rocketPos = getNormalizedPosition(rocket.mesh.position);
    const radarRadius = getNormalizedDistance(UI.radius);

    rocket.update(time);
    smokePool.update(time);
    asteroids.forEach(asteroid => asteroid.update(time));
    if (GENERAL.realTimeRender) {
      composer.render();
    }
    asciiFilter.update(time, UI.radius / Math.min(window.innerHeight, window.innerWidth), rocket.viewRes);
    stats.update();
    reliefComposer.render();

    mainCamera.position.lerp(new THREE.Vector3(rocket.mesh.position.x, rocket.mesh.position.y, mainCamera.position.z), 0.1);

    requestId = requestAnimationFrame(animate);

    // Main thruster smoke
    if (rocket.isAccelerating && time - thrusterCooldowns.mainThruster >= smokeCooldown) {
      const spawnPos = rocket.getPartPositions().mainThruster;
      smokePool.spawn(spawnPos, { x: 0, y: 0 }, time, 20, 400);
      thrusterCooldowns.mainThruster = time;
    }

    // Rotation left thrusters
    if (rocket.isRotatingLeft) {
      const positions = rocket.getPartPositions();

      if (time - thrusterCooldowns.rightThrusterTop >= smokeCooldown) {
        smokePool.spawn(positions.rightThrusterTop, { x: 0, y: 0 }, time);
        thrusterCooldowns.rightThrusterTop = time;
      }

      if (time - thrusterCooldowns.leftThrusterBottom >= smokeCooldown) {
        smokePool.spawn(positions.leftThrusterBottom, { x: 0, y: 0 }, time);
        thrusterCooldowns.leftThrusterBottom = time;
      }
    }

    // Rotation right thrusters
    if (rocket.isRotatingRight) {
      const positions = rocket.getPartPositions();

      if (time - thrusterCooldowns.leftThrusterTop >= smokeCooldown) {
        smokePool.spawn(positions.leftThrusterTop, { x: 0, y: 0 }, time);
        thrusterCooldowns.leftThrusterTop = time;
      }

      if (time - thrusterCooldowns.rightThrusterBottom >= smokeCooldown) {
        smokePool.spawn(positions.rightThrusterBottom, { x: 0, y: 0 }, time);
        thrusterCooldowns.rightThrusterBottom = time;
      }
    }

    // Break thruster smoke
    if (rocket.isBreaking && time - thrusterCooldowns.breakThruster >= smokeCooldown) {

      const parts = rocket.getPartPositions();
      Object.values(parts).forEach((thrusterPos)=>{
        smokePool.spawn(thrusterPos, { x: 0, y: 0 }, time, rocket.body.speed / 100, 400);
        
      })

      thrusterCooldowns.breakThruster = time;
    }

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
