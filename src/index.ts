"use strict";

import "reflect-metadata";
import * as THREE from 'three';
import * as Stats from "stats.js";
import GUI from 'lil-gui';
import { container } from "./utils/autoinject";
import { Camera, createCamera } from "./world/camera";
import { createScene } from "./world/scene";
import { createPlanet } from "./entities/planet";


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
  return renderer;
}

function render(scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.Renderer, stats: Stats) {
  stats.update();
  renderer.render(scene, camera);
}

function onWindowResize(camera: Camera, renderer: THREE.Renderer, render: () => void) {
  console.log("resize");
  camera.resize(window.innerWidth, window.innerHeight);
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}

function animate(
  scene: THREE.Scene,
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer,
  stats: Stats
) {
  render(scene, camera, renderer, stats)
  requestAnimationFrame(animate.bind(this, scene, camera, renderer, stats));
}


function init(
  canvas: HTMLCanvasElement,
  initVars: {
    cameraNear: number,
    cameraFar: number,
    clearColor: number,
  },
  gui: GUI,
) {
  const { cameraNear, cameraFar, clearColor } = initVars;

  document.body.appendChild(canvas);
  const renderer = createRenderer(canvas, clearColor);

  var stats = new Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom);


  const camera = createCamera(window.innerWidth, window.innerHeight, cameraNear, cameraFar);
  camera.position.copy(new THREE.Vector3(0, 0, 500));

  const scene = createScene();


  const planet1 = createPlanet(50,{name: "Planet1",color:0x00FF00*Math.random()});
  const planet2 = createPlanet(400,{name: "Planet2",color:0x00FF00*Math.random()});
  planet2.position.set(700,0,0);
  
  scene.add(planet1);
  scene.add(planet2);

  window.addEventListener('resize', onWindowResize.bind(this, camera, renderer, () => render(scene, camera, renderer, stats)), false);  

  const requestId = requestAnimationFrame(animate.bind(this, scene, camera, renderer, stats));
  return () => {
    //FIXME: cleaning is not working properly atm
    window.cancelAnimationFrame(requestId);
    planet1.destroy();
    scene.destroy();
    camera.destroy();
    renderer.dispose();
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

const canvas = document.createElement("canvas");

const worldDestroy = init(canvas,initVars, gui);

guiInit.onChange(() => {
  worldDestroy();
  init(canvas,initVars, gui);
});
