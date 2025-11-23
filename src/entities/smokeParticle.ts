import "pathseg";
import "poly-decomp";
import * as MATTER from 'matter-js';
import * as THREE from 'three';
import { completeAssign } from '../utils/functionalUtils';
import { Destroyable, Updatable, Vec2, Vec3 } from './../types';
import * as Matter from 'matter-js';

export interface SmokeParticle extends Destroyable, Updatable {
    mesh: THREE.Mesh;
    body: MATTER.Body;
    setPosition(x: number, y: number): void;
    spawn(pos:Vec2, force?: Vec2, currentTime?: number): void;
    isAlive: boolean;
    remainingLife: number;
};

export function createSmokeParticle(
): SmokeParticle {

    let remainingLife = 100;
    let isAlive = false;

    const body = MATTER.Bodies.rectangle(0, 0, 5, 5, {
        friction: 0,
        mass: 0.1,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);

    const material = new THREE.MeshBasicMaterial({ color: 0x0000FF, transparent: true });
    const mesh = new THREE.Mesh(
        geometry,
        material
    );

    MATTER.Body.setAngularVelocity(body, Math.random() * 2);
    MATTER.Body.setVelocity(body, new THREE.Vector2(Math.random() * 2, Math.random() * 2));

    const base = {
        mesh,
        body,
    }

    const updatePositionFromBody = () => {
        mesh.position.set(body.position.x, body.position.y, mesh.position.z);
        mesh.rotation.z = body.angle;
    }

    let lastTimestamp = 0;
    const update = (time: number) => {

        if (!isAlive) return;

        material.opacity = remainingLife / 100;

        updatePositionFromBody();

        if (time - lastTimestamp > 10) {
            remainingLife -= 1;
            lastTimestamp = time;
        }

        if (remainingLife <= 0) {
            remainingLife = 10;
            isAlive = false;
        }

    }


    const spawn = (pos:Vec2, force: Vec2 = {x:0,y:0}, currentTime: number = 0) => {
        let scale = Math.random()*10;

        mesh.scale.set(scale, scale, 1);
        MATTER.Body.scale(body, scale,scale);

        isAlive = true;
        remainingLife = 100;
        lastTimestamp = currentTime;
        setPosition(pos.x, pos.y);
        MATTER.Body.setVelocity(body, force);
    }

    const setPosition = (x: number, y: number) => {
        Matter.Body.setPosition(body, MATTER.Vector.create(x, y));
        updatePositionFromBody();
    }

    const destroy = () => {
        mesh.geometry.dispose();
        mesh.material.dispose();
    }

    return completeAssign(base, {
        spawn,
        update,
        destroy,
        setPosition,
        get isAlive() { return isAlive },
        get remainingLife() { return remainingLife }
    });

}
