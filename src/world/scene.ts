import * as THREE from 'three';
import { container, GUI } from '../utils/autoinject';
import { addFunction } from '../utils/functionalUtils';
import { Destroyable } from '../types';

export interface Scene extends THREE.Scene, Destroyable { };

export function createScene(): Scene {
    const scene = new THREE.Scene();

    const sceneWithDestroy = addFunction(scene, 'destroy', () => {
        scene.children.forEach(child => {
            scene.remove(child);
        });
    });

    return sceneWithDestroy;
}
