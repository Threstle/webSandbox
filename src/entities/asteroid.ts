import "pathseg";
import "poly-decomp";
import * as MATTER from 'matter-js';
import { v4 as uuidv4 } from 'uuid';
import * as THREE from 'three';
import { completeAssign } from '../utils/functionalUtils';
import { Destroyable, Updatable, Vec2, Vec3 } from './../types';
import * as Matter from 'matter-js';
import { getBoundsFromVertices } from "../utils/3dUtils";

export interface Asteroid extends Destroyable, Updatable {
    mesh: THREE.Mesh;
    setPosition(x: number, y: number): void;
    body: MATTER.Body;
    radius:number
};

export async function createAsteroid(
    vertices: THREE.Vector2[],
    scale: number = 1,
): Promise<Asteroid> {


    const scaledVertices = vertices.map(vertex => {
        return new THREE.Vector2(vertex.x * scale, vertex.y * scale);
    });

    const body = MATTER.Bodies.fromVertices(0, 0, [scaledVertices], {
    restitution: 0,
    friction: 0.003*scale,
    frictionStatic: 1,
    frictionAir: 0.05,
        mass: 1000 * scale,
        label: `asteroid-${uuidv4()}`,
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

    const material = new THREE.MeshBasicMaterial({ color: 0xAAAAAA });
    const mesh = new THREE.Mesh(
        geometry,
        material
    );

    const box = new THREE.Box2().setFromPoints(offsetVertices);
    const radius = box.getSize(new THREE.Vector2()).length() * 0.5;

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
        radius
    });

}
