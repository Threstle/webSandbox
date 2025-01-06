import * as MATTER from 'matter-js';
import * as THREE from 'three';
import { container, GUI } from '../utils/autoinject';
import { addFunction } from '../utils/functionalUtils';
import { Destroyable, Updatable, Vec2, Vec3 } from './../types';
import * as Matter from 'matter-js';
import { setLabelColor, setLabelText } from '../utils/uiUtils';

export interface Rocket extends Destroyable, Updatable {
  mesh: THREE.Mesh;
  setPosition(x: number, y: number): void;
  body: MATTER.Body;
  getViewRes: ()=>number;
};



export function createRocket(
): Rocket {

  let isAccelerating = false;
  let isRotatingLeft = false;
  let isRotatingRight = false;
  let isBreaking = false;
  let fuel = 1000;
  let viewRes = 0

  const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(50, 100, 1),
    material
  );

  const body = MATTER.Bodies.rectangle(0, 0, 50, 100, {
    friction: 1,
    mass: 0.1,

  });

  const getRotatedForwardVector = (rotation: number) => {
    return new THREE.Vector3(
      Math.sin(rotation),
      Math.cos(rotation),
    )
  }

  const depleteFuel = () => {
    if (isRotatingLeft) { fuel -= 1; }
    if (isRotatingRight) { fuel -= 1; }
    if (isAccelerating) { fuel -= 2; }
    if (isBreaking) { fuel -= 3; }
    fuel-=viewRes/50;
  }

  const updatePositionFromBody = () => {
    mesh.position.set(body.position.x, body.position.y, mesh.position.z);
    mesh.rotation.z = -body.angle;
  }

  const base = {
    mesh,
    body,
  }


  document.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowUp') {
      isAccelerating = !isAccelerating;
      isBreaking = false;
    }
    if (e.code === 'ArrowLeft') {
      isRotatingLeft = !isRotatingLeft;
      isBreaking = false;

    }
    if (e.code === 'ArrowRight') {
      isRotatingRight = !isRotatingRight;
      isBreaking = false;

    }
    if (e.code === 'ArrowDown') {
      isBreaking = !isBreaking;
      isAccelerating = false;
      isRotatingLeft = false;
      isRotatingRight = false;
    }
    if(e.code === 'KeyR'){
      viewRes = Math.min(viewRes+5,100);
    }
    if(e.code === 'KeyF'){
      viewRes = Math.max(viewRes-5,0);
    }

  });


  const setPosition = (x: number, y: number) => {
    Matter.Body.setPosition(body, MATTER.Vector.create(x, y));
    updatePositionFromBody();
  }

  let lastTimestamp = 0;
  const update = (time: number) => {

    const forward = getRotatedForwardVector(mesh.rotation.z);

    updatePositionFromBody();

    ['accelerateLabel', 'turnLeftLabel', 'turnRightLabel', 'breakLabel'].forEach(id => {
      setLabelColor(id, '');
    })

    if (isAccelerating) {
      MATTER.Body.setVelocity(body, new THREE.Vector2(
        -forward.x * 500,
        forward.y * 500
      ));
      setLabelColor('accelerateLabel', 'red');

    }
    if (isRotatingLeft) {
      MATTER.Body.setAngularVelocity(body, -5);
      setLabelColor('turnLeftLabel', 'red');
    }
    if (isRotatingRight) {
      MATTER.Body.setAngularVelocity(body, 5);
      setLabelColor('turnRightLabel', 'red');
    }
    if (isBreaking) {
      setLabelColor('breakLabel', 'red');
      MATTER.Body.setSpeed(body, body.speed - 4);
      MATTER.Body.setAngularSpeed(body, body.angularSpeed - 0.03);
    }

    if (time - lastTimestamp > 100) {

      depleteFuel();

      lastTimestamp = time;
    }

    setLabelText('fuelLabel', Math.trunc(fuel).toString());

  }

  const destroy = () => {
    mesh.geometry.dispose();
    mesh.material.dispose();
  }

  return {
    ...base,
    setPosition,
    update,
    destroy,
    getViewRes:()=>viewRes,

  };
}
