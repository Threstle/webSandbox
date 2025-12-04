import * as THREE from 'three';
import * as MATTER from 'matter-js';
import { createRocket, Rocket } from '../entities/rocket';
import { ASTEROIDS, COLLISION, LOOT, MAP, UI } from '../conf';
import { Asteroid, createAsteroid } from '../entities/asteroid';
import { distance } from './2dUtils';
import { getVerticesFromSVG } from './imageUtils';
import { createLoot, Loot } from '../entities/loot';
import { LootManager } from './lootManager';
import { setupInputHandlers } from './inputManager';

export class GameplayManager {

  private scene: THREE.Scene;
  private physicsEngine: MATTER.Engine;
  private physicRenderer: MATTER.Render;

  private bodiesVelocities = {};
  private rocket: Rocket;
  private loots: Loot[] = [];
  private asteroids: Asteroid[] = [];

  constructor(
    private camera: THREE.OrthographicCamera,
    private lootManager: LootManager
  ) {

    // Create scene
    this.scene = new THREE.Scene();

    // Init physics
    this.physicsEngine = MATTER.Engine.create({
      gravity: {
        x: 0,
        y: 0,
        scale: 0
      }
    });

    // Create physics renderer
    this.physicRenderer = MATTER.Render.create({
      canvas: document.getElementById('physics') as HTMLCanvasElement,
      engine: this.physicsEngine,
      options: {
        width: 200,
        height: 200,
        showVelocity: true,
        showAngleIndicator: true,
      }
    });

    MATTER.Render.run(this.physicRenderer);
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public async initLevel() {

    console.log('inisefsefseft')
    // TODO : move this to a data file
    // Preload every SVG
    const asteroidVertices = [
      await getVerticesFromSVG(require('./../assets/ast1.svg')),
      await getVerticesFromSVG(require('./../assets/ast2.svg')),
      await getVerticesFromSVG(require('./../assets/ast3.svg')),
      await getVerticesFromSVG(require('./../assets/ast4.svg')),
      await getVerticesFromSVG(require('./../assets/ast5.svg')),
      await getVerticesFromSVG(require('./../assets/ast6.svg')),
      await getVerticesFromSVG(require('./../assets/ast8.svg')),
      await getVerticesFromSVG(require('./../assets/ast9.svg')),
      await getVerticesFromSVG(require('./../assets/ast10.svg')),
      await getVerticesFromSVG(require('./../assets/ast11.svg')),
      await getVerticesFromSVG(require('./../assets/ast12.svg')),
      // await getVerticesFromSVG(require('./assets/ast13.svg')),
      await getVerticesFromSVG(require('./../assets/ast14.svg')),
      await getVerticesFromSVG(require('./../assets/ast15.svg')),
      await getVerticesFromSVG(require('./../assets/ast16.svg')),
      await getVerticesFromSVG(require('./../assets/ast17.svg')),
      await getVerticesFromSVG(require('./../assets/ast18.svg')),
      await getVerticesFromSVG(require('./../assets/ast19.svg')),
      await getVerticesFromSVG(require('./../assets/ast20.svg')),
      await getVerticesFromSVG(require('./../assets/ast21.svg')),
      await getVerticesFromSVG(require('./../assets/ast22.svg')),
      await getVerticesFromSVG(require('./../assets/ast23.svg')),
    ];

    this.scene = new THREE.Scene();

    this.rocket = await createRocket(this.scene);
    console.log('rocket',this.rocket)
    this.rocket.setPosition(MAP.size / 2, MAP.size / 2);

    this.scene.add(this.rocket.mesh);
    MATTER.Composite.add(this.physicsEngine.world, [this.rocket.body]);
    this.camera.position.set(this.rocket.mesh.position.x, this.rocket.mesh.position.y, UI.main.cameraDistance);

    // TODO : add collision detection

    const startPos = { x: MAP.startingPosX, y: MAP.startingPosY };


    // ------------ SPAWN ASTEROIDS ------------

    for (let i = 0; i < ASTEROIDS.amount; i++) {
      const randomScale = ASTEROIDS.scales[Math.floor(Math.random() * ASTEROIDS.scales.length)];
      const scale = ASTEROIDS.baseScale * randomScale;
      const asteroid = await createAsteroid(
        asteroidVertices[Math.floor(Math.random() * asteroidVertices.length)],
        scale
      );

      const asteroidPos = { x: Math.random() * MAP.size, y: Math.random() * MAP.size }


      const distanceFromStart = distance(startPos, asteroidPos) - asteroid.radius * scale;

      const spawnAsteroid = () => {
        this.scene.add(asteroid.mesh);
        asteroid.setPosition(asteroidPos.x, asteroidPos.y);

        this.asteroids.push(asteroid);
        MATTER.Composite.add(this.physicsEngine.world, [asteroid.body]);
      }

      if (distanceFromStart > MAP.safeZoneRadius) {
        spawnAsteroid();
      }

    }

    // ------------ SPAWN LOOT ------------

    // Create loot items

    for (let i = 0; i < 50; i++) {
      const randomScale = LOOT.scales[Math.floor(Math.random() * LOOT.scales.length)];
      const loot = await createLoot(randomScale);

      const lootPos = { x: Math.random() * MAP.size, y: Math.random() * MAP.size };

      const distanceFromStart = distance(startPos, lootPos) - loot.radius * randomScale;

      const spawnLoot = () => {
        this.scene.add(loot.mesh);
        loot.setPosition(lootPos.x, lootPos.y);

        this.loots.push(loot);
        MATTER.Composite.add(this.physicsEngine.world, [loot.body]);
      }

      if (distanceFromStart > MAP.safeZoneRadius) {
        spawnLoot();
      }
    }



    MATTER.Events.on(this.physicsEngine, 'beforeUpdate', this.registerVelocities.bind(this));
    MATTER.Events.on(this.physicsEngine, 'collisionStart', this.collide.bind(this));

    // Setup input handlers
    const cleanupInputHandlers = setupInputHandlers({ rocket:this.rocket });
  }

    // TODO: Clock necessary?
  public update(time: number,clock: THREE.Clock): void {
    MATTER.Engine.update(this.physicsEngine, clock.getDelta());
    // TODO : what is this for?
    console.log(this.rocket);
    MATTER.Render.lookAt(this.physicRenderer, this.rocket.body, MATTER.Vector.create(200, 200));

    this.rocket.update(time);
    this.asteroids.forEach(asteroid => asteroid.update(time));
    this.loots.forEach(loot => loot.update(time));

    // TODO: check if lerp works
    this.camera.position.lerp(new THREE.Vector3(this.rocket.mesh.position.x, this.rocket.mesh.position.y, this.camera.position.z), 0.1);

  }

  public destroyLevel(): void {
    // TODO: Destroy level
    MATTER.Events.off(this.physicsEngine, 'beforeUpdate', this.registerVelocities);
  }

  private registerVelocities(): void {
    this.physicsEngine.world.bodies.forEach(body => {
      //TODO find a more secure way to do this
      //@ts-ignore
      this.bodiesVelocities[body.label] = body.velocity;
    });
  }

  private collide(event: MATTER.IEventCollision<MATTER.Engine>) {

    
    event.pairs.forEach((pair) => {
      
      console.log('collide',pair.bodyB,this.rocket)
      // Check if rocket is involved in collision
      const isRocketInvolved = pair.bodyA.label === this.rocket.body.label || pair.bodyB.label === this.rocket.body.label;


      if (isRocketInvolved) {

        // Get the other body (the one that hit the rocket)
        const rocketBody = pair.bodyA.label === this.rocket.body.label ? pair.bodyA : pair.bodyB;
        const otherBody = pair.bodyA.label === this.rocket.body.label ? pair.bodyB : pair.bodyA;

        // Check if it's a loot collision
        if (otherBody.label.startsWith('loot-')) {
          // Find and remove the loot
          const lootIndex = this.loots.findIndex(loot => loot.body.label === otherBody.label);
          if (lootIndex > -1) {
            const loot = this.loots[lootIndex];

            // Remove from scene and physics world
            this.scene.remove(loot.mesh);
            MATTER.Composite.remove(this.physicsEngine.world, loot.body);
            loot.destroy();

            // Remove from array
            this.loots.splice(lootIndex, 1);

            // Increment loot counter
            this.lootManager.increment();

          }
          return; // Don't process damage for loot
        }

        // @ts-ignore
        const otherBodyVelocity = this.bodiesVelocities[otherBody.label];
        // @ts-ignore
        const rocketVelocity = this.bodiesVelocities[rocketBody.label];

        // Calculate relative velocity (impact speed)
        const relativeVelocity = MATTER.Vector.sub(otherBodyVelocity, rocketVelocity);
        const impactSpeed = MATTER.Vector.magnitude(relativeVelocity);

        if (otherBody.mass >= COLLISION.minDamageMass && impactSpeed >= COLLISION.minDamageSpeed) {
          // Mass damage component (0 to 1 scale)
          const massRatio = Math.min(1, (otherBody.mass - COLLISION.minDamageMass) / (COLLISION.maxDamageMass - COLLISION.minDamageMass));

          // Speed damage multiplier (0.2 to 1 scale)
          const speedMultiplier = Math.min(1, Math.max(0.2, (impactSpeed - COLLISION.minDamageSpeed) / (COLLISION.maxDamageSpeed - COLLISION.minDamageSpeed)));

          // Combined damage: base damage (1-maxDamage) * speed multiplier
          const baseDamage = Math.floor(massRatio * COLLISION.maxDamage) + 1;
          const damage = Math.min(COLLISION.maxDamage, Math.max(1, Math.floor(baseDamage * speedMultiplier)));

          this.rocket.damage(damage);
        }
      }
    });
  }

}
