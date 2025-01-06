import * as THREE from 'three';
import { container, GUI } from '../utils/autoinject';
import { addFunction } from '../utils/functionalUtils';
import { Destroyable, Updatable } from './../types';

import floorVertexShader from '../shaders/floor/floor.vs';
import floorFragmentShader from '../shaders/floor/floor.fs';

export interface Floor extends THREE.Mesh, Destroyable { };


export interface FloorParams {
    size: number;
}

const defaultParams: Partial<FloorParams> = {
}

export function createFloor(
    heightMap: THREE.Texture,
    params?: FloorParams,
    gui = container.resolve<GUI>("GUI")
): Floor {

    const sanitizedParams = { ...defaultParams, ...params };
    let {
        size
    } = sanitizedParams;

    const material = new THREE.ShaderMaterial({
        vertexShader: floorVertexShader,
        fragmentShader: floorFragmentShader,
        uniforms: {
            uNoiseFreq: { value: 10 },
            uNoiseAmp: { value: 10 },
            uStep: { value: 1.7 },
            uColor1: { value: new THREE.Color(0x000000) },
            uColor2: { value: new THREE.Color(0xFFFFFF) },
            uHeightmap: { value: heightMap }
        }
    });
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(size, size, 1),
        material
    );

    const floorWithDestroy = addFunction(floor, 'destroy', () => {
        floor.geometry.dispose();
        floor.material.dispose();
    });

    const guiFloor = gui.addFolder('Floor');

    guiFloor.addColor(material.uniforms.uColor1, 'value').name('Color 1').onChange((value: number) => {
        material.uniforms.uColor1.value = value;
    })
    guiFloor.addColor(material.uniforms.uColor2, 'value').name('Color 2').onChange((value: number) => {
        material.uniforms.uColor2.value = value;
    })

    

    return floorWithDestroy;
}
