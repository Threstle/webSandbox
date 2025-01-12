import * as MATTER from 'matter-js';
import * as THREE from 'three';
import { container, GUI } from '../utils/autoinject';
import { addFunction, completeAssign } from '../utils/functionalUtils';
import { Destroyable, Updatable, Vec2, Vec3 } from './../types';
import * as Matter from 'matter-js';
import { setLabelColor, setLabelText } from '../utils/uiUtils';

export interface Asteroid extends Destroyable, Updatable {
    mesh: THREE.Mesh;
    setPosition(x: number, y: number): void;
    body: MATTER.Body;
};



export function createAsteroid(
    width: number,
    height: number
): Asteroid {


    const material = new THREE.MeshBasicMaterial({ color: 0x00FF00 });
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, 1),
        material
    );

    const body = MATTER.Bodies.rectangle(0, 0, width, height, {
        friction: 1,
        mass: 10,

    });

    MATTER.Body.setAngularVelocity(body, Math.random()*1);
    MATTER.Body.setVelocity(body, new THREE.Vector2(Math.random()*1,Math.random()*1));

    const base = {
        mesh,
        body,
    }

    const updatePositionFromBody = () => {
        mesh.position.set(body.position.x, body.position.y, mesh.position.z);
        mesh.rotation.z = -body.angle;
    }

    let lastTimestamp = 0;
    const update = (time: number) => {
        updatePositionFromBody();
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
        update,
        destroy,
        setPosition,
    });

}
