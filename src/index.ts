"use strict";
import "reflect-metadata";
import * as THREE from 'three';
import Stats from "stats.js";
import * as MATTER from 'matter-js';
import GUI from 'lil-gui';
import { container } from "./utils/autoinject";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { createAsciiFilter } from "./effects/asciiFilter";
import { ASCII, COLLISION, GENERAL, MAP, ROCKET, UI, ASTEROIDS, LOOT } from "./conf";
const asciiTexture = require('../ascii.png');

import './style.css';
import { getVerticesFromSVG } from "./utils/imageUtils";
import { LootManager } from "./utils/lootManager";
import { setLabelText } from "./utils/uiUtils";
import { GameplayManager } from "./utils/gameplayManager";

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

  const composer = createRenderer(mainCanvas, UI.main.cameraClear);

  const lootManager = new LootManager();

  // Create the cameras
  const camera = new THREE.OrthographicCamera(window.innerWidth / - 1, window.innerWidth / 1, window.innerHeight / 1, window.innerHeight / - 1, UI.main.cameraNear, UI.main.cameraFar);


  const gameplayManager = new GameplayManager(
    camera,
    lootManager
  );
  await gameplayManager.initLevel();


  const renderPass = new RenderPass(gameplayManager.getScene(), camera);

  const asciiFilter = await createAsciiFilter(asciiTexture, { ratio: mainCanvas.width / mainCanvas.height, enabled: ASCII.enabled });
  composer.addPass(renderPass);
  composer.addPass(asciiFilter);




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

  let requestId = 0;

  let lastTimestamp = 0;

  const clock = new THREE.Clock();
  function animate() {

    const now = new Date().getTime();

    const time = now - startTime;

    gameplayManager.update(time, clock);

    // Update loot counter display
    // TODO: this is terrible to put this in the loop
    setLabelText('lootLabel', lootManager.getLoot().toString());

    if (GENERAL.realTimeRender) {
      composer.render();
    }
    stats.update();

    requestId = requestAnimationFrame(animate);

    if (time - lastTimestamp < 100) {
      lastTimestamp = time;
    }

  }
  requestId = requestAnimationFrame(animate);



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
