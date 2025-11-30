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
import { rotateAround } from '../utils/2dUtils';
import { SmokeParticlePool } from '../utils/smokeParticlePool';

export interface Rocket extends Destroyable, Updatable {
  mesh: THREE.Mesh;
  getPartPositions(): {
    mainThruster: Vec2;
    breakThruster: Vec2;
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
  life: number;
  damage(amount: number): void;
};



export async function createRocket(
  scene: THREE.Scene
): Promise<Rocket> {

  let isAccelerating = false;
  let isRotatingLeft = false;
  let isRotatingRight = false;
  let isBreaking = false;
  let fuel = 1000;
  let viewRes = 0;
  let life = 100;
  let damageFlashEndTime = 0;
  const normalColor = 0xDDDDDD;
  const damageColor = 0xFF0000;

  // Initialize smoke particle pool
  const smokePool = new SmokeParticlePool(scene);

  // Individual cooldown timers for each thruster
  const thrusterCooldowns = {
    mainThruster: 0,
    rightThrusterTop: 0,
    leftThrusterBottom: 0,
    leftThrusterTop: 0,
    rightThrusterBottom: 0,
    breakThruster: 0
  };
  const smokeCooldown = 50; // milliseconds between smoke spawns per thruster


  const rocketVertice = await getVerticesFromSVG(require('../assets/rocket.svg'), 10);

  const body = MATTER.Bodies.fromVertices(0, 0, [rocketVertice], {
    friction: 0,
    mass: 10,
    label: 'rocket',
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

  const material = new THREE.MeshBasicMaterial({ color: 0xDDDDDD });
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

    const damage = (amount: number) => {
    life = Math.max(0, life - amount);

    // Flash red for 1 second
    (material as THREE.MeshBasicMaterial).color.setHex(damageColor);
    damageFlashEndTime = performance.now() + 100;
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
      breakThruster: rotate({ x: mesh.position.x, y: mesh.position.y + height / 2 }),
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

    // Handle damage flash effect
    if (damageFlashEndTime > 0 && time >= damageFlashEndTime) {
      (material as THREE.MeshBasicMaterial).color.setHex(normalColor);
      damageFlashEndTime = 0;
    }

    ['accelerateLabel', 'turnLeftLabel', 'turnRightLabel', 'breakLabel'].forEach(id => {
      setLabelColor(id, '');
    })

    if (isAccelerating) {
      MATTER.Body.setVelocity(body, new THREE.Vector2(
        -forward.x * ROCKET.speed,
        forward.y * ROCKET.speed
      ));
      setLabelColor('accelerateLabel', 'red');

      // Main thruster smoke
      if (time - thrusterCooldowns.mainThruster >= smokeCooldown) {
        const spawnPos = getPartPositions().mainThruster;
        smokePool.spawn(spawnPos, { x: 0, y: 0 }, time, 20, 400);
        thrusterCooldowns.mainThruster = time;
      }
    }

    if (isRotatingLeft) {
      MATTER.Body.setAngularVelocity(body, ROCKET.angularSpeed);
      setLabelColor('turnLeftLabel', 'red');

      // Rotation left thrusters
      const positions = getPartPositions();

      if (time - thrusterCooldowns.rightThrusterTop >= smokeCooldown) {
        smokePool.spawn(positions.rightThrusterTop, { x: 0, y: 0 }, time);
        thrusterCooldowns.rightThrusterTop = time;
      }

      if (time - thrusterCooldowns.leftThrusterBottom >= smokeCooldown) {
        smokePool.spawn(positions.leftThrusterBottom, { x: 0, y: 0 }, time);
        thrusterCooldowns.leftThrusterBottom = time;
      }
    }

    if (isRotatingRight) {
      MATTER.Body.setAngularVelocity(body, -ROCKET.angularSpeed);
      setLabelColor('turnRightLabel', 'red');

      // Rotation right thrusters
      const positions = getPartPositions();

      if (time - thrusterCooldowns.leftThrusterTop >= smokeCooldown) {
        smokePool.spawn(positions.leftThrusterTop, { x: 0, y: 0 }, time);
        thrusterCooldowns.leftThrusterTop = time;
      }

      if (time - thrusterCooldowns.rightThrusterBottom >= smokeCooldown) {
        smokePool.spawn(positions.rightThrusterBottom, { x: 0, y: 0 }, time);
        thrusterCooldowns.rightThrusterBottom = time;
      }
    }

    if (isBreaking) {
      setLabelColor('breakLabel', 'red');
      MATTER.Body.setSpeed(body, body.speed - ROCKET.breakForce);
      MATTER.Body.setAngularSpeed(body, body.angularSpeed - ROCKET.angularBreakForce);

      // Break thruster smoke
      if (time - thrusterCooldowns.breakThruster >= smokeCooldown) {
        const parts = getPartPositions();
        Object.values(parts).forEach((thrusterPos) => {
          smokePool.spawn(thrusterPos, { x: 0, y: 0 }, time, body.speed / 100, 400);
        });
        thrusterCooldowns.breakThruster = time;
      }
    }

    // Update smoke pool
    smokePool.update(time);

    if (time - lastTimestamp > 100) {

      depleteFuel();

      lastTimestamp = time;
    }

    setLabelText('fuelLabel', Math.trunc(fuel).toString());
    setLabelText('lifeLabel', Math.trunc(life).toString());

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
    damage,
    get viewRes() { return viewRes },
    get life() { return life },
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
