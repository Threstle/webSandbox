"use strict";

// Import Threejs.
import * as THREE from 'three';

// Import stats.
import * as Stats from "stats.js";

function createWorld() {
  const scene = new THREE.Scene();
  const light = new THREE.PointLight(0xffffff, 1.5);
  light.position.set(-600, 600, 1000);
  scene.add(light);

  return {
    scene,
    light
  }
}

function createCamera() {
  const fov = 45;
  const aspect = window.innerWidth / window.innerHeight;
  const near = 0.1;
  const far = 2000;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 0, 500);
  return camera;
}

function createRenderer(
  canvas: HTMLCanvasElement,
  renderSize = { width: window.innerWidth, height: window.innerHeight },
  renderRatio = window.devicePixelRatio
) {
  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setClearColor(0xf0f0f0);
  renderer.setPixelRatio(renderRatio);
  renderer.setSize(renderSize.width, renderSize.height);
  return renderer;
}

function render(scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, stats: Stats) {
  stats.update();
  renderer.render(scene, camera);
}

function onWindowResize(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, render: () => void) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}



function init() {

  const canvas = document.createElement("canvas");
  document.body.appendChild(canvas);
  const renderer = createRenderer(canvas);
  document.body.appendChild(renderer.domElement);

  const camera = createCamera();
  const { scene, light } = createWorld();

  var stats = new Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom);

  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(100, 100, 100),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
  );

  scene.add(cube);


  render(
    scene,
    camera,
    renderer,
    stats
  );
  
  // window.addEventListener("resize", onWindowResize.bind(camera,), false);

}

init();

// function onWindowResize() {
//   camera.aspect = window.innerWidth / window.innerHeight;
//   camera.updateProjectionMatrix();
//   renderer.setSize(window.innerWidth, window.innerHeight);
//   render();
// }

// Scene.
// var camera, scene, renderer, light;
// var orbitControls;

// // Stats.
// var stats = new Stats();
// stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
// document.body.appendChild(stats.dom);

// let cube;

// function init() {
//   // Camera.
//   const fov = 45;
//   const aspect = window.innerWidth / window.innerHeight;
//   const near = 0.1;
//   const far = 2000;
//   camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
//   camera.position.set(0, 0, 500);

//   const canvas = document.createElement("canvas");
//   document.body.appendChild(canvas);
//   //const canvas = document.querySelector('#c');
//   renderer = new THREE.WebGLRenderer({ canvas });
//   renderer.setClearColor(0xf0f0f0);
//   renderer.setPixelRatio(window.devicePixelRatio);
//   renderer.setSize(window.innerWidth, window.innerHeight);
//   document.body.appendChild(renderer.domElement);

//   window.addEventListener("resize", onWindowResize, false);

//   // Orbit controls.
//   orbitControls = new OrbitControls(camera, renderer.domElement);
//   orbitControls.enablePan = true;
//   orbitControls.enableKeys = false;
//   orbitControls.update();
//   orbitControls.addEventListener("change", render);

//   // Adding orbit controls to camera (expected by AMI image widgets).
//   camera.controls = orbitControls;

//   // Scene.
//   scene = new THREE.Scene();

//   // Lights.
//   light = new THREE.PointLight(0xffffff, 1.5);
//   light.position.set(-600, 600, 1000);
//   scene.add(light);

//   cube = new THREE.Mesh(
//     new THREE.BoxGeometry(100, 100, 100),
//     new THREE.MeshBasicMaterial({ color: 0xff0000 })
//   );

//   scene.add(cube);
// }

// // Draw Scene
// function render() {
//   stats.update();
//   renderer.render(scene, camera);
//   cube.rotation.x += 0.01;
//   cube.rotation.y += 0.01;
// }

// function onWindowResize() {
//   camera.aspect = window.innerWidth / window.innerHeight;
//   camera.updateProjectionMatrix();
//   renderer.setSize(window.innerWidth, window.innerHeight);
//   render();
// }

// start scene
// init();
// render();
