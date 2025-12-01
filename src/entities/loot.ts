import "pathseg";
import "poly-decomp";
import * as MATTER from 'matter-js';
import { v4 as uuidv4 } from 'uuid';
import * as THREE from 'three';
import { completeAssign } from '../utils/functionalUtils';
import { Destroyable, Updatable } from './../types';
import * as Matter from 'matter-js';
import { getBoundsFromVertices } from "../utils/3dUtils";
import { getVerticesFromSVG } from "../utils/imageUtils";

export interface Loot extends Destroyable, Updatable {
    mesh: THREE.Mesh;
    setPosition(x: number, y: number): void;
    body: MATTER.Body;
    radius: number;
};

export async function createLoot(
    scale: number = 1,
): Promise<Loot> {

    // Always load loot.svg from assets
    const vertices = await getVerticesFromSVG(require('../assets/loot.svg'), 10);

    const scaledVertices = vertices.map(vertex => {
        return new THREE.Vector2(vertex.x * scale, vertex.y * scale);
    });

    const body = MATTER.Bodies.fromVertices(0, 0, [scaledVertices], {
        // isSensor: true, // Loot doesn't have physical collision, it's a trigger
        label: `loot-${uuidv4()}`,
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

    const material = new THREE.MeshBasicMaterial({ color: 0xFFD700 }); // Gold color for loot
    const mesh = new THREE.Mesh(
        geometry,
        material
    );

    const box = new THREE.Box2().setFromPoints(offsetVertices);
    const radius = box.getSize(new THREE.Vector2()).length() * 0.5;

    // Loot has minimal movement
    MATTER.Body.setAngularVelocity(body, Math.random() * 0.5);
    MATTER.Body.setVelocity(body, new THREE.Vector2(Math.random() * 0.5, Math.random() * 0.5));

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
