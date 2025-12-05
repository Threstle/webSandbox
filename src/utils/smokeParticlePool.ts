import * as THREE from 'three';
import * as MATTER from 'matter-js';
import { SmokeParticle, createSmokeParticle } from '../entities/smokeParticle';
import { Vec2 } from '../types';
import { SMOKE } from '../conf';

export class SmokeParticlePool {
  private particles: SmokeParticle[] = [];
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  spawn(pos: Vec2, force: Vec2 = { x: 0, y: 0 }, currentTime: number = 0, baseScale?:number, life?: number): SmokeParticle {
    // Try to find an inactive particle
    let particle = this.particles.find(p => !p.isAlive);

    if (particle) {
      particle.spawn(pos, force, currentTime, baseScale, life);
      return particle;
    }

    // Check if we've reached the pool limit
    if (this.particles.length >= SMOKE.poolSize) {
      // Pool is full, force-recycle the particle with least remaining life
      particle = this.particles.reduce((oldest, current) =>
        current.remainingLife < oldest.remainingLife ? current : oldest
      );
      particle.spawn(pos, force, currentTime, baseScale, life);
      return particle;
    }

    // Create new particle if none available and under limit
    const newParticle = createSmokeParticle();
    this.scene.add(newParticle.mesh);
    this.particles.push(newParticle);
    newParticle.spawn(pos, force, currentTime, baseScale, life);

    return newParticle;
  }

  update(time: number): void {
    this.particles.forEach(particle => particle.update(time));
  }

  getActiveCount(): number {
    return this.particles.filter(p => p.isAlive).length;
  }

  getTotalCount(): number {
    return this.particles.length;
  }

  getMaxPoolSize(): number {
    return SMOKE.poolSize;
  }

  isFull(): boolean {
    return this.particles.length >= SMOKE.poolSize;
  }

  destroy(): void {
    this.particles.forEach(particle => {
      this.scene.remove(particle.mesh);
      particle.destroy();
    });
    this.particles = [];
  }
}
