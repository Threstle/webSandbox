import * as MATTER from 'matter-js';
import * as THREE from 'three';
import { container, GUI } from '../utils/autoinject';
import { addFunction, completeAssign } from '../utils/functionalUtils';
import { Destroyable, Updatable, Vec2, Vec3 } from './../types';
import * as Matter from 'matter-js';
import { setLabelColor, setLabelText } from '../utils/uiUtils';
import { ROCKET } from '../conf';

export interface Rocket extends Destroyable, Updatable {
  mesh: THREE.Mesh;
  setPosition(x: number, y: number): void;
  body: MATTER.Body;
  viewRes:number;
  isAccelerating:boolean;
  isRotatingLeft:boolean;
  isRotatingRight:boolean;
  isBreaking:boolean;
};



export function createRocket(
): Rocket {

  let isAccelerating = false;
  let isRotatingLeft = false;
  let isRotatingRight = false;
  let isBreaking = false;
  let fuel = 1000;
  let viewRes = 0

  const material = new THREE.MeshBasicMaterial({ color: 0x00FF00 });
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
    mesh.rotation.z = body.angle;
  }

  const base = {
    mesh,
    body,
  }

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
        -forward.x * ROCKET.speed,
        forward.y * ROCKET.speed
      ));
      setLabelColor('accelerateLabel', 'red');

    }
    if (isRotatingLeft) {
      MATTER.Body.setAngularVelocity(body, ROCKET.angularSpeed);

      setLabelColor('turnLeftLabel', 'red');
    }
    if (isRotatingRight) {
      MATTER.Body.setAngularVelocity(body, -ROCKET.angularSpeed);
      setLabelColor('turnRightLabel', 'red');
    }
    if (isBreaking) {
      setLabelColor('breakLabel', 'red');
      MATTER.Body.setSpeed(body, body.speed - ROCKET.breakForce);
      MATTER.Body.setAngularSpeed(body, body.angularSpeed - ROCKET.angularBreakForce);
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

  return completeAssign(base, {
    setPosition,
    update,
    destroy,
    get viewRes () { return viewRes },
    get isAccelerating () { return isAccelerating },
    set isAccelerating (value: boolean) { isAccelerating = value },
    get isRotatingLeft () { return isRotatingLeft },
    set isRotatingLeft (value: boolean) { isRotatingLeft = value },
    get isRotatingRight () { return isRotatingRight },
    set isRotatingRight (value: boolean) { isRotatingRight = value },
    get isBreaking () { return isBreaking },
    set isBreaking (value: boolean) { isBreaking = value },
  });

}
