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


  const body = MATTER.Bodies.rectangle(0, 0, 50, 100,{
    friction: 1,
    mass:0.1,
    
  });
  

  const impulseDebug = new THREE.Mesh(
    new THREE.BoxGeometry(10, 10, 1),
    new THREE.MeshBasicMaterial({ color: 0x00FF00 })
  );

  const getRotatedForwardVector = (rotation: number) => {
    return new THREE.Vector3(
      Math.sin(rotation),
      Math.cos(rotation),
    )
  }

  let isAccelerating = false;
  let isRotatingLeft = false;
  let isRotatingRight = false;
  let isBreaking = false;

  document.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowUp') {
      isAccelerating = !isAccelerating;
    }
    if (e.code === 'ArrowLeft') {
      isRotatingLeft = !isRotatingLeft;
    
    }
    if (e.code === 'ArrowRight') {
      isRotatingRight = !isRotatingRight;
     
    }
    if(e.code === 'ArrowDown'){
      isBreaking = !isBreaking;
    }

  });

  const updatePositionFromBody = () => {
    mesh.position.set(body.position.x, body.position.y, mesh.position.z);
    mesh.rotation.z = -body.angle;
  }

  const base = {
    mesh,
    body,
    impulseDebug
  }

  const rocketWithUpdate = addFunction(base, 'update', (time: number) => {

    const forward = getRotatedForwardVector(mesh.rotation.z);

    updatePositionFromBody();

    ['accelerateLabel','turnLeftLabel','turnRightLabel','breakLabel'].forEach(id=>{
      document.getElementById(id).style.backgroundColor = '';
    })

    if(isAccelerating){
      MATTER.Body.setVelocity(body, new THREE.Vector2(
        -forward.x * 1000,
        forward.y * 1000
      ));
      document.getElementById('accelerateLabel').style.backgroundColor = 'red';
    }
    if(isRotatingLeft){
      MATTER.Body.setAngularVelocity(body, -3);
      document.getElementById('turnLeftLabel').style.backgroundColor = 'red';
    }
    if(isRotatingRight){
      MATTER.Body.setAngularVelocity(body, 3);
      document.getElementById('turnRightLabel').style.backgroundColor = 'red';
    }
    if(isBreaking){
      // body.force.y = 1000;
      document.getElementById('breakLabel').style.backgroundColor = 'red';
      MATTER.Body.setSpeed(body,body.speed-3);
      MATTER.Body.setAngularSpeed(body,body.angularSpeed-0.1);
    }
    console.log(body.angularSpeed);

  });

  const rocketWithDestroy = addFunction(rocketWithUpdate, 'destroy', () => {
    mesh.geometry.dispose();
    mesh.material.dispose();
  });

  const rocketWithSetPos = addFunction(rocketWithDestroy, 'setPosition', (x: number, y: number) => {
    Matter.Body.setPosition(body, MATTER.Vector.create(x,y));
    updatePositionFromBody();
  });


  return rocketWithSetPos;
}
