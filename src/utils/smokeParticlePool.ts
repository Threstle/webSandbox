import * as THREE from 'three';
import { SmokeParticle, createSmokeParticle } from '../entities/smokeParticle';
import { Vec2 } from '../types';

export class SmokeParticlePool {
  private particles: SmokeParticle[] = [];
  private scene: THREE.Scene;
  private maxPoolSize: number;

  constructor(scene: THREE.Scene, maxPoolSize: number = 1000) {
    this.scene = scene;
    this.maxPoolSize = maxPoolSize;
  }

  spawn(pos: Vec2, force: Vec2 = { x: 0, y: 0 }, currentTime: number = 0): SmokeParticle {
    // Try to find an inactive particle
    let particle = this.particles.find(p => !p.isAlive);

    if (particle) {
      particle.spawn(pos, force, currentTime);
      return particle;
    }

    // Check if we've reached the pool limit
    if (this.particles.length >= this.maxPoolSize) {
      // Pool is full, force-recycle the particle with least remaining life
      particle = this.particles.reduce((oldest, current) =>
        current.remainingLife < oldest.remainingLife ? current : oldest
      );
      particle.spawn(pos, force, currentTime);
      return particle;
    }

    // Create new particle if none available and under limit
    const newParticle = createSmokeParticle();
    this.scene.add(newParticle.mesh);
    this.particles.push(newParticle);
    newParticle.spawn(pos, force, currentTime);

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
    return this.maxPoolSize;
  }

  isFull(): boolean {
    return this.particles.length >= this.maxPoolSize;
  }

  destroy(): void {
    this.particles.forEach(particle => {
      this.scene.remove(particle.mesh);
      particle.destroy();
    });
    this.particles = [];
  }
}
