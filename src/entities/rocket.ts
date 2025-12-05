import * as MATTER from 'matter-js';
import * as THREE from 'three';
import { container, GUI } from '../utils/autoinject';
import { addFunction, completeAssign } from '../utils/functionalUtils';
import { Destroyable, Updatable, Vec2, Vec3 } from './../types';
import * as Matter from 'matter-js';
import { setLabelColor, setLabelText } from '../utils/uiUtils';
import { ROCKET, SMOKE } from '../conf';
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
  isThrusterBottomLeftOn: boolean;
  isThrusterTopLeftOn: boolean;
  isThrusterBottomRightOn: boolean;
  isThrusterTopRightOn: boolean;
  isBreaking: boolean;
  life: number;
  damage(amount: number): void;
};



export async function createRocket(
  scene: THREE.Scene,
  smokePool: SmokeParticlePool
): Promise<Rocket> {

  let isAccelerating = false;
  let isThrusterBottomLeftOn = false;
  let isThrusterTopLeftOn = false;
  let isThrusterBottomRightOn = false;
  let isThrusterTopRightOn = false;
  let isBreaking = false;
  let fuel = 1000;
  let viewRes = 0;
  let life = 100;
  let damageFlashEndTime = 0;

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
    collisionFilter: {
      category: 0x0004, // Rocket category
      mask: 0x0001      // Only collide with default category (asteroids, loot, etc.), not smoke
    }
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

  const material = new THREE.MeshBasicMaterial({ color: ROCKET.idleColor });
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
    if (isThrusterBottomLeftOn) { fuel -= 1; }
    if (isThrusterTopLeftOn) { fuel -= 1; }
    if (isThrusterBottomRightOn) { fuel -= 1; }
    if (isThrusterTopRightOn) { fuel -= 1; }
    if (isAccelerating) { fuel -= 2; }
    if (isBreaking) { fuel -= 3; }
  }

  const damage = (amount: number) => {
    life = Math.max(0, life - amount);

    // Flash red for 1 second
    (material as THREE.MeshBasicMaterial).color.setHex(ROCKET.damagedColor);
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
      rightThrusterTop: rotate({ x: right, y: mesh.position.y + height / 9 }),
      leftThrusterBottom: rotate({ x: left, y: mesh.position.y - height / 9 }),
      leftThrusterTop: rotate({ x: left, y: mesh.position.y + height / 9 }),
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
    const left = getRotatedForwardVector(mesh.rotation.z - Math.PI / 2);
    const right = getRotatedForwardVector(mesh.rotation.z + Math.PI / 2);

    const { rightThrusterBottom, rightThrusterTop, leftThrusterBottom, leftThrusterTop, mainThruster } = getPartPositions();

    updatePositionFromBody();

    // Handle damage flash effect
    if (damageFlashEndTime > 0 && time >= damageFlashEndTime) {
      (material as THREE.MeshBasicMaterial).color.setHex(ROCKET.idleColor);
      damageFlashEndTime = 0;
    }


    if (isAccelerating) {

      MATTER.Body.applyForce(body, getPartPositions().mainThruster, new THREE.Vector2(
        -forward.x * ROCKET.speed,
        forward.y * ROCKET.speed
      ));


      // Main thruster smoke
      if (time - thrusterCooldowns.mainThruster >= smokeCooldown) {
        const spawnPos = getPartPositions().mainThruster;
        smokePool.spawn(spawnPos, { x: forward.x*10, y: -forward.y*10 }, time, 20, 400);
        thrusterCooldowns.mainThruster = time;
      }
    }

    // Individual thruster controls
    if (isThrusterTopLeftOn) {
      MATTER.Body.applyForce(body, leftThrusterTop, new THREE.Vector2(
        -left.x * ROCKET.angularSpeed,
        left.y * ROCKET.angularSpeed
      ));

      if (time - thrusterCooldowns.leftThrusterTop >= smokeCooldown) {
        smokePool.spawn(leftThrusterTop, { x: left.x*SMOKE.velocity, y: -left.y*SMOKE.velocity }, time);
        thrusterCooldowns.leftThrusterTop = time;
      }
    }

    if (isThrusterBottomLeftOn) {
      MATTER.Body.applyForce(body, leftThrusterBottom, new THREE.Vector2(
        -left.x * ROCKET.angularSpeed,
        left.y * ROCKET.angularSpeed
      ));

      if (time - thrusterCooldowns.leftThrusterBottom >= smokeCooldown) {
        smokePool.spawn(leftThrusterBottom, { x: left.x*SMOKE.velocity, y: -left.y*SMOKE.velocity }, time);
        thrusterCooldowns.leftThrusterBottom = time;
      }
    }

    if (isThrusterTopRightOn) {
      MATTER.Body.applyForce(body, rightThrusterTop, new THREE.Vector2(
        -right.x * ROCKET.angularSpeed,
        right.y * ROCKET.angularSpeed
      ));

      if (time - thrusterCooldowns.rightThrusterTop >= smokeCooldown) {
        smokePool.spawn(rightThrusterTop, { x: right.x*SMOKE.velocity, y: -right.y*SMOKE.velocity }, time);
        thrusterCooldowns.rightThrusterTop = time;
      }
    }

    if (isThrusterBottomRightOn) {
      MATTER.Body.applyForce(body, rightThrusterBottom, new THREE.Vector2(
        -right.x * ROCKET.angularSpeed,
        right.y * ROCKET.angularSpeed
      ));

      if (time - thrusterCooldowns.rightThrusterBottom >= smokeCooldown) {
        smokePool.spawn(rightThrusterBottom, { x: right.x*SMOKE.velocity, y: -right.y*SMOKE.velocity }, time);
        thrusterCooldowns.rightThrusterBottom = time;
      }
    }

    if (isBreaking) {
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
    smokePool.destroy();
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
    get isThrusterBottomLeftOn() { return isThrusterBottomLeftOn },
    set isThrusterBottomLeftOn(value: boolean) { isThrusterBottomLeftOn = value },
    get isThrusterTopLeftOn() { return isThrusterTopLeftOn },
    set isThrusterTopLeftOn(value: boolean) { isThrusterTopLeftOn = value },
    get isThrusterBottomRightOn() { return isThrusterBottomRightOn },
    set isThrusterBottomRightOn(value: boolean) { isThrusterBottomRightOn = value },
    get isThrusterTopRightOn() { return isThrusterTopRightOn },
    set isThrusterTopRightOn(value: boolean) { isThrusterTopRightOn = value },
    get isBreaking() { return isBreaking },
    set isBreaking(value: boolean) { isBreaking = value },
  });

}
