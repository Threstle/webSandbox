"use strict";

import "reflect-metadata";
import * as THREE from 'three';
import * as Stats from "stats.js";
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
import { ASCII, MAP, UI } from "./conf";
const asciiTexture = require('../ascii.png');
const oceanFloorTexture = require('../src/assets/map1.png');

import './style.css';

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
  const sideCanvas = document.getElementById("side") as HTMLCanvasElement;

  const composer = createRenderer(mainCanvas, UI.main.cameraClear);
  const sideComposer = createRenderer(sideCanvas, 0xFFFFFF, {
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
    element: document.body,
    engine: physicsEngine,
    options: {
      width: 300,
      height: 300,
      showVelocity: true,
      showAngleIndicator: true
    }
  });



  physicRenderer.canvas.style.bottom = '0px';
  physicRenderer.canvas.style.top = 'auto';

  MATTER.Render.run(physicRenderer);


  // create runner
  // var runner = MATTER.Runner.create();

  // run the engine
  // MATTER.Runner.run(runner, physicsEngine);


  const scene = new THREE.Scene();

  // Create the cameras
  const mainCamera = new THREE.OrthographicCamera(window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, UI.main.cameraNear, UI.main.cameraFar);

  const sideCamera = new THREE.PerspectiveCamera();
  sideCamera.position.set(UI.side.distance, UI.side.distance, UI.side.cameraDistance);



  const renderPass = new RenderPass(scene, mainCamera);
  const sideRenderPass = new RenderPass(scene, sideCamera);

  const asciiFilter = await createAsciiFilter(asciiTexture, { ratio: mainCanvas.width / mainCanvas.height , enabled:ASCII.enabled});
  composer.addPass(renderPass);
  composer.addPass(asciiFilter);

  sideComposer.addPass(sideRenderPass);

  const rocket = createRocket();
  // rocket.setPosition(MAP.size / 2, MAP.size / 2);

  scene.add(rocket.mesh);
  scene.add(rocket.impulseDebug);
  MATTER.Composite.add(physicsEngine.world, [rocket.body]);
  mainCamera.position.set(rocket.mesh.position.x, rocket.mesh.position.y, UI.main.cameraDistance);

  const floor = createFloor(testMap, {
    size: MAP.size
  });
  floor.position.set(MAP.size / 2, MAP.size / 2, 0);
  scene.add(floor);

  const reliefMap = await createReliefMap(testMap);
  reliefMap.position.set(UI.side.distance, UI.side.distance, 0);
  reliefMap.rotation.x = -Math.PI / 4;
  scene.add(reliefMap);

  let requestId = 0;

  const clock = new THREE.Clock();
  function animate(

  ) {

    const time = new Date().getTime() - startTime;

    MATTER.Engine.update(physicsEngine, clock.getDelta());
    MATTER.Render.lookAt(physicRenderer, rocket.body,MATTER.Vector.create(200,200));

    const rocketPos = getNormalizedPosition(rocket.mesh.position);
    const radarRadius = getNormalizedDistance(UI.radius);

    rocket.update(time);
    reliefMap.update(time, rocketPos, radarRadius, rocket.mesh.rotation.z);
    asciiFilter.update(time, UI.radius / Math.min(window.innerHeight, window.innerWidth));

    composer.render();
    sideComposer.render();
    stats.update();

    mainCamera.position.lerp(new THREE.Vector3(rocket.mesh.position.x, rocket.mesh.position.y, mainCamera.position.z), 0.1);

    requestId = requestAnimationFrame(animate.bind(this));

  }
  requestId = requestAnimationFrame(animate);


  return () => {
    //TODO: destroy
    window.cancelAnimationFrame(requestId);
    composer.dispose();
  }
}

// Create the canvases
const main = document.createElement("canvas");
const side = document.createElement("canvas");

main.id = "main";
side.id = "side";

document.body.appendChild(main);
document.body.appendChild(side);

// Create the stat element
var stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

init();
