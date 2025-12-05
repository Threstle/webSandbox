import "pathseg";
import "poly-decomp";
import * as MATTER from 'matter-js';
import * as THREE from 'three';
import { completeAssign } from '../utils/functionalUtils';
import { Destroyable, Updatable, Vec2, Vec3 } from './../types';
import * as Matter from 'matter-js';
import { SMOKE } from "../conf";

export interface SmokeParticle extends Destroyable, Updatable {
    mesh: THREE.Mesh;
    spawn(pos: Vec2, force?: Vec2, currentTime?: number, baseScale?: number, life?: number): void;
    isAlive: boolean;
    remainingLife: number;
};

export function createSmokeParticle(
): SmokeParticle {

    let startingLife = 0;
    let remainingLife = 0;
    let isAlive = false;
    let velocity = new THREE.Vector2(0,0);

    const geometry = new THREE.PlaneGeometry(2, 2);

    const material = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true });
    const mesh = new THREE.Mesh(
        geometry,
        material
    );
    mesh.position.z = -0.1;

    const base = {
        mesh,
    }

    const decayVelocity = () => {
        velocity.multiplyScalar(SMOKE.decaySpeed);
    }

    let lastTimestamp = 0;
    const update = (time: number) => {

        if (!isAlive) return;

        material.opacity = remainingLife / startingLife;


        if (time - lastTimestamp > 10) {
            remainingLife -= 1;
            lastTimestamp = time;
            decayVelocity();
            mesh.position.x += velocity.x;
            mesh.position.y += velocity.y;
        }

        if (remainingLife <= 0) {
            remainingLife = 10;
            isAlive = false;
        }

    }


    const spawn = (pos: Vec2, force: Vec2, currentTime: number = 0, baseScale: number = 10, life: number = 100) => {
        let scale = baseScale * Math.random();

        mesh.scale.set(scale, scale, 1);
        
        isAlive = true;
        startingLife = life;
        remainingLife = startingLife;
        lastTimestamp = currentTime;
        mesh.position.set(pos.x, pos.y, mesh.position.z);
        velocity.set(force.x, force.y);
    }




    const destroy = () => {
        mesh.geometry.dispose();
        mesh.material.dispose();
    }

    return completeAssign(base, {
        spawn,
        update,
        destroy,
        get isAlive() { return isAlive },
        get remainingLife() { return remainingLife }
    });

}
