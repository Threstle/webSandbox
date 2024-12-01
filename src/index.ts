"use strict";

import "reflect-metadata";
import * as THREE from 'three';
import * as Stats from "stats.js";
import GUI from 'lil-gui';
import { container } from "./utils/autoinject";
import { createCamera } from "./world/camera";
import { createScene } from "./world/scene";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { Updatable } from "./types";
import { createRocket, Rocket } from "./entities/rocket";
import { createFloor } from "./entities/floor";
import { createAsciiFilter } from "./effects/asciiFilter";
import { createReliefMap } from "./entities/reliefMap";
import { getNormalizedDistance, getNormalizedPosition, to2D } from "./utils/3dUtils";
import { MAP, UI } from "./conf";
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
  mainCanvas: HTMLCanvasElement,
  sideCanvas: HTMLCanvasElement,
  initVars: {
    cameraNear: number,
    cameraFar: number,
    clearColor: number,
  },
  gui: GUI,
  textureLoader = container.resolve<THREE.TextureLoader>("TextureLoader"),
): Promise<() => void> {

  
  const startTime = new Date().getTime();
  const { cameraNear, cameraFar, clearColor } = initVars;  
  
  const oceanFloorHeightmap = await textureLoader.loadAsync(oceanFloorTexture);
  
  const composer = createRenderer(mainCanvas, clearColor);
  const sideComposer = createRenderer(sideCanvas, 0xFFFFFF, {
    width: 300,
    height: 300,
  });
  

  var stats = new Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom);


  const camera = createCamera(window.innerWidth, window.innerHeight, cameraNear, cameraFar);
  // const sideCamera = createCamera(500, 500, cameraNear, cameraFar);
  const sideCamera = new THREE.PerspectiveCamera();
  camera.position.copy(new THREE.Vector3(0, 0, 500));
  sideCamera.position.copy(new THREE.Vector3(UI.reliefMapPos.x, UI.reliefMapPos.y, 1000));

  const scene = createScene();


  const renderPass = new RenderPass(scene, camera);
  const sideRenderPass = new RenderPass(scene, sideCamera);

  const asciiFilter = await createAsciiFilter(asciiTexture, { ratio: mainCanvas.width / mainCanvas.height });
  composer.addPass(renderPass);
  composer.addPass(asciiFilter);

  sideComposer.addPass(sideRenderPass);

  const objectsToUpdate: (Updatable)[] = [
    asciiFilter
  ];
  const addToScene = (obj: THREE.Mesh & Updatable) => {
    objectsToUpdate.push(obj);
    scene.add(obj);
  };

  const rocket = createRocket();
  rocket.position.set(MAP.size/2, MAP.size/2, 0);
  camera.position.set(rocket.position.x, rocket.position.y, camera.position.z);
  addToScene(rocket);

  const floor = createFloor(oceanFloorHeightmap,{
    size:MAP.size
  });
  floor.position.set(MAP.size/2, MAP.size/2, 0);
  addToScene(floor);

  const reliefMap = await createReliefMap(oceanFloorHeightmap);
  reliefMap.position.set(UI.reliefMapPos.x, UI.reliefMapPos.y, 0);
  reliefMap.rotation.x = -Math.PI/4;
  addToScene(reliefMap); 


  
  //window.addEventListener('resize', onWindowResize.bind(this, camera, composer, () => render(scene, camera, composer, stats)), false);
  
  // const requestId = requestAnimationFrame(animate.bind(this, scene, camera, composer, sideCamera, sideComposer, stats, objectsToUpdate, startTime));
  
  let requestId = 0;
  
  function animate(
    
  ) {

    const time = new Date().getTime() - startTime;
    const rocketPos = getNormalizedPosition(rocket.position);
    const radarRadius = getNormalizedDistance(UI.radius);
    objectsToUpdate.forEach((obj) => obj.update(time));
    composer.render();
    sideComposer.render();
    stats.update();
    reliefMap.update(time,rocketPos,radarRadius);
    asciiFilter.update(time, UI.radius /  Math.min(window.innerHeight,window.innerWidth));

    camera.position.lerp(new THREE.Vector3(rocket.position.x, rocket.position.y, camera.position.z), 0.1);

    requestId = requestAnimationFrame(animate.bind(this, scene, camera, composer, sideCamera, sideComposer, stats, objectsToUpdate, startTime));
    
  }
  requestId = requestAnimationFrame(animate);
  

  return () => {
    //FIXME: cleaning is not working properly atm
    window.cancelAnimationFrame(requestId);
    scene.destroy();
    camera.destroy();
    composer.dispose();
  }
}

const initVars = {
  cameraNear: 1,
  cameraFar: 1000,
  clearColor: 0xf0f0f0,
}

const gui = container.resolve<GUI>("GUI");
const guiInit = gui.addFolder('Init');
guiInit.add(initVars, 'cameraNear', 0, 1000);
guiInit.add(initVars, 'cameraFar', 0, 1000);
guiInit.addColor(initVars, 'clearColor');
guiInit.close();

const mainCanvas = document.createElement("canvas");
const sideCanvas = document.createElement("canvas");
document.body.appendChild(mainCanvas);
document.body.appendChild(sideCanvas);
sideCanvas.style.position = "absolute";
sideCanvas.style.top = "100px";
sideCanvas.style.left = "100px";

const worldDestroy = init(mainCanvas, sideCanvas, initVars, gui);

guiInit.onChange(() => {
  worldDestroy.then((value) => {
    value();
  });
  init(mainCanvas, sideCanvas, initVars, gui);
});
