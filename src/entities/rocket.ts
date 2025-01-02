import * as MATTER from 'matter-js';
import * as THREE from 'three';
import { container, GUI } from '../utils/autoinject';
import { addFunction } from '../utils/functionalUtils';
import { Destroyable, Updatable, Vec2, Vec3 } from './../types';
import * as Matter from 'matter-js';

export interface Rocket extends Destroyable, Updatable {
  mesh: THREE.Mesh;
  setPosition(x: number, y: number): void;
  body: MATTER.Body;
  impulseDebug: THREE.Mesh;
};


export interface RocketParams {
  acceleration?: number;
}

const defaultParams: RocketParams = {
  acceleration: 0.1
}


export function createRocket(
  params?: RocketParams,
  gui = container.resolve<GUI>("GUI")
): Rocket {

  const sanitizedParams = { ...defaultParams, ...params };
  let {
  } = sanitizedParams;


  const material = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(50, 100, 1),
    material
  );


  const body = MATTER.Bodies.rectangle(0, 0, 50, 100);

  const impulseDebug = new THREE.Mesh(
    new THREE.BoxGeometry(10, 10, 1),
    new THREE.MeshBasicMaterial({ color: 0x00FF00 })
  );



  let velocity = 0;

  const rotateVector = (vector: Vec2, rotation: number): Vec2 => {
    return {
      x: vector.x * Math.cos(rotation) - vector.y * Math.sin(rotation),
      y: vector.x * Math.sin(rotation) + vector.y * Math.cos(rotation)
    }
  }

  const getRotatedForwardVector = (rotation: number) => {
    return new THREE.Vector3(
      Math.sin(rotation),
      Math.cos(rotation),
    )
  }

  document.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowUp') {
      // addVelocity(5);

      // const impulsePos = rotatePointAroundPivot(
      //   { x: 0, y: 1000}, { x: body.position.x, y: body.position.y }, mesh.rotation.z
      // );


      console.log(body.speed)

    }
    if (e.code === 'ArrowLeft') {
      body.angle -= 0.01;
      MATTER.Body.setAngularVelocity(body, -3);
      // body.applyLocalImpulse(new CANNON.Vec3(0,1,0),new CANNON.Vec3(
      //   body.position.x-10,
      //   body.position.y+10,
      //   body.position.z
      // ))
    }
    if (e.code === 'ArrowRight') {
      MATTER.Body.setAngularVelocity(body, 3);
      // body.angularVelocity.z -= 0.3;
      // body.applyLocalImpulse(new CANNON.Vec3(0,-1,0),new CANNON.Vec3(
      //   body.position.x+10,
      //   body.position.y-10,
      //   body.position.z
      // ))
    }
    if (e.code === 'ArrowDown') {
      if (velocity > 0) {
        // addVelocity(-5);
      }
    }
  });

  const rotatePointAroundPivot = (point: Vec2, pivot: Vec2, rotation: number): Vec2 => {

    const xA = point.x - pivot.x;
    const yA = point.y - pivot.y;

    const xB = Math.cos(rotation) * xA - Math.sin(rotation) * yA;
    const yB = Math.sin(rotation) * xA + Math.cos(rotation) * yA;

    return {
      x: xB + pivot.x,
      y: yB + pivot.y
    }
  }

  const updatePositionFromBody = () => {
    mesh.position.set(body.position.x, body.position.y, mesh.position.z);
    mesh.rotation.z = -body.angle;
  }

  const base = {
    mesh,
    body,
    impulseDebug
  }

  let lastTimestamp = 0;
  const rocketWithUpdate = addFunction(base, 'update', (time: number) => {


    // if (time - lastTimestamp > 50) {
    //   lastTimestamp = time;

    //   if (body.angularVelocity.z !== 0) {
    //     body.angularVelocity.z -= 0.01 * (body.angularVelocity.z > 0 ? 1 : -1);
    //   }

    //   velocity -= 1;

    //   if (velocity < 0) velocity = 0;


    //   console.log(body.velocity.y)
    //   // updateRigidbodyVelocity(); 

    // }

    const forward = getRotatedForwardVector(mesh.rotation.z);

    // impulseDebug.position.set(impulsePos.x, impulsePos.y, mesh.position.z);
    MATTER.Body.setVelocity(body, new THREE.Vector2(
      -forward.x * 1000,
      forward.y * 1000
    ));

    updatePositionFromBody();


  });

  const rocketWithDestroy = addFunction(rocketWithUpdate, 'destroy', () => {
    mesh.geometry.dispose();
    mesh.material.dispose();
  });

  const rocketWithSetPos = addFunction(rocketWithDestroy, 'setPosition', (x: number, y: number) => {
    body.position.x = x;
    body.position.y = y;
    updatePositionFromBody();
  });


  return rocketWithSetPos;
}
