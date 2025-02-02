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

  // Init some stuff
  const startTime = new Date().getTime();
  const testMap = await textureLoader.loadAsync(oceanFloorTexture);

  // Get canvases from DOM
  const mainCanvas = document.getElementById("main") as HTMLCanvasElement;
  const reliefCanvas = document.getElementById("relief") as HTMLCanvasElement;

  const composer = createRenderer(mainCanvas, UI.main.cameraClear);
  const reliefComposer = createRenderer(reliefCanvas, 0xFFFFFF, {
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
  const mainCamera = new THREE.OrthographicCamera(window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, UI.main.cameraNear, UI.main.cameraFar);

  const sideCamera = new THREE.PerspectiveCamera();
  sideCamera.position.set(UI.side.distance, UI.side.distance, UI.side.cameraDistance);



  const renderPass = new RenderPass(scene, mainCamera);
  const sideRenderPass = new RenderPass(scene, sideCamera);

  const asciiFilter = await createAsciiFilter(asciiTexture, { ratio: mainCanvas.width / mainCanvas.height, enabled: ASCII.enabled });
  composer.addPass(renderPass);
  composer.addPass(asciiFilter);

  reliefComposer.addPass(sideRenderPass);

  const rocket = createRocket();
  rocket.setPosition(MAP.size / 2, MAP.size / 2);

  scene.add(rocket.mesh);
  MATTER.Composite.add(physicsEngine.world, [rocket.body]);
  mainCamera.position.set(rocket.mesh.position.x, rocket.mesh.position.y, UI.main.cameraDistance);

  const floor = createFloor(testMap, {
    size: MAP.size
  });
  floor.position.set(MAP.size / 2, MAP.size / 2, 0);
  scene.add(floor);


  const asteroids: Asteroid[] = [];
  const asteroidScales = [1, 1, 1, 1, 2, 2, 2, 3, 3, 4, 5];

  for (let i = 0; i < 50; i++) {
    const randomScale = asteroidScales[Math.floor(Math.random() * asteroidScales.length)];
    const baseScale = 0.2;
    const scale = baseScale * randomScale;
    const asteroid = await createAsteroid(Math.random() * scale);
    asteroid.setPosition(Math.random() * MAP.size, Math.random() * MAP.size);
    scene.add(asteroid.mesh);
    asteroids.push(asteroid);
    MATTER.Composite.add(physicsEngine.world, [asteroid.body]);
  }

  // const asteroid = await createAsteroid(1);
  // asteroid.setPosition(rocket.body.position.x+100, rocket.body.position.y);
  // scene.add(asteroid.mesh);
  // MATTER.Composite.add(physicsEngine.world, [asteroid.body]);
  // asteroids.push(asteroid);

  const reliefMap = await createReliefMap(testMap);
  reliefMap.position.set(UI.side.distance, UI.side.distance, 0);
  reliefMap.rotation.x = -Math.PI / 4;
  scene.add(reliefMap);

  let requestId = 0;

  const clock = new THREE.Clock();
  function animate() {

    const time = new Date().getTime() - startTime;

    MATTER.Engine.update(physicsEngine, clock.getDelta());
    MATTER.Render.lookAt(physicRenderer, rocket.body, MATTER.Vector.create(200, 200));

    const rocketPos = getNormalizedPosition(rocket.mesh.position);
    const radarRadius = getNormalizedDistance(UI.radius);

    rocket.update(time);
    asteroids.forEach(asteroid => asteroid.update(time));
    if (GENERAL.realTimeRender) {
      composer.render();
    }
    reliefMap.update(time, rocketPos, radarRadius, rocket.mesh.rotation.z);
    asciiFilter.update(time, UI.radius / Math.min(window.innerHeight, window.innerWidth), rocket.viewRes);
    stats.update();
    reliefComposer.render();


    mainCamera.position.lerp(new THREE.Vector3(rocket.mesh.position.x, rocket.mesh.position.y, mainCamera.position.z), 0.1);

    requestId = requestAnimationFrame(animate);

  }
  requestId = requestAnimationFrame(animate);

  // Events

  document.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowUp') {
      rocket.isAccelerating = !rocket.isAccelerating;
      rocket.isBreaking = false;
    }
    if (e.code === 'ArrowLeft') {
      rocket.isRotatingLeft = !rocket.isRotatingLeft;
      rocket.isBreaking = false;

    }
    if (e.code === 'ArrowRight') {
      rocket.isRotatingRight = !rocket.isRotatingRight;
      rocket.isBreaking = false;

    }
    if (e.code === 'ArrowDown') {
      rocket.isBreaking = !rocket.isBreaking;
      rocket.isAccelerating = false;
      rocket.isRotatingLeft = false;
      rocket.isRotatingRight = false;
    }
    if (e.code === 'KeyR') {
      asciiFilter.viewRes = Math.min(asciiFilter.viewRes + 5, 100);
    }
    if (e.code === 'KeyF') {
      asciiFilter.viewRes = Math.max(asciiFilter.viewRes - 5, 0);
    }
    if (e.code === 'Space') {
      composer.render();

    }
  });


  return () => {
    //TODO: destroy
    window.cancelAnimationFrame(requestId);
    composer.dispose();
  }
}

// Create the stat element
var stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);


init();
