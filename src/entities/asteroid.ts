import "pathseg";
import "poly-decomp";
import * as MATTER from 'matter-js';
import * as THREE from 'three';
import { completeAssign } from '../utils/functionalUtils';
import { Destroyable, Updatable, Vec2, Vec3 } from './../types';
import * as Matter from 'matter-js';
import { getBoundsFromVertices } from "../utils/3dUtils";

export interface Asteroid extends Destroyable, Updatable {
    mesh: THREE.Mesh;
    setPosition(x: number, y: number): void;
    body: MATTER.Body;
};

export async function createAsteroid(
    vertices: THREE.Vector2[],
    scale: number,
): Promise<Asteroid> {


    const scaledVertices = vertices.map(vertex => {
        return new THREE.Vector2(vertex.x * scale, vertex.y * scale);
    });

    const body = MATTER.Bodies.fromVertices(0, 0, [scaledVertices], {
        friction: 0,
        mass: 100 * scale,
    });

    const ogBounds = getBoundsFromVertices(scaledVertices);
    const bodyBounds = body.bounds;

    const offset = [
        ogBounds.minX - bodyBounds.min.x,
        ogBounds.minY - bodyBounds.min.y,
        ogBounds.maxX - bodyBounds.max.x,
        ogBounds.maxY - bodyBounds.max.y,
    ];

    const offsetVertices = scaledVertices.map((vertex) => new THREE.Vector2(vertex.x - offset[0], vertex.y - offset[1]));


    const shape = new THREE.Shape();
    shape.setFromPoints(offsetVertices);
    const geometry = new THREE.ShapeGeometry(shape);

    const material = new THREE.MeshBasicMaterial({ color: 0x00FF00});
    const mesh = new THREE.Mesh(
        geometry,
        material
    );

    // const meshDebug = new THREE.Mesh(
    //     new THREE.BoxGeometry(10, 10, 1),
    //     new THREE.MeshBasicMaterial({ color: 0xFF0000, side: THREE.DoubleSide })
    // );

    // mesh.add(meshDebug);

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
