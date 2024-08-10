import * as THREE from 'three';
import { container, GUI } from '../utils/autoinject';
import { addFunction } from '../utils/functionalUtils';
import { Destroyable } from './../types';

import planetVertexShader from '../shaders/planet/planet.vs';
import planetFragmentShader from '../shaders/planet/planet.fs';


export interface Planet extends THREE.Mesh, Destroyable { };

export interface PlanetParams {
    name?: string;
    color?: number;
    widthSegment?: number;
    heightSegment?: number;
}

const defaultParams: PlanetParams = {
    name: "Anonymous Planet",
    color: 0xFF00F0,
    widthSegment: 32,
    heightSegment: 32
}

export function createPlanet(
    radius: number,
    params?: PlanetParams,
    gui = container.resolve<GUI>("GUI")
): Planet {

    const sanitizedParams = { ...defaultParams, ...params };
    const { name, widthSegment, heightSegment, color } = sanitizedParams;

    // Create the material
    const material = new THREE.ShaderMaterial({
        vertexShader: planetVertexShader,
        fragmentShader: planetFragmentShader
    });

    const planet = new THREE.Mesh(
        new THREE.SphereGeometry(radius, widthSegment, heightSegment),
        // new THREE.MeshBasicMaterial({ color })
        material
    );

    const guiParams = {
        scale:planet.scale.x
    }

    const guiPlanet = gui.addFolder(name || "Planet");
    guiPlanet.add(planet.position, 'x', -1000, 1000);
    guiPlanet.add(planet.position, 'y', -1000, 1000);
    guiPlanet.add(guiParams, 'scale', 0.01, 10).onChange((value:number) => {
        planet.scale.set(value, value, value);
    })

    const planetWithDestroy = addFunction(planet, 'destroy', () => {
        guiPlanet.destroy();
        planet.geometry.dispose();
        planet.material.dispose();
    });

    return planetWithDestroy;
}
