"use strict";

import "reflect-metadata";
import * as THREE from 'three';
import * as Stats from "stats.js";
import GUI from 'lil-gui';
import { container } from "./utils/autoinject";
import { Camera, createCamera } from "./world/camera";
import { createScene } from "./world/scene";
import { createPlanet, Planet } from "./entities/planet";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { AsciiShader } from "./shaders/postprocessing/Ascii";
import { Updatable } from "./types";
import { createRocket, Rocket } from "./entities/rocket";
import { createFloor } from "./entities/floor";
import { createAsciiFilter } from "./effects/asciiFilter";
const asciiTexture = require('../ascii.png');

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

function render(scene: THREE.Scene, camera: THREE.Camera, composer: EffectComposer, stats: Stats) {
  stats.update();
  composer.render();
}

function onWindowResize(camera: Camera, composer: EffectComposer, render: () => void) {
  console.log("resize");
  camera.resize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  render();
}

function animate(
  scene: THREE.Scene,
  camera: THREE.Camera,
  composer: EffectComposer,
  stats: Stats,
  sceneObjects: Updatable[],
  startTime: number
) {
  const time = new Date().getTime() - startTime;
  sceneObjects.forEach((obj) => obj.update(time));
  render(scene, camera, composer, stats)
  
  const rocket = sceneObjects[2] as Rocket;
  camera.position.lerp(new THREE.Vector3(rocket.position.x,rocket.position.y,camera.position.z), 0.1);
  
  requestAnimationFrame(animate.bind(this, scene, camera, composer, stats, sceneObjects,startTime));
}


async function init(
  canvas: HTMLCanvasElement,
  initVars: {
    cameraNear: number,
    cameraFar: number,
    clearColor: number,
  },
  gui: GUI,
): Promise<() => void> {

  const startTime = new Date().getTime();
  const { cameraNear, cameraFar, clearColor } = initVars;

  document.body.appendChild(canvas);
  const composer = createRenderer(canvas, clearColor);


  var stats = new Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom);


  const camera = createCamera(window.innerWidth, window.innerHeight, cameraNear, cameraFar);
  camera.position.copy(new THREE.Vector3(0, 0, 500));

  const scene = createScene();

  const renderPass = new RenderPass(scene, camera);

  const asciiFilter = await createAsciiFilter(asciiTexture,{ratio:canvas.width/canvas.height});
  composer.addPass(renderPass);
  composer.addPass(asciiFilter);



  const objectsToUpdate: (Updatable)[] = [
    asciiFilter
  ];
  const addToScene = (obj: THREE.Mesh & Updatable) => {
    objectsToUpdate.push(obj);
    scene.add(obj);
  };


  const planet1 = createPlanet(500 * Math.random(), {
    name: "Planet1",
    color1: 0xFFFFFF * Math.random(),
    color2: 0xFFFFFF * Math.random(),
  });
  const planet2 = createPlanet(500 * Math.random(), {
    name: "Planet2",
    color1: 0xFFFFFF * Math.random(),
    color2: 0xFFFFFF * Math.random(),
  });
  planet1.position.set(-272, 134, 0);
  planet2.position.set(0, -150, 0);

  const rocket = createRocket();
  rocket.position.set(0, 10, 0);

  const floor = createFloor();
  // scene.add(floor);

  addToScene(floor);

  addToScene(rocket);
  // addToScene(planet1);
  // addToScene(planet2);


  window.addEventListener('resize', onWindowResize.bind(this, camera, composer, () => render(scene, camera, composer, stats)), false);

  const requestId = requestAnimationFrame(animate.bind(this, scene, camera, composer, stats, objectsToUpdate, startTime));
  return () => {
    //FIXME: cleaning is not working properly atm
    window.cancelAnimationFrame(requestId);
    planet1.destroy();
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

const canvas = document.createElement("canvas");

const worldDestroy = init(canvas, initVars, gui);

guiInit.onChange(() => {
  worldDestroy.then((value) => {
    value();
  });
  init(canvas, initVars, gui);
});
