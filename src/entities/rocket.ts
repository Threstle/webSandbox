import * as MATTER from 'matter-js';
import * as THREE from 'three';
import { container, GUI } from '../utils/autoinject';
import { addFunction, completeAssign } from '../utils/functionalUtils';
import { Destroyable, Updatable, Vec2, Vec3 } from './../types';
import * as Matter from 'matter-js';
import { setLabelColor, setLabelText } from '../utils/uiUtils';
import { ROCKET } from '../conf';
import { getVerticesFromSVG } from '../utils/imageUtils';
import { getBoundsFromVertices } from '../utils/3dUtils';
import { createSmokeParticle } from './smokeParticle';
import { rotateAround } from '../utils/2dUtils';

export interface Rocket extends Destroyable, Updatable {
  mesh: THREE.Mesh;
  getPartPositions(): {
    mainThruster: Vec2;
    leftThrusterTop: Vec2;
    leftThrusterBottom: Vec2;
    rightThrusterTop: Vec2;
    rightThrusterBottom: Vec2;
  };
  setPosition(x: number, y: number): void;
  body: MATTER.Body;
  viewRes: number;
  isAccelerating: boolean;
  isRotatingLeft: boolean;
  isRotatingRight: boolean;
  isBreaking: boolean;
};



export async function createRocket(
): Promise<Rocket> {

  let isAccelerating = false;
  let isRotatingLeft = false;
  let isRotatingRight = false;
  let isBreaking = false;
  let fuel = 1000;
  let viewRes = 0


  const rocketVertice = await getVerticesFromSVG(require('../assets/rocket.svg'), 10);

  const body = MATTER.Bodies.fromVertices(0, 0, [rocketVertice], {
    friction: 0,
    mass: 10,
  });

  const ogBounds = getBoundsFromVertices(rocketVertice);
  const bodyBounds = body.bounds;

  const offset = [
    ogBounds.minX - bodyBounds.min.x,
    ogBounds.minY - bodyBounds.min.y,
    ogBounds.maxX - bodyBounds.max.x,
    ogBounds.maxY - bodyBounds.max.y,
  ];

  const offsetVertices = rocketVertice.map((vertex) => new THREE.Vector2(vertex.x - offset[0], vertex.y - offset[1]));

  const shape = new THREE.Shape();
  shape.setFromPoints(offsetVertices);
  const geometry = new THREE.ShapeGeometry(shape);

  const material = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
  const mesh = new THREE.Mesh(
    geometry,
    material
  );
  mesh.position.z = 0.1;

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
    fuel -= viewRes / 50;
  }

  const updatePositionFromBody = () => {
    mesh.position.set(body.position.x, body.position.y, mesh.position.z);
    mesh.rotation.z = body.angle;
  }

  const base = {
    mesh,
    body,
  }

  const getPartPositions = () => {

    const width = ogBounds.maxX - ogBounds.minX;
    const height = ogBounds.maxY - ogBounds.minY;

    const rotate = (pos: Vec2) => rotateAround(pos, mesh.rotation.z, mesh.position)

    const right = mesh.position.x + width / 2;
    const left = mesh.position.x - width / 2;

    return {
      mainThruster: rotate({ x: mesh.position.x, y: mesh.position.y - height / 2 }),
      rightThrusterTop: rotate({ x:right, y: mesh.position.y + height / 9 }),
      leftThrusterBottom: rotate({ x: left, y: mesh.position.y - height / 9 }),
      leftThrusterTop: rotate({ x:left, y: mesh.position.y + height / 9 }),
      rightThrusterBottom: rotate({ x: right, y: mesh.position.y - height / 4.5 }),
    }
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
    getPartPositions,
    update,
    destroy,
    get viewRes() { return viewRes },
    get isAccelerating() { return isAccelerating },
    set isAccelerating(value: boolean) { isAccelerating = value },
    get isRotatingLeft() { return isRotatingLeft },
    set isRotatingLeft(value: boolean) { isRotatingLeft = value },
    get isRotatingRight() { return isRotatingRight },
    set isRotatingRight(value: boolean) { isRotatingRight = value },
    get isBreaking() { return isBreaking },
    set isBreaking(value: boolean) { isBreaking = value },
  });

}
