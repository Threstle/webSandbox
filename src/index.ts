"use strict";

import "reflect-metadata";
import * as THREE from 'three';
import * as Stats from "stats.js";
import GUI from 'lil-gui';
import { contain } from "three/src/extras/TextureUtils";
import { container } from "./autoinject";
import { createCamera } from "./camera";
import { createScene } from "./scene";


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

// function onWindowResize(camera: THREE.Camera, renderer: THREE.Renderer, render: () => void) {
//   camera.aspect = window.innerWidth / window.innerHeight;
//   camera.updateProjectionMatrix();
//   renderer.setSize(window.innerWidth, window.innerHeight);
//   render();
// }

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


  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(100, 100, 100),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
  );
  // const guiCube = gui.addFolder('Cube');
  // guiCube.add(cube.position, 'x', -1000, 1000);

  scene.add(cube);


  const requestId = requestAnimationFrame(animate.bind(this, scene, camera, renderer, stats));
  return () => {

    window.cancelAnimationFrame(requestId);
    cube.geometry.dispose();
    cube.material.dispose();
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
