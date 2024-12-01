import * as THREE from 'three';
import { MAP } from '../conf';

export function to2D(pos: THREE.Vector3, camera: THREE.Camera) {

    let vector = pos.project(camera);
    vector.x = window.innerWidth * (vector.x + 1) / 2;
    vector.y = -window.innerHeight * (vector.y - 1) / 2;

    return new THREE.Vector2(vector.x, vector.y)
}

export function getNormalizedPosition(pos: THREE.Vector3 | THREE.Vector2) {
    return new THREE.Vector2(pos.x / MAP.size, pos.y / MAP.size);
}

export function getNormalizedDistance(distance: number) {
    return distance / MAP.size;
}